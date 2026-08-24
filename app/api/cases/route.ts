import { NextResponse } from "next/server";
import { createCaseSchema } from "@/lib/validation/case";
import { createCaseInput } from "@/lib/cases/factory";
import { getRepositories } from "@/lib/db";
const DEMO_USER_ID="user-demo";
export async function POST(request:Request){try{const body=await request.json();const parsed=createCaseSchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Please describe your problem."},{status:400});const record=await getRepositories().cases.create(createCaseInput(parsed.data.description,DEMO_USER_ID));return NextResponse.json({case:record});}catch(error){return NextResponse.json({error:error instanceof Error&&error.message.includes("JSON")?"We couldn't read that request. Please try again.":"We couldn't start the case. Please try again."},{status:400});}}
export async function GET(){try{return NextResponse.json({cases:await getRepositories().cases.listByUser(DEMO_USER_ID)});}catch{return NextResponse.json({error:"We couldn't load your saved cases right now."},{status:503});}}
