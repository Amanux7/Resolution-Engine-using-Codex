import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CommunicationAgent } from "../lib/agents/communication-agent";
import { ResolutionAgent } from "../lib/agents/resolution-agent";
import { MockAIProvider } from "../lib/ai/provider";
import { buildCommunicationContext } from "../lib/action-package/context";
import { ResolutionPackBuilder } from "../lib/action-package/builder";
import { canTransitionActionPackage, findUnsupportedStatements, validateActionPackage, validateCommunicationDraft } from "../lib/action-package/validation";
import { getRepositories } from "../lib/db";
import { createCaseInput } from "../lib/cases/factory";
import { resolutionEvaluationFixtures } from "../data/evaluations/resolution-fixtures";
import { GET as getActionPackage, PATCH as patchActionPackage, POST as postActionPackage } from "../app/api/cases/[id]/action-package/route";
import { PATCH as reviewRecommendation, POST as postRecommendation } from "../app/api/cases/[id]/recommendation/route";
import type { Evidence, Fact, MissingInformation } from "../types/case";

const provider=new MockAIProvider();const resolutionAgent=new ResolutionAgent(provider);const communicationAgent=new CommunicationAgent(provider);
async function approvedContext(index=0){const fixture=resolutionEvaluationFixtures[index]!;const run=await resolutionAgent.run(fixture.context);return {fixture,context:buildCommunicationContext(fixture.context.case,{...run.recommendation,status:"approved"})};}

describe("CommunicationAgent",()=>{
  it("requires an approved recommendation",async()=>{const fixture=resolutionEvaluationFixtures[0]!;const run=await resolutionAgent.run(fixture.context);await expect(communicationAgent.prepare(buildCommunicationContext(fixture.context.case,run.recommendation))).rejects.toThrow("Review the recommended next step");});
  it.each(resolutionEvaluationFixtures)("produces safe expected communication for $label",async fixture=>{const index=resolutionEvaluationFixtures.findIndex(item=>item.id===fixture.id);const prepared=await approvedContext(index);const draft=await communicationAgent.prepare(prepared.context);expect(draft.body.toLowerCase()).toContain(fixture.expectedCommunication.toLowerCase());for(const forbidden of fixture.communicationMustNotContain)expect(draft.body.toLowerCase()).not.toContain(forbidden.toLowerCase());validateCommunicationDraft(draft,prepared.context);});
  it("grounds every generated claim in supplied case context",async()=>{const {context}=await approvedContext();const draft=await communicationAgent.prepare(context);const valid=new Set([...context.facts.map(x=>x.id),...context.evidence.map(x=>x.id),...context.timeline.map(x=>x.id),context.recommendation.id]);expect(draft.claims.every(claim=>valid.has(claim.sourceId))).toBe(true);});
  it("blocks unsupported generated legal or fraud claims",async()=>{const {context}=await approvedContext();const draft=await communicationAgent.prepare(context);expect(()=>validateCommunicationDraft({...draft,generatedBody:`${draft.generatedBody} The seller committed fraud.`},context)).toThrow("unsupported legal, fraud, or theft");});
  it("avoids both sides of a conflicting date",async()=>{const {context}=await approvedContext(4);const draft=await communicationAgent.prepare(context);expect(draft.body).not.toMatch(/Aug 07|Aug 09/);});
  it("qualifies missing refund confirmation",async()=>{const {context}=await approvedContext();const draft=await communicationAgent.prepare(context);expect(draft.body).toContain("do not yet have confirmation");});
  it("changes tone without changing source grounding",async()=>{const {context}=await approvedContext();const clear=await communicationAgent.prepare(context,"clear");const formal=await communicationAgent.prepare(context,"formal");expect(clear.body).not.toBe(formal.body);expect(clear.claims.map(x=>`${x.sourceType}:${x.sourceId}`)).toEqual(formal.claims.map(x=>`${x.sourceType}:${x.sourceId}`));});
});

