import type { Metadata } from "next";
import { Stage2CaseApp } from "@/components/case/stage2-app";
import { sampleCaseById, type SampleCaseId } from "@/data/demo/sample-cases";

export const metadata:Metadata={title:"Start a case — Resolution Engine",description:"Describe what went wrong and organize the evidence into a case."};

export default async function WorkspacePage({searchParams}:{searchParams:Promise<{sample?:string}>}){
  const {sample}=await searchParams;
  const initialSampleId=sample&&sampleCaseById(sample as SampleCaseId)?sample as SampleCaseId:undefined;
  return <Stage2CaseApp initialSampleId={initialSampleId}/>;
}

