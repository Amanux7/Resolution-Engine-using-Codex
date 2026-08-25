import type { Case } from "../../types/case";
import type { CommunicationContext } from "../../types/action-package";
import type { ResolutionRecommendation } from "../../types/resolution";

export function buildCommunicationContext(caseData:Case,recommendation:ResolutionRecommendation,userInstruction?:string):CommunicationContext{
  return {case:caseData,recommendation,facts:caseData.facts,evidence:caseData.evidence,timeline:caseData.timeline,conflicts:caseData.conflicts,missingInformation:caseData.missingInformation,userInstruction};
}
