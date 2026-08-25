export type ActionPackageEvent="communication_context_built"|"communication_generated"|"communication_validated"|"action_package_built"|"action_package_reviewed"|"action_package_ready";
const observations:Array<{event:ActionPackageEvent;caseId:string;at:string}>=[];
export function recordActionPackageEvent(event:ActionPackageEvent,caseId:string){observations.push({event,caseId,at:new Date().toISOString()});}
export function getActionPackageEvents(caseId:string){return observations.filter(item=>item.caseId===caseId);}
