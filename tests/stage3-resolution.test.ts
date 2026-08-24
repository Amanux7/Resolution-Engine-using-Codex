import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ResolutionAgent } from "../lib/agents/resolution-agent";
import { MockAIProvider } from "../lib/ai/provider";
import { getRepositories } from "../lib/db";
import { searchDemoPolicy } from "../lib/policy/demo-policy";
import { createActionCandidates } from "../lib/resolution/candidates";
import { checkCaseCompleteness } from "../lib/resolution/completeness";
import { validateRecommendationDraft } from "../lib/resolution/validation";
import { createCaseInput } from "../lib/cases/factory";
import { resolutionEvaluationFixtures } from "../data/evaluations/resolution-fixtures";
import { GET as getRecommendation, PATCH as reviewRecommendation, POST as postRecommendation } from "../app/api/cases/[id]/recommendation/route";
import type { Evidence, Fact, MissingInformation } from "../types/case";

const agent=new ResolutionAgent(new MockAIProvider());

describe("ResolutionAgent evaluation fixtures",()=>{
  it.each(resolutionEvaluationFixtures)("selects the expected safe action for $label",async fixture=>{
    const run=await agent.run(fixture.context);
    expect(run.recommendation.action).toBe(fixture.expectedAction);
    for(const uncertainty of fixture.expectedUncertainty)expect(run.recommendation.unresolvedQuestions.join(" ")).toContain(uncertainty);
    for(const forbidden of fixture.mustNotRecommend)expect(`${run.recommendation.action} ${run.recommendation.explanation}`).not.toContain(forbidden);
    expect(fixture.expectedConfidence).toContain(run.recommendation.confidence);
    for(const sourceType of fixture.requiredSourceTypes)expect(run.recommendation.reasons.some(reason=>reason.sourceType===sourceType)).toBe(true);
  });
  it("returns a clarification request when evidence and facts are absent",async()=>{
    const fixture=resolutionEvaluationFixtures[0]!;
    const context={...fixture.context,case:{...fixture.context.case,id:"incomplete",description:"It broke",facts:[],evidence:[],timeline:[],conflicts:[],missingInformation:[]},facts:[],evidence:[],timeline:[],conflicts:[],missingInformation:[]};
    const run=await agent.run(context);
    expect(run.recommendation.status).toBe("needs_more_information");
    expect(run.recommendation.action).toContain("Add the missing details");
  });
  it("blocks unsupported legal conclusions",()=>{
    const fixture=resolutionEvaluationFixtures[0]!;
    const draft={caseId:fixture.context.case.id,title:"Legal claim",action:"The seller violated the law.",explanation:"This is illegal.",reasons:[{statement:"The seller violated the law.",sourceType:"system" as const,sourceId:"case-completeness",confidence:"low" as const}],supportingEvidence:[],unresolvedQuestions:[],confidence:"low" as const,priority:"normal" as const,requiresUserApproval:true,policyReferences:[]};
    expect(validateRecommendationDraft(draft,fixture.context)).toContain("Recommendation contains an unsupported legal or fraud conclusion.");
  });
  it("blocks unsupported fraud conclusions",()=>{
    const fixture=resolutionEvaluationFixtures[0]!;
    const draft={caseId:fixture.context.case.id,title:"Fraud claim",action:"The seller committed fraud.",explanation:"Treat this as proven fraud.",reasons:[{statement:"The seller committed fraud.",sourceType:"system" as const,sourceId:"case-description",confidence:"low" as const}],supportingEvidence:[],unresolvedQuestions:[],confidence:"low" as const,priority:"normal" as const,requiresUserApproval:true,policyReferences:[]};
    expect(validateRecommendationDraft(draft,fixture.context)).toContain("Recommendation contains an unsupported legal or fraud conclusion.");
  });
  it("rejects missing provenance and malformed structured output",()=>{
    const fixture=resolutionEvaluationFixtures[0]!;
    const draft={caseId:fixture.context.case.id,title:"Unsupported",action:"Ask for an update.",explanation:"A source is required.",reasons:[{statement:"Unsupported fact",sourceType:"fact" as const,sourceId:"fact-does-not-exist",confidence:"low" as const}],supportingEvidence:[],unresolvedQuestions:[],confidence:"low" as const,priority:"normal" as const,requiresUserApproval:true,policyReferences:[]};
    expect(validateRecommendationDraft(draft,fixture.context)).toContain("A recommendation reason references an unknown fact.");
    expect(validateRecommendationDraft({action:"Missing most fields"},fixture.context)[0]).toContain("Malformed recommendation");
  });
  it("keeps ranking deterministic",()=>{
    const fixture=resolutionEvaluationFixtures[0]!;
    const policies=searchDemoPolicy({category:"consumer",query:fixture.context.case.description});
    expect(createActionCandidates(fixture.context,policies)).toEqual(createActionCandidates(fixture.context,policies));
  });
  it("keeps every persisted reason and evidence reference traceable",async()=>{
    const fixture=resolutionEvaluationFixtures[0]!;
    const run=await agent.run(fixture.context);
    expect(validateRecommendationDraft(run.recommendation,{...fixture.context,policyReferences:run.recommendation.policyReferences})).toEqual([]);
    expect(run.recommendation.reasons.length).toBeGreaterThan(0);
  });
});

