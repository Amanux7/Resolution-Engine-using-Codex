import { NextResponse } from "next/server";
import { sampleCaseById, type SampleCaseId } from "../../../data/demo/sample-cases";
import { getRepositories } from "../../../lib/db";
import type { Case } from "../../../types/case";
import { z } from "zod";

const DEMO_USER_ID="user-demo";
/** Creates a clearly named fictional walkthrough without mixing it up with a user's own case. */
const sampleIdSchema=z.object({sampleId:z.enum(["document-correction","pension-pending","electricity-bill","licence-renewal","scholarship-rejection","payment-missing-application","consumer-refund"])}).partial();
export async function POST(request:Request){try{
  const input=sampleIdSchema.safeParse(await request.json().catch(()=>({})));if(!input.success)return NextResponse.json({error:"That sample case isn't available."},{status:400});
  const definition=sampleCaseById((input.data.sampleId??"consumer-refund") as SampleCaseId);if(!definition)return NextResponse.json({error:"That sample case isn't available."},{status:404});const source=definition.source;const repositories=getRepositories();
  const created=await repositories.cases.create({userId:DEMO_USER_ID,title:`Sample case — ${definition.title}`,category:source.category,description:source.description,priority:source.priority,situation:source.situation,people:source.people});
  const remap=(id:string)=>`${created.id}-${id}`;
  const evidence=source.evidence.map(item=>({...item,id:remap(item.id),caseId:created.id,filename:item.filename.replace("synthetic-","sample-")}));
  const facts=source.facts.map(item=>({...item,id:remap(item.id),caseId:created.id,sourceId:item.sourceId?remap(item.sourceId):undefined}));
  const timeline=source.timeline.map(item=>({...item,id:remap(item.id),caseId:created.id,sourceId:item.sourceId?remap(item.sourceId):undefined,sourceFactId:item.sourceFactId?remap(item.sourceFactId):undefined}));
  const missing=source.missingInformation.map(item=>({...item,id:remap(item.id),caseId:created.id}));
  const conflicts=source.conflicts.map(item=>({...item,id:remap(item.id),caseId:created.id,factAId:remap(item.factAId),factBId:remap(item.factBId)}));
  await Promise.all(evidence.map(item=>repositories.evidence.create(item)));await repositories.facts.createMany(facts);await repositories.timeline.replaceForCase(created.id,timeline);await repositories.missing.replaceForCase(created.id,missing);await repositories.conflicts.replaceForCase(created.id,conflicts);await repositories.setStatus(created.id,DEMO_USER_ID,"review");
  const record=await repositories.getAggregate(created.id,DEMO_USER_ID) as Case;return NextResponse.json({case:record,sample:true,sampleId:definition.id});
}catch{return NextResponse.json({error:"We couldn't open the sample case right now. Please try again."},{status:503});}}

