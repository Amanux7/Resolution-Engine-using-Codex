export interface ModelExecution { provider:"openai"; model:string; operation:"evidence_extraction"; startedAt:string; completedAt:string; status:"success"|"failed"; inputEvidenceId:string; failureKind?:"authentication"|"rate_limit"|"timeout"|"provider"|"schema_validation"|"invalid_response"; usage?:{inputTokens?:number;outputTokens?:number}; }

const executions:ModelExecution[]=[];
/** Development-only metadata. It deliberately excludes prompts, file bytes, and extracted content. */
export function recordModelExecution(execution:ModelExecution){executions.push(execution);if(executions.length>100)executions.shift();}
export function getModelExecutions(){return [...executions];}
