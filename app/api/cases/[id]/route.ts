import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepositories } from "@/lib/db";
const DEMO_USER_ID="user-demo";
const patchSchema=z.object({title:z.string().trim().min(1).max(160).optional(),description:z.string().trim().min(12).max(4000).optional(),status:z.enum(["draft","intake","evidence_processing","review","action_ready","resolved","archived"]).optional(),priority:z.enum(["low","medium","high"]).optional()}).strict();
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const record=await getRepositories().getAggregate(id,DEMO_USER_ID);if(!record)return NextResponse.json({error:"We couldn't find that case."},{status:404});return NextResponse.json({case:record});}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;try{const parsed=patchSchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:"That case update isn't valid."},{status:400});const updated=await getRepositories().cases.update(id,DEMO_USER_ID,parsed.data);if(!updated)return NextResponse.json({error:"We couldn't find that case."},{status:404});return NextResponse.json({case:updated});}catch{return NextResponse.json({error:"We couldn't update that case."},{status:400});}}
