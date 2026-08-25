import { describe, expect, it } from "vitest";
import { createCaseInput } from "../lib/cases/factory";
import { SupabaseRepositories } from "../lib/db/supabase-repository";
import { createSupabaseStorageProviderForTest } from "../lib/storage/supabase";
import { SupabaseServerClient } from "../lib/supabase/server-client";
import type { ActionPackage } from "../types/action-package";
import type { Conflict, Evidence, Fact, MissingInformation, TimelineEvent } from "../types/case";
import type { ResolutionRecommendation } from "../types/resolution";

function response(value: unknown, status = 200) { return new Response(status === 204 ? null : JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } }); }
function restClient() {
  const tables = new Map<string, Array<Record<string, unknown>>>();
  const fetchMock: typeof fetch = async (input, init = {}) => {
    const url = new URL(String(input)); const method = init.method ?? "GET"; const table = url.pathname.split("/").at(-1)!; const rows = tables.get(table) ?? []; tables.set(table, rows);
    const match = (row: Record<string, unknown>) => [...url.searchParams.entries()].every(([key, value]) => key === "select" || key === "order" || key === "limit" || !value.startsWith("eq.") || String(row[key]) === decodeURIComponent(value.slice(3)));
    if (method === "POST") { const row = JSON.parse(String(init.body)) as Record<string, unknown>; rows.push(row); return response([row]); }
    if (method === "PATCH") { const row = rows.find(match); if (!row) return response([]); Object.assign(row, JSON.parse(String(init.body))); return response([row]); }
    if (method === "DELETE") { tables.set(table, rows.filter((row) => !match(row))); return response(undefined, 204); }
    let result = rows.filter(match); if (url.searchParams.get("order")?.includes("desc")) result = result.reverse(); const limit = Number(url.searchParams.get("limit")); return response(limit ? result.slice(0, limit) : result);
  };
  return new SupabaseServerClient({ url: "https://project.supabase.co", serviceRoleKey: "test-service-key" }, fetchMock);
}

describe("Supabase adapters", () => {
  it("persists the existing aggregate objects through the hosted repository contract", async () => {
    const repositories = new SupabaseRepositories(restClient()); const caseData = await repositories.cases.create(createCaseInput("Damaged item and refund pending.", "hosted-user")); const at = new Date().toISOString();
    const evidence: Evidence = { id: "evidence-hosted", caseId: caseData.id, filename: "chat.txt", mimeType: "text/plain", size: 4, storageKey: "case/chat.txt", sourceType: "upload", processingStatus: "processed", extractedFactsCount: 1, uploadedAt: at, createdAt: at, updatedAt: at };
    const fact: Fact = { id: "fact-hosted", caseId: caseData.id, factType: "order_id", value: "RX-100", text: "RX-100", sourceType: "uploaded_file", sourceId: evidence.id, confidence: 0.9, createdBy: "system", extractionMethod: "parser", createdAt: at };
    const event: TimelineEvent = { id: "event-hosted", caseId: caseData.id, title: "Order placed", description: "Order RX-100", eventDate: "2026-08-03", sourceType: "uploaded_file", sourceId: fact.id, confidence: 0.9, createdBy: "system", createdAt: at };
    const conflict: Conflict = { id: "conflict-hosted", caseId: caseData.id, factAId: fact.id, factBId: fact.id, reason: "Test conflict", severity: "low", createdAt: at };
    const missing: MissingInformation = { id: "missing-hosted", caseId: caseData.id, label: "Refund confirmation", state: "unverified", reason: "Not in evidence", expectedFactType: "refund_date", createdAt: at };
    const recommendation: ResolutionRecommendation = { id: "recommendation-hosted", caseId: caseData.id, title: "Ask for confirmation", action: "Ask in writing.", explanation: "The refund is not confirmed.", reasons: [{ statement: "Order record exists", sourceType: "fact", sourceId: fact.id, confidence: "high" }], supportingEvidence: [{ evidenceId: evidence.id, reason: "Supports order details" }], unresolvedQuestions: ["Was the refund initiated?"], confidence: "medium", priority: "normal", requiresUserApproval: true, status: "ready_for_review", policyReferences: [], createdAt: at };
    const actionPackage: ActionPackage = { id: "package-hosted", caseId: caseData.id, recommendationId: recommendation.id, type: "seller_message", title: "Prepared message", summary: "Ask for confirmation.", caseSummary: { issue: "Damaged item", currentStatus: "Refund not confirmed" }, keyFacts: [], evidenceIndex: [], timelineSummary: [], conflictSummary: [], unresolvedQuestions: [], nextSteps: [], provenance: [], destination: { type: "seller", label: "Seller", integrationStatus: "manual" }, status: "ready_for_review", createdAt: at, updatedAt: at };
    await repositories.evidence.create(evidence); await repositories.facts.createMany([fact]); await repositories.timeline.replaceForCase(caseData.id, [event]); await repositories.conflicts.replaceForCase(caseData.id, [conflict]); await repositories.missing.replaceForCase(caseData.id, [missing]); await repositories.recommendations.create(recommendation); await repositories.actionPackages.create(actionPackage);
    const reloaded = await repositories.getAggregate(caseData.id, "hosted-user");
    expect(reloaded?.evidence[0]?.storageKey).toBe(evidence.storageKey); expect(reloaded?.facts[0]?.sourceId).toBe(evidence.id); expect(reloaded?.timeline[0]?.id).toBe(event.id); expect(reloaded?.conflicts[0]?.id).toBe(conflict.id); expect(reloaded?.missingInformation[0]?.id).toBe(missing.id); expect(reloaded?.recommendations[0]?.id).toBe(recommendation.id); expect((await repositories.actionPackages.getLatestByCaseId(caseData.id))?.id).toBe(actionPackage.id);
  });

  it("uses private signed URLs and server authorization for storage", async () => {
    const calls: Array<{ url: string; method?: string; headers?: Headers }> = [];
    const fetchMock: typeof fetch = async (input, init = {}) => { calls.push({ url: String(input), method: init.method, headers: new Headers(init.headers) }); if (String(input).includes("/sign/")) return response({ signedURL: "/storage/v1/object/sign/resolution-evidence/case/file.txt?token=temporary" }); if ((init.method ?? "GET") === "DELETE") return response(undefined, 204); if ((init.method ?? "GET") === "GET") return new Response(new Uint8Array([1, 2, 3])); return response({ Key: "case/file.txt" }); };
    const client = new SupabaseServerClient({ url: "https://project.supabase.co", serviceRoleKey: "test-service-key" }, fetchMock); const storage = createSupabaseStorageProviderForTest(client);
    const stored = await storage.upload({ storageKey: "case/file.txt", data: new Uint8Array([1, 2, 3]), contentType: "text/plain" });
    expect(stored.url).toContain("token=temporary"); expect(calls.every((call) => call.headers?.get("Authorization") === "Bearer test-service-key")).toBe(true); expect(calls.some((call) => call.url.includes("/public/"))).toBe(false); expect(await storage.read("case/file.txt")).toEqual(new Uint8Array([1, 2, 3]));
  });
});
