import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { ResolutionContext, ResolutionRecommendation, ResolutionRecommendationDraft } from "../../types/resolution";

const reasonSchema=z.object({statement:z.string().trim().min(1).max(800),sourceType:z.enum(["fact","timeline","evidence","policy","system"]),sourceId:z.string().trim().min(1).max(200),confidence:z.enum(["high","medium","low"])}).strict();
const evidenceReferenceSchema=z.object({evidenceId:z.string().trim().min(1).max(200),reason:z.string().trim().min(1).max(500),sourceText:z.string().max(2000).optional()}).strict();
const policySchema=z.object({id:z.string().trim().min(1),title:z.string().trim().min(1),summary:z.string().trim().min(1),category:z.string().trim().min(1),sourceType:z.literal("synthetic_demo_policy"),sourceUrl:z.string().url().optional(),effectiveDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()}).strict();
const recommendationSchema=z.object({caseId:z.string().trim().min(1),title:z.string().trim().min(1).max(200),action:z.string().trim().min(1).max(1000),explanation:z.string().trim().min(1).max(3000),reasons:z.array(reasonSchema).min(1).max(20),supportingEvidence:z.array(evidenceReferenceSchema).max(20),unresolvedQuestions:z.array(z.string().trim().min(1).max(500)).max(20),risks:z.array(z.string().trim().min(1).max(500)).max(20).optional(),confidence:z.enum(["high","medium","low"]),priority:z.enum(["urgent","important","normal"]),requiresUserApproval:z.literal(true),status:z.enum(["draft","ready_for_review","approved","rejected","needs_more_information"]).optional(),policyReferences:z.array(policySchema).max(20)}).passthrough();

const unsupportedClaimPatterns=[
  /\b(?:the )?seller (?:violated|broke) (?:the )?(?:law|consumer law)\b/i,
  /\b(?:this|that|it) is illegal\b/i,
  /\b(?:the )?seller (?:committed|is committing) fraud\b/i,
  /\b(?:this|that|it) is fraud\b/i,
  /\b(?:the )?seller stole\b/i,
  /\btheft (?:occurred|is confirmed)\b/i,
  /\blegally (?:required|entitled)\b/i,
  /\bstatutory (?:right|violation)\b/i,
];

export function validateRecommendationDraft(input:unknown,context:ResolutionContext):string[]{
  const parsed=recommendationSchema.safeParse(input);
  if(!parsed.success)return parsed.error.issues.map(issue=>`Malformed recommendation: ${issue.path.join(".")||"result"} ${issue.message}`);
  const draft=parsed.data;
  const issues:string[]=[];
  if(draft.caseId!==context.case.id)issues.push("Recommendation case does not match the case context.");
  const claimText=`${draft.title} ${draft.action} ${draft.explanation} ${draft.reasons.map(reason=>reason.statement).join(" ")}`;
  if(unsupportedClaimPatterns.some(pattern=>pattern.test(claimText)))issues.push("Recommendation contains an unsupported legal or fraud conclusion.");
  const factIds=new Set(context.facts.map(fact=>fact.id));
  const evidenceIds=new Set(context.evidence.map(evidence=>evidence.id));
  const timelineIds=new Set(context.timeline.map(event=>event.id));
  const conflictIds=new Set(context.conflicts.map(conflict=>conflict.id));
  const missingIds=new Set(context.missingInformation.map(item=>item.id));
  const policyIds=new Set(context.policyReferences.map(policy=>policy.id));
  for(const policy of draft.policyReferences)if(!policyIds.has(policy.id))issues.push("Recommendation includes an unknown policy reference.");
  for(const reason of draft.reasons){
    if(reason.sourceType==="fact"&&!factIds.has(reason.sourceId))issues.push("A recommendation reason references an unknown fact.");
    if(reason.sourceType==="evidence"&&!evidenceIds.has(reason.sourceId))issues.push("A recommendation reason references unknown evidence.");
    if(reason.sourceType==="timeline"&&!timelineIds.has(reason.sourceId))issues.push("A recommendation reason references an unknown timeline event.");
    if(reason.sourceType==="policy"&&!policyIds.has(reason.sourceId))issues.push("A recommendation reason references an unknown policy item.");
    if(reason.sourceType==="system"&&!missingIds.has(reason.sourceId)&&!conflictIds.has(reason.sourceId)&&reason.sourceId!=="case-description"&&reason.sourceId!=="case-completeness")issues.push("A system reason is not traceable to a known case check.");
  }
  for(const reference of draft.supportingEvidence)if(!evidenceIds.has(reference.evidenceId))issues.push("Supporting evidence references an unknown file.");
  return [...new Set(issues)];
}

export function materializeRecommendation(draft:ResolutionRecommendationDraft):ResolutionRecommendation {
  return {...draft,id:`recommendation-${randomUUID()}`,status:draft.status??"ready_for_review",createdAt:new Date().toISOString()};
}
