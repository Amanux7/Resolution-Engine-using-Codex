import { describe, expect, it } from "vitest";
import { POST as createSampleCase } from "../app/api/demo-case/route";
import { createCaseInput } from "../lib/cases/factory";
import { getRepositories } from "../lib/db";

describe("Stage 6 citizen journey safeguards",()=>{
  it("preserves Hinglish input and identifies a damaged product with refund follow-up",()=>{const description="Mera phone damaged aaya tha. Return pickup 12 August ko ho gaya but seller refund confirm nahi kar raha.";const input=createCaseInput(description);expect(input.description).toBe(description);expect(input.title).toContain("Damaged");expect(input.situation.currentSituation.toLowerCase()).toContain("refund");});
  it("creates a clearly labelled fictional sample without replacing a user-created case",async()=>{const repositories=getRepositories();const personal=await repositories.cases.create(createCaseInput("My service problem needs organizing.","user-demo"));const response=await createSampleCase();expect(response.status).toBe(200);const body=await response.json() as {case:{id:string;title:string}};expect(body.case.id).not.toBe(personal.id);expect(body.case.title).toContain("Sample case");const original=await repositories.cases.getById(personal.id,"user-demo");expect(original?.description).toContain("service problem");});
  it("keeps final output preparation-only",()=>{const citizenCopy="Nothing has been sent or submitted. You’ll submit this yourself.";expect(citizenCopy).not.toMatch(/sent automatically|submitted automatically/);expect(citizenCopy).toContain("You’ll submit this yourself");});
});
