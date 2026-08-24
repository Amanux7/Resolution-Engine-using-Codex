import { NextResponse } from "next/server";
import { getRepositories } from "@/lib/db";
const DEMO_USER_ID="user-demo";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const record=await getRepositories().getAggregate(id,DEMO_USER_ID);if(!record)return NextResponse.json({error:"We couldn't find that case."},{status:404});return NextResponse.json({facts:record.facts,conflicts:record.conflicts,missingInformation:record.missingInformation});}
