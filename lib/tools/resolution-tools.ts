import type { ResolutionDecisionTools, ToolResult } from "../../types/tool";
import type { Case } from "../../types/case";
import { searchDemoPolicy } from "../policy/demo-policy";
import { buildResolutionContext } from "../resolution/context";
import { validateRecommendationDraft } from "../resolution/validation";

function result<T>(data:T):ToolResult<T>{return {data,provenance:{sourceType:"system_calculation",confidence:1}};}

export function createResolutionTools(caseData?:Case):ResolutionDecisionTools {
  return {
    async getCaseContext({case:caseData}){return result(buildResolutionContext(caseData));},
    async getEvidence({caseId}){return result(caseData?.id===caseId?caseData.evidence:[]);},
    async getFacts({caseId}){return result(caseData?.id===caseId?caseData.facts:[]);},
    async getTimeline({caseId}){return result(caseData?.id===caseId?caseData.timeline:[]);},
    async searchPolicy({category,query}){return result(searchDemoPolicy({category,query}));},
    async getMissingInformation({caseId}){return result(caseData?.id===caseId?caseData.missingInformation:[]);},
    async getConflicts({caseId}){return result(caseData?.id===caseId?caseData.conflicts:[]);},
    async validateRecommendation({context,recommendation}){const issues=validateRecommendationDraft(recommendation,context);return result({valid:issues.length===0,issues});},
  };
}

export function summarizeCaseForPolicy(caseData:Case){return `${caseData.situation.problem} ${caseData.situation.currentSituation} ${caseData.description}`.slice(0,500);}
