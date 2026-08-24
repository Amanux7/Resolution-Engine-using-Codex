import { NextResponse } from "next/server";
import { createDemoCase } from "../../../data/demo/demo-case";
import { getRepositories } from "../../../lib/db";
import type { Case } from "../../../types/case";

const DEMO_USER_ID="user-demo";
/** Creates a clearly named fictional walkthrough without mixing it up with a user's own case. */
export async function POST(){try{
  const source=createDemoCase();const repositories=getRepositories();
  const created=await repositories.cases.create({userId:DEMO_USER_ID,title:"Sample case — damaged phone refund",category:source.category,description:source.description,priority:source.priority,situation:source.situation,people:source.people});
  const remap=(id:string)=>`${created.id}-${id}`;
  const evidence=source.evidence.map(item=>({...item,id:remap(item.id),caseId:created.id,filename:item.filename.replace("synthetic-","sample-")}));
  const facts=source.facts.map(item=>({...item,id:remap(item.id),caseId:created.id,sourceId:item.sourceId?remap(item.sourceId):undefined}));
  const timeline=source.timeline.map(item=>({...item,id:remap(item.id),caseId:created.id,sourceId:item.sourceId?remap(item.sourceId):undefined,sourceFactId:item.sourceFactId?remap(item.sourceFactId):undefined}));
  const missing=source.missingInformation.map(item=>({...item,id:remap(item.id),caseId:created.id}));
  await Promise.all(evidence.map(item=>repositories.evidence.create(item)));await repositories.facts.createMany(facts);await repositories.timeline.replaceForCase(created.id,timeline);await repositories.missing.replaceForCase(created.id,missing);await repositories.setStatus(created.id,DEMO_USER_ID,"review");
  const record=await repositories.getAggregate(created.id,DEMO_USER_ID) as Case;return NextResponse.json({case:record,sample:true});
}catch{return NextResponse.json({error:"We couldn't open the sample case right now. Please try again."},{status:503});}}
