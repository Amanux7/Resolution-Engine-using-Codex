import { describe, expect, it } from "vitest";
import { OpenAIProvider } from "../lib/ai/provider";
import { syntheticImageFixtures } from "../data/evaluations/image-fixtures";

const enabled=process.env.RUN_OPENAI_INTEGRATION_TESTS==="true"&&Boolean(process.env.OPENAI_API_KEY);
const integration=enabled?it:it.skip;
describe("OpenAI image extraction (opt-in, paid)",()=>{
  integration("extracts only supported candidates from a fictional order image",async()=>{const fixture=syntheticImageFixtures[0];const facts=await new OpenAIProvider().extractFacts({imageData:fixture.image,evidenceId:"integration-order",filename:fixture.filename,mimeType:fixture.mimeType});expect(facts.some(fact=>fact.value.includes("RX-1024"))).toBe(true);expect(facts.every(fact=>fact.extractionMethod==="llm")).toBe(true);});
});