describe("recommendation persistence",()=>{
  it("stores history and returns the latest recommendation",async()=>{
    const userId=`recommendation-test-${randomUUID()}`;
    const repositories=getRepositories();
    const caseData=await repositories.cases.create(createCaseInput("My phone arrived damaged and the seller has not refunded me.",userId));
    const fixture=resolutionEvaluationFixtures[0]!;
    const recommendation={...(await agent.run(fixture.context)).recommendation,id:`recommendation-${randomUUID()}`,caseId:caseData.id};
    await repositories.recommendations.create(recommendation);
    const latest=await repositories.recommendations.getLatestByCaseId(caseData.id);
    expect(latest?.id).toBe(recommendation.id);
    const newer={...recommendation,id:`recommendation-${randomUUID()}`,createdAt:new Date(Date.parse(recommendation.createdAt)+1000).toISOString()};
    await repositories.recommendations.create(newer);
    expect((await repositories.recommendations.listByCaseId(caseData.id)).map(item=>item.id)).toEqual([newer.id,recommendation.id]);
    const before=await repositories.recommendations.getLatestByCaseId(caseData.id);
    const updated=await repositories.recommendations.updateStatus(newer.id,"approved");
    expect(updated?.status).toBe("approved");
    expect({...updated,status:before?.status}).toEqual(before);
  });
  it("identifies the minimum completeness requirements",()=>{
    const fixture=resolutionEvaluationFixtures[0]!;
    const incomplete={...fixture.context,case:{...fixture.context.case,description:"Too short"},facts:[],evidence:[]};
    expect(checkCaseCompleteness(incomplete).ready).toBe(false);
  });
});

describe("recommendation API",()=>{
  it("POST persists a structured result, GET reloads it, and PATCH changes only review state",async()=>{
    const repositories=getRepositories();
    const caseData=await repositories.cases.create(createCaseInput("My phone arrived damaged, pickup was completed, and the refund is still pending.","user-demo"));
    const now=new Date().toISOString();
    const evidence:Evidence={id:`evidence-${randomUUID()}`,caseId:caseData.id,filename:"synthetic-api-support.txt",mimeType:"text/plain",size:100,storageKey:`tests/${caseData.id}/support.txt`,sourceType:"synthetic",processingStatus:"processed",extractedFactsCount:2,uploadedAt:now,createdAt:now,updatedAt:now};
    const pickupFact:Fact={id:`fact-${randomUUID()}`,caseId:caseData.id,factType:"status",value:"Return pickup completed",text:"Return pickup completed",sourceText:"Return pickup completed Aug 12.",sourceType:"synthetic_demo",sourceId:evidence.id,confidence:.95,createdBy:"imported_source",extractionMethod:"synthetic",createdAt:now};
    const refundFact:Fact={...pickupFact,id:`fact-${randomUUID()}`,value:"Refund still pending",text:"Refund still pending",sourceText:"Refund is still pending."};
    const missing:MissingInformation={id:`missing-${randomUUID()}`,caseId:caseData.id,label:"Refund confirmation",state:"unverified",reason:"The case cannot verify that the refund was initiated.",expectedFactType:"refund_date",createdAt:now};
    await repositories.evidence.create(evidence);await repositories.facts.createMany([pickupFact,refundFact]);await repositories.missing.replaceForCase(caseData.id,[missing]);await repositories.setStatus(caseData.id,"user-demo","review");
    const params={params:Promise.resolve({id:caseData.id})};
    const post=await postRecommendation(new Request("http://localhost/api"),params);
    expect(post.status).toBe(200);
    const posted=await post.json();
    expect(posted.recommendation.action).toBe("Ask the seller to confirm the refund status in writing.");
    const get=await getRecommendation(new Request("http://localhost/api"),params);
    expect((await get.json()).recommendation.id).toBe(posted.recommendation.id);
    const patch=await reviewRecommendation(new Request("http://localhost/api",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"approved"})}),params);
    const reviewed=await patch.json();
    expect(reviewed.recommendation.status).toBe("approved");
    expect(reviewed.recommendation.action).toBe(posted.recommendation.action);
  });
});
