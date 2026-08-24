import { NextResponse } from "next/server";
import { processEvidence } from "@/lib/evidence/pipeline";
const DEMO_USER_ID="user-demo";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;try{return NextResponse.json(await processEvidence(id,DEMO_USER_ID));}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"We couldn't process that evidence."},{status:400});}}
