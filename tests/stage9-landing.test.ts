import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source=(...segments:string[])=>readFileSync(path.join(process.cwd(),...segments),"utf8");

describe("Stage 9 landing and workspace routes",()=>{
  it("explains the product with one H1 and routes primary actions to the workspace",()=>{
    const page=source("app","page.tsx");
    expect((page.match(/<h1/g)??[]).length).toBe(1);
    expect(page).toContain("Different problems.");
    expect(page).toContain('href="/app"');
    expect(page).toContain("/app?sample=${sample.id}");
    expect(page).toContain("Nothing is sent or filed without you.");
  });

  it("validates sample identifiers before passing them into the shared workspace",()=>{
    const workspace=source("app","app","page.tsx");
    expect(workspace).toContain("sampleCaseById");
    expect(workspace).toContain("<Stage2CaseApp initialSampleId={initialSampleId}/>");
  });

  it("keeps direct case URLs on the shared workspace",()=>{
    const casePage=source("app","cases","[caseId]","page.tsx");
    expect(casePage).toContain("<Stage2CaseApp initialCaseId={caseId}/>");
  });
});

