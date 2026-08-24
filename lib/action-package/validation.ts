import { z } from "zod";
import type { ActionPackage, ActionPackageStatus, CommunicationContext, CommunicationDraft, UnsupportedStatement } from "../../types/action-package";

const unsafeClaim=/\b(committed fraud|fraudulent|stole my money|theft|violat(?:e|ed|ing) (?:the )?law|illegal|criminal|legal entitlement|statutory right)\b/i;
const inventedDeadline=/\b(?:within|by)\s+\d+\s+(?:business |working )?days\b/i;

export function findUnsupportedStatements(body:string,generatedBody:string):UnsupportedStatement[]{
  if(body===generatedBody)return [];
  const added=body.split(/(?<=[.!?])\s+/).filter(sentence=>sentence&&!generatedBody.includes(sentence));
  return added.map(text=>({text,severity:unsafeClaim.test(text)||inventedDeadline.test(text)?"confirmation_required":"warning",reason:"This statement is not supported by the evidence currently in your case."}));
}

export function validateCommunicationDraft(draft:CommunicationDraft,context:CommunicationContext){
  if(unsafeClaim.test(draft.generatedBody))throw new Error("Generated communication contains an unsupported legal, fraud, or theft claim.");
  if(inventedDeadline.test(draft.generatedBody))throw new Error("Generated communication contains an unsupported deadline.");
  const ids={fact:new Set(context.facts.map(x=>x.id)),timeline:new Set(context.timeline.map(x=>x.id)),evidence:new Set(context.evidence.map(x=>x.id)),recommendation:new Set([context.recommendation.id])};
  for(const claim of draft.claims){if(!ids[claim.sourceType].has(claim.sourceId))throw new Error(`Communication claim references an unknown ${claim.sourceType} source.`);}
  return draft;
}

const allowedTransitions:Record<ActionPackageStatus,ActionPackageStatus[]>={draft:["ready_for_review"],ready_for_review:["approved","needs_changes"],approved:["ready_to_use","needs_changes"],needs_changes:["ready_for_review"],ready_to_use:[]};
export function canTransitionActionPackage(from:ActionPackageStatus,to:ActionPackageStatus){return allowedTransitions[from].includes(to);}

const packageSchema=z.object({id:z.string().min(1),caseId:z.string().min(1),recommendationId:z.string().min(1),type:z.enum(["seller_message","support_message","grievance_draft","resolution_pack"]),title:z.string().min(1),summary:z.string().min(1),status:z.enum(["draft","ready_for_review","approved","needs_changes","ready_to_use"]),provenance:z.array(z.object({section:z.enum(["case_summary","evidence","timeline","communication","recommendation"]),sourceType:z.enum(["fact","evidence","timeline","recommendation"]),sourceId:z.string().min(1)})).min(1)}).passthrough();
export function validateActionPackage(value:unknown,context:CommunicationContext):ActionPackage{
  const parsed=packageSchema.parse(value) as unknown as ActionPackage;
  const valid=new Set([...context.facts.map(x=>x.id),...context.evidence.map(x=>x.id),...context.timeline.map(x=>x.id),context.recommendation.id]);
  if(parsed.provenance.some(item=>!valid.has(item.sourceId)))throw new Error("Action package contains provenance outside this case.");
  if(parsed.communication)validateCommunicationDraft(parsed.communication,context);
  return parsed;
}
