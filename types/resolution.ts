import type { Case, Conflict, Evidence, Fact, MissingInformation, TimelineEvent } from "./case";

export type RecommendationConfidence = "high" | "medium" | "low";
export type RecommendationPriority = "urgent" | "important" | "normal";
export type RecommendationStatus = "draft" | "ready_for_review" | "approved" | "rejected" | "needs_more_information";
export type ResolutionReasonSource = "fact" | "timeline" | "evidence" | "policy" | "system";

export interface ResolutionContext {
  case: Case;
  facts: Fact[];
  evidence: Evidence[];
  timeline: TimelineEvent[];
  conflicts: Conflict[];
  missingInformation: MissingInformation[];
  policyReferences: PolicyReference[];
}

export interface PolicyReference {
  id: string;
  title: string;
  summary: string;
  category: string;
  sourceType: "synthetic_demo_policy";
  sourceUrl?: string;
  effectiveDate?: string;
}

export interface ResolutionReason {
  statement: string;
  sourceType: ResolutionReasonSource;
  sourceId: string;
  confidence: RecommendationConfidence;
}

export interface EvidenceReference {
  evidenceId: string;
  reason: string;
  sourceText?: string;
}

export interface ResolutionActionCandidate {
  id: string;
  title: string;
  action: string;
  explanation: string;
  reasons: ResolutionReason[];
  supportingEvidence: EvidenceReference[];
  unresolvedQuestions: string[];
  risks: string[];
  confidence: RecommendationConfidence;
  priority: RecommendationPriority;
  scores: {
    evidenceSupport: number;
    urgency: number;
    userEffort: number;
    reversibility: number;
    uncertainty: number;
    risk: number;
    total: number;
  };
}

export interface ResolutionRecommendation {
  id: string;
  caseId: string;
  title: string;
  action: string;
  explanation: string;
  reasons: ResolutionReason[];
  supportingEvidence: EvidenceReference[];
  unresolvedQuestions: string[];
  risks?: string[];
  confidence: RecommendationConfidence;
  priority: RecommendationPriority;
  requiresUserApproval: boolean;
  status: RecommendationStatus;
  policyReferences: PolicyReference[];
  createdAt: string;
}

export type ResolutionRecommendationDraft = Omit<ResolutionRecommendation, "id" | "createdAt" | "status"> & {
  status?: Extract<RecommendationStatus, "draft" | "ready_for_review" | "needs_more_information">;
};

export interface CaseCompleteness {
  ready: boolean;
  missing: string[];
  notes: string[];
}

export interface ToolExecution {
  toolName: string;
  startedAt: string;
  completedAt: string;
  status: "success" | "failed";
  inputSummary: string;
  outputSummary: string;
}

export interface ResolutionRun {
  recommendation: ResolutionRecommendation;
  candidates: ResolutionActionCandidate[];
  toolExecutions: ToolExecution[];
}
