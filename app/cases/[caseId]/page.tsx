import { Stage2CaseApp } from "@/components/case/stage2-app";

export default async function CasePage({params}:{params:Promise<{caseId:string}>}){
  const {caseId}=await params;
  return <Stage2CaseApp initialCaseId={caseId}/>;
}

