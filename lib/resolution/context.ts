import type { Case } from "../../types/case";
import type { ResolutionContext } from "../../types/resolution";

export function buildResolutionContext(caseData:Case,policyReferences:ResolutionContext["policyReferences"]=[]):ResolutionContext {
  return {
    case:caseData,
    facts:caseData.facts,
    evidence:caseData.evidence,
    timeline:caseData.timeline,
    conflicts:caseData.conflicts,
    missingInformation:caseData.missingInformation,
    policyReferences,
  };
}