describe("Resolution Pack and editing",()=>{
  it("assembles every structured pack section deterministically",async()=>{const {context}=await approvedContext();const draft=await communicationAgent.prepare(context);const pack=new ResolutionPackBuilder().build(context,draft);expect(pack.caseSummary.issue).toBeTruthy();expect(pack.keyFacts.length).toBeGreaterThan(0);expect(pack.evidenceIndex.length).toBeGreaterThan(0);expect(pack.nextSteps.length).toBeGreaterThan(0);expect(pack.communication?.body).toBe(draft.body);expect(validateActionPackage(pack,context).id).toBe(pack.id);});
  it("keeps unsupported user edits visible and separate from generated claims",async()=>{const {context}=await approvedContext();const draft=await communicationAgent.prepare(context);const edited=`${draft.body} The company deliberately stole my money.`;const unsupported=findUnsupportedStatements(edited,draft.generatedBody);expect(unsupported[0]?.severity).toBe("confirmation_required");expect(draft.claims.some(claim=>claim.text.includes("stole"))).toBe(false);});
  it("preserves package history and changes only controlled state",async()=>{const repositories=getRepositories();const {context}=await approvedContext();const first=new ResolutionPackBuilder().build(context,await communicationAgent.prepare(context));const second={...first,id:`action-package-${randomUUID()}`,createdAt:new Date(Date.parse(first.createdAt)+1000).toISOString(),updatedAt:new Date(Date.parse(first.updatedAt)+1000).toISOString()};await repositories.actionPackages.create(first);await repositories.actionPackages.create(second);expect((await repositories.actionPackages.listByCaseId(first.caseId)).slice(0,2).map(item=>item.id)).toEqual([second.id,first.id]);const changed=await repositories.actionPackages.updateStatus(second.id,"approved");expect(changed?.title).toBe(second.title);expect(changed?.status).toBe("approved");});
  it("allows only preparation review states",()=>{expect(canTransitionActionPackage("ready_for_review","approved")).toBe(true);expect(canTransitionActionPackage("approved","ready_to_use")).toBe(true);expect(canTransitionActionPackage("ready_to_use","approved")).toBe(false);});
});

describe("action-package API end to end",()=>{
  it("persists preparation, edits, review, readiness, and reload without external action",async()=>{
    const repositories=getRepositories();const caseData=await repositories.cases.create(createCaseInput("My phone arrived damaged, pickup was completed, and the refund is still pending.","user-demo"));const now=new Date().toISOString();
    const evidence:Evidence={id:`evidence-${randomUUID()}`,caseId:caseData.id,filename:"synthetic-stage4-support.txt",mimeType:"text/plain",size:100,storageKey:`tests/${caseData.id}/support.txt`,sourceType:"synthetic",processingStatus:"processed",extractedFactsCount:2,uploadedAt:now,createdAt:now,updatedAt:now};
    const pickup:Fact={id:`fact-${randomUUID()}`,caseId:caseData.id,factType:"status",value:"Return pickup completed",text:"Return pickup completed",sourceText:"Return pickup completed Aug 12.",sourceType:"synthetic_demo",sourceId:evidence.id,confidence:.95,createdBy:"imported_source",extractionMethod:"synthetic",createdAt:now};
    const refund:Fact={...pickup,id:`fact-${randomUUID()}`,value:"Refund promised after pickup",text:"Refund promised after pickup",sourceText:"Refund will be processed after pickup."};
    const missing:MissingInformation={id:`missing-${randomUUID()}`,caseId:caseData.id,label:"Refund confirmation",state:"unverified",reason:"Refund initiation is not confirmed.",expectedFactType:"refund_date",createdAt:now};
    await repositories.evidence.create(evidence);await repositories.facts.createMany([pickup,refund]);await repositories.missing.replaceForCase(caseData.id,[missing]);await repositories.setStatus(caseData.id,"user-demo","review");const params={params:Promise.resolve({id:caseData.id})};
    expect((await postActionPackage(new Request("http://localhost/api",{method:"POST",body:"{}"}),params)).status).toBe(409);
    expect((await postRecommendation(new Request("http://localhost/api",{method:"POST"}),params)).status).toBe(200);
    expect((await reviewRecommendation(new Request("http://localhost/api",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"approved"})}),params)).status).toBe(200);
    const created=await postActionPackage(new Request("http://localhost/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tone:"firm"})}),params);expect(created.status).toBe(200);const createdBody=await created.json();expect(createdBody.actionPackage.status).toBe("ready_for_review");
    const editedText=`${createdBody.actionPackage.communication.body} Please reply in writing.`;const edited=await patchActionPackage(new Request("http://localhost/api",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:editedText})}),params);expect((await edited.json()).actionPackage.communication.status).toBe("edited");
    expect((await patchActionPackage(new Request("http://localhost/api",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"approved"})}),params)).status).toBe(200);
    expect((await patchActionPackage(new Request("http://localhost/api",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"ready_to_use"})}),params)).status).toBe(200);
    const reloaded=await getActionPackage(new Request("http://localhost/api"),params);const reloadedBody=await reloaded.json();expect(reloadedBody.actionPackage.status).toBe("ready_to_use");expect(reloadedBody.actionPackage.communication.body).toBe(editedText);expect(JSON.stringify(reloadedBody)).not.toMatch(/sent|submitted|filed|executed/);
    expect((await patchActionPackage(new Request("http://localhost/api",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:"Late edit"})}),params)).status).toBe(409);
  });
});
