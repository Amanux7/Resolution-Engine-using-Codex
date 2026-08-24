import { NextResponse } from "next/server";
import { z } from "zod";
import { ResolutionAgent } from "../../../../../lib/agents/resolution-agent";
import { getRepositories } from "../../../../../lib/db";
import { recordResolutionEvent } from "../../../../../lib/observability/resolution";
import { buildResolutionContext } from "../../../../../lib/resolution/context";

const DEMO_USER_ID="user-demo";
const feedbackSchema=z.object({status:z.enum(["approved","rejected","needs_more_information"])}).strict();

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const repositories=getRepositories();
  const caseData=await repositories.getAggregate(id,DEMO_USER_ID);
  if(!caseData)return NextResponse.json({error:"We couldn't find that case."},{status:404});
  return NextResponse.json({recommendation:await repositories.recommendations.getLatestByCaseId(id)??null});
}

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const repositories=getRepositories();
  const caseData=await repositories.getAggregate(id,DEMO_USER_ID);
  if(!caseData)return NextResponse.json({error:"We couldn't find that case."},{status:404});
  try{
    const run=await new ResolutionAgent().run(buildResolutionContext(caseData));
    const recommendation=await repositories.recommendations.create(run.recommendation);
    recordResolutionEvent("recommendation_persisted",id);
    if(recommendation.status==="ready_for_review")await repositories.setStatus(id,DEMO_USER_ID,"action_ready");
    return NextResponse.json({recommendation});
  }catch(error){
    const message=error instanceof Error?error.message:"We couldn't prepare a recommendation right now.";
    const unavailable=message.includes("AI_MODE=openai");
    return NextResponse.json({error:unavailable?"Recommendations are unavailable until the configured provider is connected.":"We couldn't prepare a recommendation right now. Please try again."},{status:unavailable?503:400});
  }
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const repositories=getRepositories();
  const caseData=await repositories.getAggregate(id,DEMO_USER_ID);
  if(!caseData)return NextResponse.json({error:"We couldn't find that case."},{status:404});
  try{
    const parsed=feedbackSchema.safeParse(await request.json());
    if(!parsed.success)return NextResponse.json({error:"That review choice isn't valid."},{status:400});
    const latest=await repositories.recommendations.getLatestByCaseId(id);
    if(!latest)return NextResponse.json({error:"There isn't a recommendation to review yet."},{status:404});
    const recommendation=await repositories.recommendations.updateStatus(latest.id,parsed.data.status);
    return NextResponse.json({recommendation});
  }catch{return NextResponse.json({error:"We couldn't save that review choice."},{status:400});}
}
