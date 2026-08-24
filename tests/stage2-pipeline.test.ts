import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createCaseInput } from "../lib/cases/factory";
import { getRepositories } from "../lib/db";
import { processEvidence } from "../lib/evidence/pipeline";
import { getStorageProvider } from "../lib/storage";
import type { Evidence } from "../types/case";

describe("Stage 2 persistence pipeline", () => {
  it("creates, processes, and reloads a text-backed case", async () => {
    const userId = `test-user-${randomUUID()}`;
    const repositories = getRepositories();
    const created = await repositories.cases.create(createCaseInput(
      "My phone arrived damaged and the seller has not refunded me.",
      userId,
    ));
    const storage = getStorageProvider();
    const storageKey = `tests/${created.id}/support.txt`;
    const data = new TextEncoder().encode(
      "ExampleMart order RX-2026\nAmount: ₹18,499\nOrdered Aug 03\nDelivered Aug 07\nRefund expected Aug 15.",
    );
    const stored = await storage.upload({ storageKey, data, contentType: "text/plain" });
    const evidence: Evidence = {
      id: `evidence-${randomUUID()}`,
      caseId: created.id,
      filename: "support.txt",
      mimeType: "text/plain",
      size: data.byteLength,
      storageKey: stored.storageKey,
      storageUrl: stored.url,
      sourceType: "upload",
      processingStatus: "pending",
      extractedFactsCount: 0,
      uploadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repositories.evidence.create(evidence);

    const result = await processEvidence(evidence.id, userId);
    const reloaded = await repositories.getAggregate(created.id, userId);

    expect(result.evidence.processingStatus).toBe("processed");
    expect(result.facts.some((fact) => fact.factType === "order_id")).toBe(true);
    expect(result.facts.every((fact) => fact.sourceId === evidence.id)).toBe(true);
    expect(result.caseData.timeline.length).toBeGreaterThan(0);
    expect(reloaded?.status).toBe("review");
    expect(reloaded?.evidence).toHaveLength(1);
    expect(reloaded?.facts.length).toBe(result.facts.length);
    expect(reloaded?.timeline.length).toBe(result.caseData.timeline.length);
  });

  it("preserves image and PDF evidence when local extraction is unavailable", async () => {
    const userId = `test-user-${randomUUID()}`;
    const repositories = getRepositories();
    const created = await repositories.cases.create(createCaseInput("A photo shows the damaged package.", userId));
    const storage = getStorageProvider();
    const cases = [
      { filename: "delivery.png", mimeType: "image/png" },
      { filename: "invoice.pdf", mimeType: "application/pdf" },
    ];

    for (const item of cases) {
      const storageKey = `tests/${created.id}/${item.filename}`;
      const stored = await storage.upload({ storageKey, data: new Uint8Array([1, 2, 3]), contentType: item.mimeType });
      await repositories.evidence.create({
        id: `evidence-${randomUUID()}`,
        caseId: created.id,
        filename: item.filename,
        mimeType: item.mimeType,
        size: 3,
        storageKey: stored.storageKey,
        storageUrl: stored.url,
        sourceType: "upload",
        processingStatus: "pending",
        extractedFactsCount: 0,
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const evidence = await repositories.evidence.getByCaseId(created.id);
    for (const item of evidence) {
      const result = await processEvidence(item.id, userId);
      expect(result.evidence.processingStatus).toBe("needs_processing");
      expect(result.evidence.errorMessage).toContain("original");
    }
    expect((await repositories.evidence.getByCaseId(created.id))).toHaveLength(2);
  });
});
