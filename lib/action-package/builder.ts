import { randomUUID } from "node:crypto";
import type { ActionPackage, ActionPackageProvenance, CommunicationContext, CommunicationDraft, KeyFactItem } from "../../types/action-package";

function usefulLabel(type:string){return type.replaceAll("_"," ").replace(/^./,letter=>letter.toUpperCase());}
export class ResolutionPackBuilder {
  build(context:CommunicationContext,communication:CommunicationDraft):ActionPackage{
    const at=new Date().toISOString();
    const factByEvidence=new Map<string,string[]>();
    for(const fact of context.facts){if(fact.sourceId){const list=factByEvidence.get(fact.sourceId)??[];list.push(usefulLabel(fact.factType));factByEvidence.set(fact.sourceId,list);}}
    const provenance:ActionPackageProvenance[]=[{section:"recommendation",sourceType:"recommendation",sourceId:context.recommendation.id}];
    context.facts.forEach(fact=>provenance.push({section:"case_summary",sourceType:"fact",sourceId:fact.id}));
    context.evidence.forEach(item=>provenance.push({section:"evidence",sourceType:"evidence",sourceId:item.id}));
    context.timeline.forEach(item=>provenance.push({section:"timeline",sourceType:"timeline",sourceId:item.id}));
    communication.claims.forEach(claim=>provenance.push({section:"communication",sourceType:claim.sourceType,sourceId:claim.sourceId}));
    const fact=(type:string)=>context.facts.find(item=>item.factType===type);
    const keyFacts:KeyFactItem[]=context.facts.slice(0,12).map(item=>({factId:item.id,text:item.text||item.value,state:item.createdBy==="user"?"user_provided":item.confidence>=0.8?"verified":"inferred"}));
    return {id:`action-package-${randomUUID()}`,caseId:context.case.id,recommendationId:context.recommendation.id,type:"resolution_pack",title:"Your next step package",summary:"A factual message and case record prepared from the evidence already in this case.",communication,caseSummary:{issue:context.case.situation.problem||context.case.title,currentStatus:context.case.situation.currentSituation||"Case under review",amount:fact("amount")?.value??context.case.situation.amount,organization:fact("organization")?.value??context.case.people[0]?.name,orderId:fact("order_id")?.value??context.case.situation.orderReference},keyFacts,evidenceIndex:context.evidence.map(item=>({evidenceId:item.id,label:item.filename,supports:factByEvidence.get(item.id)??[]})),timelineSummary:context.timeline.map(item=>({eventId:item.id,date:item.eventDate,description:item.description||item.title,sourceIds:[item.sourceFactId??item.sourceId].filter((id):id is string=>Boolean(id))})),conflictSummary:context.conflicts.map(item=>({conflictId:item.id,description:item.reason,sourceIds:[item.factAId,item.factBId]})),unresolvedQuestions:[...new Set([...context.recommendation.unresolvedQuestions,...context.missingInformation.map(item=>item.label)])],nextSteps:[{order:1,instruction:"Review the prepared message and its evidence sources.",requiresUserAction:true},{order:2,instruction:"Use the message manually with the seller or support channel you already use.",requiresUserAction:true},{order:3,instruction:"Keep any reply with this case as new evidence.",requiresUserAction:true}],provenance,destination:{type:"support",label:"Seller or support channel",integrationStatus:"manual"},status:"ready_for_review",createdAt:at,updatedAt:at};
  }
}
