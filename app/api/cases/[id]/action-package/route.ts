import { NextResponse } from "next/server";
import { z } from "zod";
import { CommunicationAgent } from "../../../../../lib/agents/communication-agent";
import { buildCommunicationContext } from "../../../../../lib/action-package/context";
import { ResolutionPackBuilder } from "../../../../../lib/action-package/builder";
import { canTransitionActionPackage, findUnsupportedStatements, validateActionPackage, validateCommunicationDraft } from "../../../../../lib/action-package/validation";
import { getRepositories } from "../../../../../lib/db";
import { recordActionPackageEvent } from "../../../../../lib/observability/action-package";

const DEMO_USER_ID="user-demo";
const postSchema=z.object({tone:z.enum(["clear","firm","formal"]).default("clear"),channel:z.enum(["email","support_chat","grievance","generic"]).default("support_chat"),userInstruction:z.string().trim().max(500).optional()}).strict();
const patchSchema=z.object({status:z.enum(["ready_for_review","approved","needs_changes","ready_to_use"]).optional(),body:z.string().trim().min(1).max(10000).optional(),tone:z.enum(["clear","firm","formal"]).optional(),confirmUnsupported:z.boolean().optional()}).strict().refine(value=>value.status||value.body||value.tone,{message:"Choose a valid package update."});

async function resources(id:string){const repositories=getRepositories();const caseData=await repositories.getAggregate(id,DEMO_USER_ID);return {repositories,caseData};}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const {repositories,caseData}=await resources(id);
  if(!caseData)return NextResponse.json({error:"We couldn't find that case."},{status:404});
  return NextResponse.json({actionPackage:await repositories.actionPackages.getLatestByCaseId(id)??null});
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const {repositories,caseData}=await resources(id);
  if(!caseData)return NextResponse.json({error:"We couldn't find that case."},{status:404});
  try{
    const parsed=postSchema.safeParse(await request.json().catch(()=>({})));
    if(!parsed.success)return NextResponse.json({error:"Choose a valid tone and communication type."},{status:400});
    const recommendation=await repositories.recommendations.getLatestByCaseId(id);
    if(!recommendation||recommendation.status!=="approved")return NextResponse.json({error:"Review the recommended next step before preparing the action."},{status:409});
    const context=buildCommunicationContext(caseData,recommendation,parsed.data.userInstruction);recordActionPackageEvent("communication_context_built",id);
    const communication=await new CommunicationAgent().prepare(context,parsed.data.tone,parsed.data.channel);recordActionPackageEvent("communication_generated",id);recordActionPackageEvent("communication_validated",id);
    const built=new ResolutionPackBuilder().build(context,communication);validateActionPackage(built,context);recordActionPackageEvent("action_package_built",id);
    return NextResponse.json({actionPackage:await repositories.actionPackages.create(built)});
  }catch(error){const message=error instanceof Error?error.message:"We couldn't prepare your next step.";return NextResponse.json({error:message.includes("AI_MODE=openai")?"Action preparation is unavailable until the configured provider is connected.":message},{status:400});}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const {repositories,caseData}=await resources(id);
  if(!caseData)return NextResponse.json({error:"We couldn't find that case."},{status:404});
  try{
    const parsed=patchSchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"That action-package update isn't valid."},{status:400});
    let actionPackage=await repositories.actionPackages.getLatestByCaseId(id);if(!actionPackage)return NextResponse.json({error:"Prepare your next step before reviewing it."},{status:404});
    if((parsed.data.body||parsed.data.tone)&&!["ready_for_review","needs_changes"].includes(actionPackage.status))return NextResponse.json({error:"Mark this package as needing changes before editing its prepared message."},{status:409});
    const recommendation=(await repositories.recommendations.listByCaseId(id)).find(item=>item.id===actionPackage!.recommendationId);
    if(!recommendation)return NextResponse.json({error:"The approved recommendation for this package is unavailable."},{status:409});
    const context=buildCommunicationContext(caseData,recommendation);
    if(parsed.data.tone){const communication=await new CommunicationAgent().prepare(context,parsed.data.tone,actionPackage.communication?.channel??"support_chat");actionPackage=(await repositories.actionPackages.updateCommunication(actionPackage.id,communication))!;}
    if(parsed.data.body&&actionPackage.communication){const unsupportedStatements=findUnsupportedStatements(parsed.data.body,actionPackage.communication.generatedBody);const communication={...actionPackage.communication,body:parsed.data.body,status:"edited" as const,unsupportedStatements,updatedAt:new Date().toISOString()};validateCommunicationDraft(communication,context);actionPackage=(await repositories.actionPackages.updateCommunication(actionPackage.id,communication))!;}
    if(parsed.data.status){if(!canTransitionActionPackage(actionPackage.status,parsed.data.status))return NextResponse.json({error:`This package cannot move from ${actionPackage.status.replaceAll("_"," ")} to ${parsed.data.status.replaceAll("_"," ")}.`},{status:409});if(parsed.data.status==="approved"&&actionPackage.communication?.unsupportedStatements.some(item=>item.severity==="confirmation_required")&&!parsed.data.confirmUnsupported)return NextResponse.json({error:"Confirm the unsupported statement before approving this edited draft.",requiresConfirmation:true},{status:409});actionPackage=(await repositories.actionPackages.updateStatus(actionPackage.id,parsed.data.status))!;recordActionPackageEvent(parsed.data.status==="ready_to_use"?"action_package_ready":"action_package_reviewed",id);}
    return NextResponse.json({actionPackage});
  }catch{return NextResponse.json({error:"We couldn't save those action-package changes."},{status:400});}
}
