import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Case, Evidence, Fact, TimelineEvent, Conflict, MissingInformation, CaseStatus } from "../../types/case";
import type { ResolutionRecommendation, RecommendationStatus } from "../../types/resolution";
import type { Repositories } from "./repositories";

interface State { cases:Case[]; evidence:Evidence[]; facts:Fact[]; timeline:TimelineEvent[]; conflicts:Conflict[]; missing:MissingInformation[]; recommendations:ResolutionRecommendation[]; }
const stateFilename=process.env.VITEST_POOL_ID?`state-test-${process.env.VITEST_POOL_ID}.json`:"state.json";
const statePath=path.join(process.cwd(),"data","local",stateFilename);
const now=()=>new Date().toISOString();
const blankState=():State=>({cases:[],evidence:[],facts:[],timeline:[],conflicts:[],missing:[],recommendations:[]});
let writeQueue=Promise.resolve();
async function readState():Promise<State>{try{const state=JSON.parse(await readFile(statePath,"utf8")) as Partial<State>;return {...blankState(),...state,recommendations:state.recommendations??[]};}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;await mkdir(path.dirname(statePath),{recursive:true});const state=blankState();await writeFile(statePath,JSON.stringify(state,null,2));return state;}}
async function updateState(mutator:(state:State)=>void){let result:State|undefined;writeQueue=writeQueue.then(async()=>{const state=await readState();mutator(state);await writeFile(statePath,JSON.stringify(state,null,2));result=state;});await writeQueue;return result as State;}
function readiness(state:State,caseId:string){const facts=state.facts.filter(f=>f.caseId===caseId);const evidence=state.evidence.filter(e=>e.caseId===caseId);const conflicts=state.conflicts.filter(c=>c.caseId===caseId);const missing=state.missing.filter(m=>m.caseId===caseId);const processed=evidence.filter(e=>e.processingStatus==="processed").length;const expected=5;return {factsFound:facts.length,factsExpected:expected,evidenceProcessed:processed,evidenceTotal:evidence.length,timelineComplete:state.timeline.some(e=>e.caseId===caseId),conflicts:conflicts.length,missingDetails:missing.length,label:conflicts.length||missing.length?"Needs review":facts.length?"Ready for review":"Needs evidence"} as Case["readiness"];}
function aggregate(state:State,record:Case){return {...record,evidence:state.evidence.filter(e=>e.caseId===record.id),facts:state.facts.filter(f=>f.caseId===record.id),timeline:state.timeline.filter(e=>e.caseId===record.id),conflicts:state.conflicts.filter(c=>c.caseId===record.id),missingInformation:state.missing.filter(m=>m.caseId===record.id),recommendations:state.recommendations.filter(r=>r.caseId===record.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),readiness:readiness(state,record.id)};}
export class LocalRepositories implements Repositories {
  cases={
    create:async(input:Pick<Case,"userId"|"title"|"category"|"description"|"priority"|"situation"|"people">)=>{const record:Case={...input,id:`case-${randomUUID()}`,status:"intake",createdAt:now(),updatedAt:now(),facts:[],evidence:[],timeline:[],conflicts:[],missingInformation:[],tasks:[],recommendations:[],communications:[],readiness:{factsFound:0,factsExpected:5,evidenceProcessed:0,evidenceTotal:0,timelineComplete:false,conflicts:0,missingDetails:0,label:"Needs evidence"}};const state=await updateState(s=>s.cases.push(record));return aggregate(state,record);},
    getById:async(id:string,userId:string)=>{const state=await readState();const record=state.cases.find(c=>c.id===id&&c.userId===userId);return record?aggregate(state,record):undefined;},
    listByUser:async(userId:string)=>{const state=await readState();return state.cases.filter(c=>c.userId===userId).map(c=>aggregate(state,c));},
    update:async(id:string,userId:string,patch:Partial<Pick<Case,"title"|"description"|"status"|"priority"|"situation">>)=>{const state=await updateState(s=>{const record=s.cases.find(c=>c.id===id&&c.userId===userId);if(record)Object.assign(record,patch,{updatedAt:now()});});const record=state.cases.find(c=>c.id===id&&c.userId===userId);return record?aggregate(state,record):undefined;}
  };
  evidence={
    create:async(evidence:Evidence)=>{const state=await updateState(s=>s.evidence.push(evidence));return state.evidence.find(e=>e.id===evidence.id)!;},
    getById:async(id:string)=>{const state=await readState();return state.evidence.find(e=>e.id===id);},
    getByCaseId:async(caseId:string)=>{const state=await readState();return state.evidence.filter(e=>e.caseId===caseId);},
    updateProcessingStatus:async(id:string,status:Evidence["processingStatus"],patch:Partial<Evidence>={})=>{const state=await updateState(s=>{const item=s.evidence.find(e=>e.id===id);if(item)Object.assign(item,patch,{processingStatus:status,updatedAt:now()});});return state.evidence.find(e=>e.id===id);}
  };
  facts={
    createMany:async(facts:Fact[])=>{const state=await updateState(s=>s.facts.push(...facts));return state.facts.filter(f=>facts.some(created=>created.id===f.id));},
    getByCaseId:async(caseId:string)=>{const state=await readState();return state.facts.filter(f=>f.caseId===caseId);},
    replaceForEvidence:async(caseId:string,sourceId:string,facts:Fact[])=>{const state=await updateState(s=>{s.facts=s.facts.filter(f=>!(f.caseId===caseId&&f.sourceId===sourceId));s.facts.push(...facts);});return state.facts.filter(f=>f.caseId===caseId);}
  };
  timeline={replaceForCase:async(caseId:string,events:TimelineEvent[])=>{const state=await updateState(s=>{s.timeline=s.timeline.filter(e=>e.caseId!==caseId);s.timeline.push(...events);});return state.timeline.filter(e=>e.caseId===caseId);},getByCaseId:async(caseId:string)=>{const state=await readState();return state.timeline.filter(e=>e.caseId===caseId);}};
  conflicts={replaceForCase:async(caseId:string,conflicts:Conflict[])=>{const state=await updateState(s=>{s.conflicts=s.conflicts.filter(c=>c.caseId!==caseId);s.conflicts.push(...conflicts);});return state.conflicts.filter(c=>c.caseId===caseId);},getByCaseId:async(caseId:string)=>{const state=await readState();return state.conflicts.filter(c=>c.caseId===caseId);}};
  missing={replaceForCase:async(caseId:string,items:MissingInformation[])=>{const state=await updateState(s=>{s.missing=s.missing.filter(i=>i.caseId!==caseId);s.missing.push(...items);});return state.missing.filter(i=>i.caseId===caseId);},getByCaseId:async(caseId:string)=>{const state=await readState();return state.missing.filter(i=>i.caseId===caseId);}};
  recommendations={
    create:async(recommendation:ResolutionRecommendation)=>{const state=await updateState(s=>s.recommendations.push(recommendation));return state.recommendations.find(item=>item.id===recommendation.id)!;},
    getLatestByCaseId:async(caseId:string)=>{const state=await readState();return state.recommendations.filter(item=>item.caseId===caseId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];},
    listByCaseId:async(caseId:string)=>{const state=await readState();return state.recommendations.filter(item=>item.caseId===caseId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));},
    updateStatus:async(id:string,status:RecommendationStatus)=>{const state=await updateState(s=>{const item=s.recommendations.find(recommendation=>recommendation.id===id);if(item)item.status=status;});return state.recommendations.find(item=>item.id===id);}
  };
  async getAggregate(id:string,userId:string){return this.cases.getById(id,userId);}
  async setStatus(id:string,userId:string,status:CaseStatus){return this.cases.update(id,userId,{status});}
}
