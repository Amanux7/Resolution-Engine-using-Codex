import { randomUUID } from "node:crypto";
import type { Case, Evidence, Fact } from "../../types/case";
import { getAIProvider, type ExtractedFactCandidate } from "../ai/provider";
import { getRepositories } from "../db";
import { getStorageProvider } from "../storage";
import { getContentExtractor } from "./extractors";
import { extractFactsFromText } from "../facts/rule-based";
import { validateExtractedFact } from "../facts/validation";
import { detectConflicts } from "../facts/conflicts";
import { findMissingInformation } from "../facts/missing";
import { buildTimeline } from "../timeline/builder";

export interface ProcessResult { evidence:Evidence; caseData:Case; facts:Fact[]; }
function sourceType(evidence:Evidence){return evidence.sourceType==="synthetic"?"synthetic_demo":"uploaded_file" as const;}
function toFact(candidate:ExtractedFactCandidate,evidence:Evidence):Fact{const sourceText=candidate.sourceText?.trim();return {id:`fact-${randomUUID()}`,caseId:evidence.caseId,factType:candidate.factType,value:candidate.value,normalizedValue:candidate.normalizedValue,text:sourceText??candidate.value,sourceText,sourceType:sourceType(evidence),sourceId:evidence.id,confidence:candidate.confidence,createdBy:candidate.extractionMethod==="llm"?"agent":"system",extractionMethod:candidate.extractionMethod,createdAt:new Date().toISOString()};}

/** Provider responses are candidates: this is the only path that validates and persists evidence facts. */
export async function processEvidence(evidenceId:string,userId:string):Promise<ProcessResult>{
  const repositories=getRepositories();const storage=getStorageProvider();const evidence=await repositories.evidence.getById(evidenceId);
  if(!evidence)throw new Error("We couldn't find that evidence.");
  const caseData=await repositories.getAggregate(evidence.caseId,userId);
  if(!caseData)throw new Error("We couldn't find that case.");
  await repositories.evidence.updateProcessingStatus(evidence.id,"processing");
  try{
    const extractor=getContentExtractor(evidence.mimeType);
    if(!extractor)throw new Error("This file type cannot be processed.");
    let candidates:ExtractedFactCandidate[]=[];let processingMetadata:Evidence["processingMetadata"];
    if(evidence.mimeType.startsWith("image/")&&process.env.AI_MODE==="openai"){
      candidates=await getAIProvider().extractFacts({imageData:await storage.read(evidence.storageKey),evidenceId:evidence.id,filename:evidence.filename,mimeType:evidence.mimeType});
      processingMetadata={provider:"openai",model:process.env.OPENAI_MODEL??"gpt-4.1-mini",processorVersion:"stage5-image-v1",processedAt:new Date().toISOString()};
    }else{
      const content=await extractor.extract({storageKey:evidence.storageKey,storage});
      if(content.status!=="processed"){
        const updated=await repositories.evidence.updateProcessingStatus(evidence.id,content.status,{errorMessage:content.message,extractedFactsCount:0});
        const latest=await repositories.getAggregate(evidence.caseId,userId);
        return {evidence:updated!,caseData:latest!,facts:latest!.facts};
      }
      candidates=extractFactsFromText(content.text);
      processingMetadata={provider:"mock",processorVersion:"deterministic-text-v1",processedAt:new Date().toISOString()};
    }
    const facts=candidates.filter(candidate=>{try{return validateExtractedFact(candidate,{caseId:evidence.caseId,sourceId:evidence.id,sourceText:candidate.sourceText});}catch{return false;}}).map(candidate=>toFact(candidate,evidence));
    const storedFacts=await repositories.facts.replaceForEvidence(evidence.caseId,evidence.id,facts);
    await repositories.conflicts.replaceForCase(evidence.caseId,detectConflicts(evidence.caseId,storedFacts));
    await repositories.missing.replaceForCase(evidence.caseId,findMissingInformation(evidence.caseId,storedFacts));
    await repositories.timeline.replaceForCase(evidence.caseId,buildTimeline(evidence.caseId,storedFacts));
    const updated=await repositories.evidence.updateProcessingStatus(evidence.id,"processed",{extractedFactsCount:facts.length,errorMessage:undefined,processingMetadata});
    await repositories.setStatus(evidence.caseId,userId,"review");
    const latest=await repositories.getAggregate(evidence.caseId,userId);
    return {evidence:updated!,caseData:latest!,facts:latest!.facts};
  }catch(error){
    const message=error instanceof Error?error.message:"We couldn't process this file.";
    const updated=await repositories.evidence.updateProcessingStatus(evidence.id,"failed",{errorMessage:message,extractedFactsCount:0});
    throw Object.assign(new Error(message),{evidence:updated});
  }
}
