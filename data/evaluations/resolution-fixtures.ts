import type { Case, Conflict, Evidence, Fact, MissingInformation, TimelineEvent } from "../../types/case";
import type { RecommendationConfidence, ResolutionContext, ResolutionReasonSource } from "../../types/resolution";

export interface ResolutionEvaluationFixture { id:string; label:string; context:ResolutionContext; expectedAction:string; expectedUncertainty:string[]; expectedConfidence:RecommendationConfidence[]; mustNotRecommend:string[]; requiredSourceTypes:ResolutionReasonSource[]; expectedCommunication:string; communicationMustNotContain:string[]; }

function evidence(id:string,caseId:string,filename:string):Evidence{return {id,caseId,filename,mimeType:"text/plain",size:120,storageKey:`fixtures/${filename}`,sourceType:"synthetic",processingStatus:"processed",extractedFactsCount:2,uploadedAt:"2026-08-01T00:00:00Z",createdAt:"2026-08-01T00:00:00Z",updatedAt:"2026-08-01T00:00:00Z"};}
function fact(id:string,caseId:string,sourceId:string,factType:Fact["factType"],value:string,sourceText:string):Fact{return {id,caseId,factType,value,text:value,sourceText,sourceType:"synthetic_demo",sourceId,confidence:.94,createdBy:"imported_source",extractionMethod:"synthetic",createdAt:"2026-08-01T00:00:00Z"};}
function makeCase(id:string,description:string):Case{return {id,userId:"evaluation-user",title:"Synthetic evaluation case",category:"consumer",description,status:"review",priority:"medium",createdAt:"2026-08-01T00:00:00Z",updatedAt:"2026-08-01T00:00:00Z",situation:{problem:"Consumer issue",currentSituation:"Needs review",fields:[]},people:[],facts:[],evidence:[],timeline:[],conflicts:[],missingInformation:[],tasks:[],recommendations:[],communications:[],readiness:{factsFound:0,factsExpected:5,evidenceProcessed:0,evidenceTotal:0,timelineComplete:false,conflicts:0,missingDetails:0,label:"Needs review"}};}
function missing(id:string,caseId:string,label:string,expectedFactType:MissingInformation["expectedFactType"]):MissingInformation{return {id,caseId,label,state:"unverified",reason:`The case cannot verify ${label.toLowerCase()}.`,expectedFactType,createdAt:"2026-08-01T00:00:00Z"};}

const damaged=makeCase("eval-damaged-refund","My phone arrived damaged. The return pickup was completed, but the seller has not confirmed the refund.");
const damagedEvidence=evidence("ev-damaged",damaged.id,"synthetic-pickup-chat.txt");
damaged.evidence=[damagedEvidence];damaged.facts=[fact("fact-pickup",damaged.id,damagedEvidence.id,"status","Return pickup completed","Return pickup completed Aug 12."),fact("fact-refund",damaged.id,damagedEvidence.id,"status","Refund still pending","Refund is still pending.")];damaged.missingInformation=[missing("missing-refund",damaged.id,"Refund confirmation","refund_date")];

const missingDelivery=makeCase("eval-missing-delivery","My order did not arrive and I need to know where it is.");
const deliveryEvidence=evidence("ev-delivery",missingDelivery.id,"synthetic-order-message.txt");
missingDelivery.evidence=[deliveryEvidence];missingDelivery.facts=[fact("fact-order",missingDelivery.id,deliveryEvidence.id,"order_id","RX-3101","Order RX-3101")];missingDelivery.missingInformation=[missing("missing-delivery",missingDelivery.id,"Delivery confirmation","delivery_date")];

const wrongProduct=makeCase("eval-wrong-product","The seller delivered a different product from the one I ordered.");
const wrongEvidence=evidence("ev-wrong",wrongProduct.id,"synthetic-product-photo.txt");
wrongProduct.evidence=[wrongEvidence];wrongProduct.facts=[fact("fact-product",wrongProduct.id,wrongEvidence.id,"product","Wrong product delivered","Delivered item differs from the order.")];

