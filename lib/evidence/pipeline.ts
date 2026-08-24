import { randomUUID } from "node:crypto";
import type { Case, Evidence, Fact } from "../../types/case";
import { MockAIProvider, type ExtractedFactCandidate } from "../ai/provider";
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
function toFact(candidate:ExtractedFactCandidate,evidence:Evidence):Fact{const sourceText=candidate.sourceText?.trim();return {id:`fact-${randomUUID()}`,caseId:evidence.caseId,factType:candidate.factType,value:candidate.value,normalizedValue:candidate.normalizedValue,text:sourceText??candidate.value,sourceText,sourceType:sourceType(evidence),sourceId:evidence.id,confidence:candidate.confidence,createdBy:"system",extractionMethod:candidate.extractionMethod,createdAt:new Date().toISOString()};}
export async function processEvidence(evidenceId:string,userId:string):Promise<ProcessResult>{const repositories=getRepositories();const storage=getStorageProvider();const evidence=await repositories.evidence.getById(evidenceId);if(!evidence)throw new Error("We couldn't find that evidence.");const caseData=await repositories.getAggregate(evidence.caseId,userId);if(!caseData)throw new Error("We couldn't find that case.");await repositories.evidence.updateProcessingStatus(evidence.id,"processing");try{const extractor=getContentExtractor(evidence.mimeType);if(!extractor)throw new Error("This file type cannot be processed.");const content=await extractor.extract({storageKey:evidence.storageKey,storage});if(content.status!=="processed"){const updated=await repositories.evidence.updateProcessingStatus(evidence.id,content.status,{errorMessage:content.message,extractedFactsCount:0});const latest=await repositories.getAggregate(evidence.caseId,userId);return {evidence:updated!,caseData:latest!,facts:latest!.facts};}
    let candidates:ExtractedFactCandidate[]=extractFactsFromText(content.text);if(process.env.RESOLUTION_USE_AI_EXTRACTION==="true"){const aiCandidates=await new MockAIProvider().extractFacts({text:content.text,filename:evidence.filename,mimeType:evidence.mimeType});candidates=[...candidates,...aiCandidates];}
    const facts=candidates.filter(candidate=>{try{return validateExtractedFact(candidate,{caseId:evidence.caseId,sourceId:evidence.id,sourceText:content.text});}catch{return false;}}).map(candidate=>toFact(candidate,evidence));
    const storedFacts=await repositories.facts.replaceForEvidence(evidence.caseId,evidence.id,facts);const conflicts=detectConflicts(evidence.caseId,storedFacts);const missing=findMissingInformation(evidence.caseId,storedFacts);const timeline=buildTimeline(evidence.caseId,storedFacts);await repositories.conflicts.replaceForCase(evidence.caseId,conflicts);await repositories.missing.replaceForCase(evidence.caseId,missing);await repositories.timeline.replaceForCase(evidence.caseId,timeline);const updated=await repositories.evidence.updateProcessingStatus(evidence.id,"processed",{extractedFactsCount:facts.length,errorMessage:undefined});await repositories.setStatus(evidence.caseId,userId,"review");const latest=await repositories.getAggregate(evidence.caseId,userId);return {evidence:updated!,caseData:latest!,facts:latest!.facts};
  }catch(error){const message=error instanceof Error?error.message:"We couldn't process this file.";const updated=await repositories.evidence.updateProcessingStatus(evidence.id,"failed",{errorMessage:message});throw Object.assign(new Error(message),{evidence:updated});}}
