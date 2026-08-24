import type { AgentResult, ResolutionAgent as ResolutionAgentContract, ResolutionAgentInput, ResolutionAgentOutput } from "../../types/agent";
import type { Provenance } from "../../types/case";
import type { ResolutionContext, ResolutionRecommendationDraft, ResolutionRun, ToolExecution } from "../../types/resolution";
import { getAIProvider, type AIProvider } from "../ai/provider";
import { createActionCandidates } from "../resolution/candidates";
import { checkCaseCompleteness } from "../resolution/completeness";
import { recordResolutionEvent } from "../observability/resolution";
import { createResolutionTools, summarizeCaseForPolicy } from "../tools/resolution-tools";
import { materializeRecommendation } from "../resolution/validation";

export const resolutionSystemInstructions="Use only the supplied case context. Never invent facts. Acknowledge conflicts and missing information. Distinguish facts from inferences and recommendations. Do not make legal conclusions. Prefer the lowest-risk, reversible next action. Return a structured recommendation with traceable reasons.";

function execution<T>(toolName:string,inputSummary:string,fn:()=>Promise<T>,records:ToolExecution[]):Promise<T>{
  const startedAt=new Date().toISOString();
  return fn().then(output=>{records.push({toolName,startedAt,completedAt:new Date().toISOString(),status:"success",inputSummary,outputSummary:"Structured result returned"});return output;}).catch(error=>{records.push({toolName,startedAt,completedAt:new Date().toISOString(),status:"failed",inputSummary,outputSummary:error instanceof Error?error.message:"Tool failed"});throw error;});
}

function needsInformationDraft(context:ResolutionContext,missing:string[]):ResolutionRecommendationDraft {
  return {caseId:context.case.id,title:"Add a little more information",action:"Add the missing details or supporting evidence before choosing a next step.",explanation:"I need a little more information before I can recommend a specific next step. This keeps the recommendation grounded in your case record.",reasons:[{statement:"The case does not yet have enough evidence-backed information for a reliable recommendation.",sourceType:"system",sourceId:"case-completeness",confidence:"high"}],supportingEvidence:[],unresolvedQuestions:missing,risks:["A specific recommendation now could rely on assumptions."],confidence:"low",priority:"normal",requiresUserApproval:true,status:"needs_more_information",policyReferences:[]};
}

export class ResolutionAgent implements ResolutionAgentContract {
  constructor(private readonly provider:AIProvider=getAIProvider()){}

  async run(context:ResolutionContext):Promise<ResolutionRun>{
    const toolExecutions:ToolExecution[]=[];
    recordResolutionEvent("agent_started",context.case.id);
    const tools=createResolutionTools(context.case);
    const contextResult=await execution("getCaseContext",`Case ${context.case.id}`,()=>tools.getCaseContext({case:context.case},{caseId:context.case.id,requestedBy:"agent"}),toolExecutions);
    recordResolutionEvent("context_built",context.case.id);
    const complete=checkCaseCompleteness(contextResult.data);
    if(!complete.ready){
      const draft=needsInformationDraft(contextResult.data,complete.missing);
      const validation=await execution("validateRecommendation","Completeness recommendation",()=>tools.validateRecommendation({context:contextResult.data,recommendation:draft},{caseId:context.case.id,requestedBy:"agent"}),toolExecutions);
      if(!validation.data.valid)throw new Error(validation.data.issues.join(" "));
      recordResolutionEvent("recommendation_validated",context.case.id);
      return {recommendation:materializeRecommendation(draft),candidates:[],toolExecutions};
    }
    const policyQuery=`${summarizeCaseForPolicy(context.case)}${context.conflicts.length?" conflicting evidence":""}`;
    const policyResult=await execution("searchPolicy","Synthetic consumer policy search",()=>tools.searchPolicy({category:context.case.category,query:policyQuery},{caseId:context.case.id,requestedBy:"agent"}),toolExecutions);
    recordResolutionEvent("policy_tool_called",context.case.id);
    const decisionContext:ResolutionContext={...contextResult.data,policyReferences:policyResult.data};
    const candidates=createActionCandidates(decisionContext,policyResult.data);
    recordResolutionEvent("candidate_actions_generated",context.case.id);
    const draft=await this.provider.generateResolutionRecommendation({context:decisionContext,policies:policyResult.data,candidates,systemInstructions:resolutionSystemInstructions});
    const validation=await execution("validateRecommendation","Structured recommendation",()=>tools.validateRecommendation({context:decisionContext,recommendation:draft},{caseId:context.case.id,requestedBy:"agent"}),toolExecutions);
    if(!validation.data.valid)throw new Error(validation.data.issues.join(" "));
    recordResolutionEvent("recommendation_validated",context.case.id);
    return {recommendation:materializeRecommendation(draft),candidates,toolExecutions};
  }

  async recommend(input:ResolutionAgentInput):Promise<AgentResult<ResolutionAgentOutput>>{
    const run=await this.run(input.context);
    const citations:Provenance[]=input.context.facts.filter(fact=>run.recommendation.reasons.some(reason=>reason.sourceType==="fact"&&reason.sourceId===fact.id)).map(fact=>({sourceType:fact.sourceType,sourceId:fact.sourceId,confidence:fact.confidence,createdBy:fact.createdBy}));
    return {output:{recommendations:[run.recommendation]},confidence:run.recommendation.confidence==="high"?.9:run.recommendation.confidence==="medium"?.65:.35,citations,toolCalls:run.toolExecutions.map(record=>({toolName:record.toolName,input:record.inputSummary,output:record.outputSummary,status:record.status==="success"?"completed":"failed"})),errors:[]};
  }
}
