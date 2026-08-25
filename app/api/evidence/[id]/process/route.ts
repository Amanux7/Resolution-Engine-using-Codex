import { NextResponse } from "next/server";
import { processEvidence } from "@/lib/evidence/pipeline";
const DEMO_USER_ID="user-demo";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;try{return NextResponse.json(await processEvidence(id,DEMO_USER_ID));}catch(error){const message=error instanceof Error?error.message:"";if(message.includes("couldn't find that evidence"))return NextResponse.json({error:"We couldn't find that file."},{status:404});return NextResponse.json({error:"We couldn't read this file right now. Please try again later."},{status:503});}}
