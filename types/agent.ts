import type { Case, Fact, Evidence, TimelineEvent, Communication, Provenance } from "./case";
import type { ResolutionContext, ResolutionRecommendation } from "./resolution";
export interface AgentError { code:string; message:string; retryable:boolean; }
export interface ToolCallRecord { toolName:string; input:unknown; output?:unknown; status:"requested"|"completed"|"failed"; }
export interface AgentResult<T> { output:T; confidence:number; citations:Provenance[]; toolCalls:ToolCallRecord[]; errors:AgentError[]; }
export interface IntakeAgentInput { description:string; evidence:Evidence[]; }
export interface IntakeAgentOutput { title:string; situation:Case["situation"]; facts:Fact[]; }
export interface EvidenceAgentInput { caseId:string; evidence:Evidence[]; }
export interface EvidenceAgentOutput { facts:Fact[]; missingInformation:string[]; }
export interface TimelineAgentInput { caseId:string; facts:Fact[]; evidence:Evidence[]; }
export interface TimelineAgentOutput { events:TimelineEvent[]; }
export interface ResolutionAgentInput { context:ResolutionContext; }
export interface ResolutionAgentOutput { recommendations:ResolutionRecommendation[]; }
export interface CommunicationAgentInput { case:Case; recommendation:ResolutionRecommendation; }
export interface CommunicationAgentOutput { communication:Communication; }
export interface EscalationAgentInput { case:Case; }
export interface EscalationAgentOutput { options:Array<{title:string;description:string;requirements:string[]}>; }
export interface FollowUpAgentInput { case:Case; }
export interface FollowUpAgentOutput { tasks:Case["tasks"]; }
export interface IntakeAgent { understand(input:IntakeAgentInput):Promise<AgentResult<IntakeAgentOutput>>; }
export interface EvidenceAgent { extract(input:EvidenceAgentInput):Promise<AgentResult<EvidenceAgentOutput>>; }
export interface TimelineAgent { build(input:TimelineAgentInput):Promise<AgentResult<TimelineAgentOutput>>; }
export interface ResolutionAgent { recommend(input:ResolutionAgentInput):Promise<AgentResult<ResolutionAgentOutput>>; }
export interface CommunicationAgent { prepare(input:CommunicationAgentInput):Promise<AgentResult<CommunicationAgentOutput>>; }
export interface EscalationAgent { paths(input:EscalationAgentInput):Promise<AgentResult<EscalationAgentOutput>>; }
export interface FollowUpAgent { track(input:FollowUpAgentInput):Promise<AgentResult<FollowUpAgentOutput>>; }