const refundDelayed=makeCase("eval-refund-delayed","The seller promised a refund after pickup, but it is still delayed.");
const delayedEvidence=evidence("ev-delayed",refundDelayed.id,"synthetic-support-chat.txt");
refundDelayed.evidence=[delayedEvidence];refundDelayed.facts=[fact("fact-delayed-pickup",refundDelayed.id,delayedEvidence.id,"status","Pickup completed","Pickup completed."),fact("fact-delayed-refund",refundDelayed.id,delayedEvidence.id,"status","Refund promised but pending","Refund was promised after pickup but is still pending.")];refundDelayed.missingInformation=[missing("missing-delayed-refund",refundDelayed.id,"Refund confirmation","refund_date")];

const conflicting=makeCase("eval-conflicting-dates","My package arrived damaged and I need help with the refund.");
const conflictEvidenceA=evidence("ev-conflict-a",conflicting.id,"synthetic-delivery-photo.txt");
const conflictEvidenceB=evidence("ev-conflict-b",conflicting.id,"synthetic-seller-email.txt");
const conflictFactA=fact("fact-delivery-7",conflicting.id,conflictEvidenceA.id,"delivery_date","Aug 07","Delivered Aug 07.");
const conflictFactB=fact("fact-delivery-9",conflicting.id,conflictEvidenceB.id,"delivery_date","Aug 09","Delivered Aug 09.");
const conflict:Conflict={id:"conflict-delivery-date",caseId:conflicting.id,factAId:conflictFactA.id,factBId:conflictFactB.id,reason:"Two evidence sources list different delivery dates: Aug 07 and Aug 09.",severity:"medium",createdAt:"2026-08-01T00:00:00Z"};
conflicting.evidence=[conflictEvidenceA,conflictEvidenceB];conflicting.facts=[conflictFactA,conflictFactB];conflicting.conflicts=[conflict];

function context(caseData:Case):ResolutionContext{return {case:caseData,facts:caseData.facts,evidence:caseData.evidence,timeline:caseData.timeline,conflicts:caseData.conflicts,missingInformation:caseData.missingInformation,policyReferences:[]};}

export const resolutionEvaluationFixtures:ResolutionEvaluationFixture[]=[
  {id:"damaged-refund-pending",label:"Damaged product + refund pending",context:context(damaged),expectedAction:"Ask the seller to confirm the refund status in writing.",expectedUncertainty:["Refund confirmation"],expectedConfidence:["high","medium"],mustNotRecommend:["The seller violated the law","Submit a complaint automatically"],requiredSourceTypes:["fact","system","policy"],expectedCommunication:"confirm the current refund status",communicationMustNotContain:["legal action","violated the law"]},
  {id:"missing-delivery",label:"Missing delivery",context:context(missingDelivery),expectedAction:"Ask the seller or marketplace to confirm the delivery status and share any tracking update in writing.",expectedUncertainty:["Delivery confirmation"],expectedConfidence:["high","medium"],mustNotRecommend:["Assume the package was lost","theft","fraud","Submit a complaint automatically"],requiredSourceTypes:["fact","policy"],expectedCommunication:"verify the current delivery status",communicationMustNotContain:["theft","stole"]},
  {id:"wrong-product",label:"Wrong product delivered",context:context(wrongProduct),expectedAction:"Keep the item and order evidence together, then ask the seller to confirm the replacement or return process in writing.",expectedUncertainty:[],expectedConfidence:["high","medium"],mustNotRecommend:["Keep the wrong product","The seller violated the law"],requiredSourceTypes:["fact","policy"],expectedCommunication:"return or replacement process",communicationMustNotContain:["Model","brand"]},
  {id:"refund-promised-delayed",label:"Refund promised but delayed",context:context(refundDelayed),expectedAction:"Ask the seller to confirm the refund status in writing.",expectedUncertainty:["Refund confirmation"],expectedConfidence:["high","medium"],mustNotRecommend:["The refund was never initiated","Submit a complaint automatically"],requiredSourceTypes:["fact","system","policy"],expectedCommunication:"expected completion date",communicationMustNotContain:["within 3 days","deadline"]},
  {id:"conflicting-dates",label:"Conflicting evidence dates",context:context(conflicting),expectedAction:"Ask the seller to confirm the conflicting date or amount in writing before relying on it for a further step.",expectedUncertainty:["Which date or amount is correct?"],expectedConfidence:["low"],mustNotRecommend:["Use Aug 07 as the confirmed delivery date","Use Aug 09 as the confirmed delivery date"],requiredSourceTypes:["system"],expectedCommunication:"confirm the current refund status",communicationMustNotContain:["Aug 07","Aug 09"]},
];
