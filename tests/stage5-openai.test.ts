import { describe, expect, it } from "vitest";
import { evidenceExtractionJsonSchema, parseEvidenceExtraction } from "../lib/ai/evidence-extraction-schema";
import { validateExtractedFact } from "../lib/facts/validation";
import { syntheticImageFixtures } from "../data/evaluations/image-fixtures";

const valid={evidenceType:"order_confirmation",summary:"An order confirmation is visible.",facts:[{factType:"order_id",value:"RX-1024",confidence:"high",sourceText:"Order: RX-1024"},{factType:"amount",value:"INR 18,499",normalizedValue:"18499",confidence:"high",sourceText:"Amount: INR 18,499"}],detectedDates:[{label:"Order date",value:"2026-08-03",sourceText:"Date: 2026-08-03"}],detectedAmounts:[{label:"Order amount",value:"18499",currency:"INR",sourceText:"Amount: INR 18,499"}],uncertainty:[],warnings:[]};
describe("Stage 5 structured image extraction boundary",()=>{
  it("accepts strict structured candidates and validates them before persistence",()=>{const result=parseEvidenceExtraction(valid);expect(result.facts).toHaveLength(2);expect(validateExtractedFact({factType:"amount",value:"INR 18,499",normalizedValue:"18499",confidence:.9,sourceText:"Amount: INR 18,499",extractionMethod:"llm"},{caseId:"case-1",sourceId:"evidence-1"})).toBe(true);});
  it("rejects malformed provider output rather than partially accepting it",()=>{expect(()=>parseEvidenceExtraction({...valid,facts:[{...valid.facts[0],confidence:"certain"}]})).toThrow();expect(()=>parseEvidenceExtraction({...valid,unexpected:true})).toThrow();});
  it("keeps the schema closed to unexpected nested data",()=>{expect((evidenceExtractionJsonSchema as {additionalProperties:boolean}).additionalProperties).toBe(false);});
  it("provides fictional PNG fixtures for order, support, conflict, adversarial, and no-evidence evaluation",()=>{expect(syntheticImageFixtures).toHaveLength(5);for(const fixture of syntheticImageFixtures){expect(fixture.image.slice(1,4)).toEqual(new Uint8Array([80,78,71]));expect(fixture.filename).toMatch(/^synthetic-/);}});
  it("keeps instruction-like evidence as data and never treats it as a completed refund",()=>{const adversarial=syntheticImageFixtures.find(item=>item.id==="synthetic-adversarial")!;expect(adversarial.prohibitedInferences).toContain("refund completed");expect(adversarial.expectedFacts).toContain("RX-1024");});
});
