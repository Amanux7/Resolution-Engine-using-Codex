import type { ResolutionRecommendation } from "./resolution";

export type CaseStatus = "draft" | "intake" | "evidence_processing" | "review" | "action_ready" | "resolved" | "archived";
export type Priority = "low" | "medium" | "high";
export type EvidenceSourceType = "upload" | "user_input" | "generated" | "synthetic" | "external";
export type ProvenanceSourceType = "user_statement" | "uploaded_file" | "structured_input" | "system_calculation" | "external_source" | "synthetic_demo";
export type CreatedBy = "user" | "system" | "agent" | "tool" | "imported_source";
export type ExtractionMethod = "user" | "parser" | "ocr" | "llm" | "system" | "synthetic";
export type EvidenceProcessingStatus = "pending" | "processing" | "processed" | "failed" | "needs_processing";
export interface Provenance { sourceType: ProvenanceSourceType; sourceId?: string; confidence: number; createdBy: CreatedBy; }
export interface IntakeField { label: string; value?: string; state: "found" | "not_provided" | "needs_confirmation"; provenance?: Provenance; }
export type FactType = "person" | "organization" | "order_id" | "product" | "amount" | "currency" | "date" | "delivery_date" | "purchase_date" | "complaint_date" | "refund_date" | "communication" | "status" | "location" | "deadline" | "promised_action" | "generic";
export interface EvidenceProcessingMetadata { provider:"openai"|"mock"; model?:string; processorVersion:string; processedAt:string; }
export interface Evidence { id:string; caseId:string; filename:string; mimeType:string; size:number; storageKey:string; storageUrl?:string; sourceType:EvidenceSourceType; processingStatus:EvidenceProcessingStatus; extractedFactsCount:number; uploadedAt:string; createdAt:string; updatedAt:string; sizeLabel?:string; errorMessage?:string; processingMetadata?:EvidenceProcessingMetadata; }
export interface Fact extends Provenance { id:string; caseId:string; factType:FactType; value:string; normalizedValue?:string; text:string; sourceText?:string; extractionMethod:ExtractionMethod; createdAt:string; }
export interface Conflict { id:string; caseId:string; factAId:string; factBId:string; reason:string; severity:"low"|"medium"|"high"; createdAt:string; }
export interface MissingInformation { id:string; caseId:string; label:string; state:"missing"|"unknown"|"unverified"; reason:string; expectedFactType:FactType; createdAt:string; }
export interface TimelineEvent extends Provenance { id:string; caseId:string; title:string; description:string; eventDate:string; sourceFactId?:string; createdAt:string; }
export interface Task { id:string; caseId:string; title:string; description:string; status:"todo"|"in_progress"|"done"; priority:Priority; dueAt?:string; createdAt:string; }
export type Recommendation = ResolutionRecommendation;
export interface Communication { id:string; caseId:string; channel:"email"|"message"|"letter"; recipient:string; subject:string; body:string; status:"draft"|"approved"|"sent"; createdAt:string; }
export interface CaseReadiness { factsFound:number; factsExpected:number; evidenceProcessed:number; evidenceTotal:number; timelineComplete:boolean; conflicts:number; missingDetails:number; label:"Needs evidence"|"Needs review"|"Ready for review"; }
export interface Case { id:string; userId:string; title:string; category:string; description:string; status:CaseStatus; priority:Priority; createdAt:string; updatedAt:string; situation:{problem:string;currentSituation:string;orderReference?:string;amount?:string;fields:IntakeField[]}; people:Array<{id:string;name:string;role:string;provenance:Provenance}>; facts:Fact[]; evidence:Evidence[]; timeline:TimelineEvent[]; conflicts:Conflict[]; missingInformation:MissingInformation[]; tasks:Task[]; recommendations:Recommendation[]; communications:Communication[]; readiness:CaseReadiness; }
