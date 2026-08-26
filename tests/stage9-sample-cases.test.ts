import { describe, expect, it } from "vitest";
import { POST as createSample } from "../app/api/demo-case/route";
import { sampleCases } from "../data/demo/sample-cases";

describe("Stage 9 cross-domain sample cases",()=>{
  for(const sample of sampleCases){it(`${sample.id} persists through the common sample endpoint`,async()=>{
    const response=await createSample(new Request("http://localhost/api/demo-case",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sampleId:sample.id})}));
    const body=await response.json() as {case?:typeof sample.source};
    expect(response.status).toBe(200);expect(body.case?.title).toContain("Sample case");expect(body.case?.evidence.length).toBe(sample.source.evidence.length);expect(body.case?.facts.every(f=>f.caseId===body.case?.id&&f.sourceId&&body.case?.evidence.some(e=>e.id===f.sourceId))).toBe(true);expect(body.case?.timeline.every(event=>event.caseId===body.case?.id)).toBe(true);expect(body.case?.missingInformation.length).toBeGreaterThan(0);
    if(sample.id==="document-correction"||sample.id==="electricity-bill")expect(body.case?.conflicts.length).toBeGreaterThan(0);else expect(body.case?.conflicts.length).toBe(0);
  })}
});

