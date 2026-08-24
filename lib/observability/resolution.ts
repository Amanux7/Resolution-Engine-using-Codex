export type ResolutionObservationEvent = "agent_started" | "context_built" | "policy_tool_called" | "candidate_actions_generated" | "recommendation_validated" | "recommendation_persisted";
export interface ResolutionObservation { event:ResolutionObservationEvent; at:string; caseId:string; }

const events:ResolutionObservation[]=[];
export function recordResolutionEvent(event:ResolutionObservationEvent,caseId:string){events.push({event,caseId,at:new Date().toISOString()});if(events.length>200)events.shift();}
export function getResolutionObservations(){return [...events];}
