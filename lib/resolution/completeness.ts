import type { ResolutionContext, CaseCompleteness } from "../../types/resolution";

export function checkCaseCompleteness(context:ResolutionContext):CaseCompleteness {
  const missing:string[]=[];
  const notes:string[]=[];
  if(context.case.description.trim().length<20)missing.push("A short description of what happened");
  if(context.facts.length===0)missing.push("At least one case fact");
  if(context.case.category==="consumer"&&context.evidence.length===0)missing.push("Supporting evidence, such as a screenshot, document, or message");
  if(context.case.status==="archived"||context.case.status==="resolved")missing.push("Reopen this case before asking for a new recommendation");
  if(context.case.status==="draft"||context.case.status==="intake"||context.case.status==="evidence_processing")notes.push("The case is still being organized, so the recommendation may need another review after processing finishes.");
  if(context.timeline.length===0)notes.push("There is no dated evidence yet, so the timeline is still incomplete.");
  if(context.conflicts.length>0)notes.push("Some evidence conflicts and should be confirmed before any escalation.");
  if(context.missingInformation.length>0)notes.push(`${context.missingInformation.length} detail${context.missingInformation.length===1?" is":"s are"} missing or unverified.`);
  return {ready:missing.length===0,missing,notes};
}
