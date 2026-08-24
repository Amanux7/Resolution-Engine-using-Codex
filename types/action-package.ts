import type { Case, Conflict, Evidence, Fact, MissingInformation, TimelineEvent } from "./case";
import type { ResolutionRecommendation } from "./resolution";

export type ActionPackageType = "seller_message" | "support_message" | "grievance_draft" | "resolution_pack";
export type ActionPackageStatus = "draft" | "ready_for_review" | "approved" | "needs_changes" | "ready_to_use";
export type CommunicationChannel = "email" | "support_chat" | "grievance" | "generic";
export type CommunicationTone = "clear" | "firm" | "formal";
export type CommunicationStatus = "generated" | "edited" | "approved";
export interface CommunicationClaim { id:string; text:string; sourceType:"fact"|"timeline"|"evidence"|"recommendation"; sourceId:string; verificationStatus:"verified"|"user_provided"|"inferred"; }
export interface UnsupportedStatement { text:string; severity:"warning"|"confirmation_required"; reason:string; }
export interface CommunicationDraft { id:string; channel:CommunicationChannel; recipientLabel?:string; subject?:string; body:string; generatedBody:string; claims:CommunicationClaim[]; tone:CommunicationTone; status:CommunicationStatus; unsupportedStatements:UnsupportedStatement[]; createdAt:string; updatedAt:string; }
export interface CaseSummary { issue:string; currentStatus:string; amount?:string; organization?:string; orderId?:string; }
export interface EvidenceIndexItem { evidenceId:string; label:string; supports:string[]; }
export interface TimelineSummaryItem { eventId:string; date?:string; description:string; sourceIds:string[]; }
export interface NextStepInstruction { order:number; instruction:string; requiresUserAction:boolean; }
export interface KeyFactItem { factId:string; text:string; state:"verified"|"user_provided"|"inferred"; }
export interface ConflictSummaryItem { conflictId:string; description:string; sourceIds:string[]; }
export interface ActionPackageProvenance { section:"case_summary"|"evidence"|"timeline"|"communication"|"recommendation"; sourceType:"fact"|"evidence"|"timeline"|"recommendation"; sourceId:string; }
export interface ResolutionDestination { type:"seller"|"support"|"consumer_grievance"|"other"; label:string; integrationStatus:"manual"|"future_integration"; }
export interface ActionPackage { id:string; caseId:string; recommendationId:string; type:ActionPackageType; title:string; summary:string; communication?:CommunicationDraft; caseSummary:CaseSummary; keyFacts:KeyFactItem[]; evidenceIndex:EvidenceIndexItem[]; timelineSummary:TimelineSummaryItem[]; conflictSummary:ConflictSummaryItem[]; unresolvedQuestions:string[]; nextSteps:NextStepInstruction[]; provenance:ActionPackageProvenance[]; destination:ResolutionDestination; status:ActionPackageStatus; createdAt:string; updatedAt:string; }
export interface CommunicationContext { case:Case; recommendation:ResolutionRecommendation; facts:Fact[]; evidence:Evidence[]; timeline:TimelineEvent[]; conflicts:Conflict[]; missingInformation:MissingInformation[]; userInstruction?:string; }
export interface GenerateCommunicationDraftInput { context:CommunicationContext; tone:CommunicationTone; channel:CommunicationChannel; userInstruction?:string; }
