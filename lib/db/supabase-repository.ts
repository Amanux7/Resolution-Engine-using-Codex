import { randomUUID } from "node:crypto";
import type { ActionPackage, ActionPackageStatus, CommunicationDraft } from "../../types/action-package";
import type { Case, CaseStatus, Conflict, Evidence, Fact, MissingInformation, TimelineEvent } from "../../types/case";
import type { RecommendationStatus, ResolutionRecommendation } from "../../types/resolution";
import { escapePostgrestValue, SupabaseServerClient } from "../supabase/server-client";
import type { Repositories } from "./repositories";

type StoredRow<T> = { id: string; case_id?: string; user_id?: string; source_id?: string; status?: string; created_at: string; updated_at?: string; payload: T };
const now = () => new Date().toISOString();
const select = "select=*";
const exact = (value: string) => `eq.${escapePostgrestValue(value)}`;
function readiness(record: Case, evidence: Evidence[], facts: Fact[], timeline: TimelineEvent[], conflicts: Conflict[], missing: MissingInformation[]): Case["readiness"] { const processed = evidence.filter((item) => item.processingStatus === "processed").length; return { factsFound: facts.length, factsExpected: 5, evidenceProcessed: processed, evidenceTotal: evidence.length, timelineComplete: timeline.length > 0, conflicts: conflicts.length, missingDetails: missing.length, label: conflicts.length || missing.length ? "Needs review" : facts.length ? "Ready for review" : "Needs evidence" }; }

/** PostgREST-backed equivalent of the local repository. Domain objects remain in
 * JSONB payloads; relational IDs/status/timestamps remain queryable columns. */
export class SupabaseRepositories implements Repositories {
  constructor(private readonly client = new SupabaseServerClient()) {}
  private async rows<T>(table: string, filter: string): Promise<StoredRow<T>[]> { return this.client.request<StoredRow<T>[]>(`/rest/v1/${table}?${select}&${filter}`); }
  private async insert<T>(table: string, row: StoredRow<T>): Promise<T> { const result = await this.client.request<StoredRow<T>[]>(`/rest/v1/${table}?${select}`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) }); if (!result[0]) throw new Error("Hosted persistence did not confirm the saved record."); return result[0].payload; }
  private async patch<T>(table: string, id: string, changes: Partial<StoredRow<T>>): Promise<T | undefined> { const result = await this.client.request<StoredRow<T>[]>(`/rest/v1/${table}?${select}&id=${exact(id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(changes) }); return result[0]?.payload; }
  private remove(table: string, filter: string) { return this.client.request<void>(`/rest/v1/${table}?${filter}`, { method: "DELETE" }); }
  private async findCase(id: string, userId: string) { return (await this.rows<Case>("resolution_cases", `id=${exact(id)}&user_id=${exact(userId)}`))[0]?.payload; }

  cases = {
    create: async (input: Pick<Case, "userId" | "title" | "category" | "description" | "priority" | "situation" | "people">) => { const createdAt = now(); const record: Case = { ...input, id: `case-${randomUUID()}`, status: "intake", createdAt, updatedAt: createdAt, facts: [], evidence: [], timeline: [], conflicts: [], missingInformation: [], tasks: [], recommendations: [], communications: [], readiness: { factsFound: 0, factsExpected: 5, evidenceProcessed: 0, evidenceTotal: 0, timelineComplete: false, conflicts: 0, missingDetails: 0, label: "Needs evidence" } }; await this.insert("resolution_cases", { id: record.id, user_id: record.userId, status: record.status, created_at: record.createdAt, updated_at: record.updatedAt, payload: record }); return this.getAggregate(record.id, record.userId) as Promise<Case>; },
    getById: async (id: string, userId: string) => this.getAggregate(id, userId),
    listByUser: async (userId: string) => Promise.all((await this.rows<Case>("resolution_cases", `user_id=${exact(userId)}&order=created_at.desc`)).map((row) => this.getAggregate(row.id, userId))).then((items) => items.filter((item): item is Case => Boolean(item))),
    update: async (id: string, userId: string, patch: Partial<Pick<Case, "title" | "description" | "status" | "priority" | "situation">>) => { const record = await this.findCase(id, userId); if (!record) return undefined; const updated = { ...record, ...patch, updatedAt: now() }; await this.patch("resolution_cases", id, { status: updated.status, updated_at: updated.updatedAt, payload: updated }); return this.getAggregate(id, userId); },
  };
  evidence = {
    create: (item: Evidence) => this.insert("resolution_evidence", { id: item.id, case_id: item.caseId, status: item.processingStatus, created_at: item.createdAt, updated_at: item.updatedAt, payload: item }),
    getById: async (id: string) => (await this.rows<Evidence>("resolution_evidence", `id=${exact(id)}`))[0]?.payload,
    getByCaseId: async (caseId: string) => (await this.rows<Evidence>("resolution_evidence", `case_id=${exact(caseId)}&order=created_at.asc`)).map((row) => row.payload),
    updateProcessingStatus: async (id: string, status: Evidence["processingStatus"], patch: Partial<Evidence> = {}) => { const current = await this.evidence.getById(id); if (!current) return undefined; const updated = { ...current, ...patch, processingStatus: status, updatedAt: now() }; return this.patch("resolution_evidence", id, { status, updated_at: updated.updatedAt, payload: updated }); },
  };
  facts = {
    createMany: async (facts: Fact[]) => Promise.all(facts.map((item) => this.insert("resolution_facts", { id: item.id, case_id: item.caseId, source_id: item.sourceId, created_at: item.createdAt, payload: item }))),
    getByCaseId: async (caseId: string) => (await this.rows<Fact>("resolution_facts", `case_id=${exact(caseId)}&order=created_at.asc`)).map((row) => row.payload),
    replaceForEvidence: async (caseId: string, sourceId: string, facts: Fact[]) => { await this.remove("resolution_facts", `case_id=${exact(caseId)}&source_id=${exact(sourceId)}`); await this.facts.createMany(facts); return this.facts.getByCaseId(caseId); },
  };
  timeline = { replaceForCase: async (caseId: string, events: TimelineEvent[]) => { await this.remove("resolution_timeline_events", `case_id=${exact(caseId)}`); await Promise.all(events.map((item) => this.insert("resolution_timeline_events", { id: item.id, case_id: item.caseId, created_at: item.createdAt, payload: item }))); return this.timeline.getByCaseId(caseId); }, getByCaseId: async (caseId: string) => (await this.rows<TimelineEvent>("resolution_timeline_events", `case_id=${exact(caseId)}&order=created_at.asc`)).map((row) => row.payload) };
  conflicts = { replaceForCase: async (caseId: string, items: Conflict[]) => { await this.remove("resolution_conflicts", `case_id=${exact(caseId)}`); await Promise.all(items.map((item) => this.insert("resolution_conflicts", { id: item.id, case_id: item.caseId, created_at: item.createdAt, payload: item }))); return this.conflicts.getByCaseId(caseId); }, getByCaseId: async (caseId: string) => (await this.rows<Conflict>("resolution_conflicts", `case_id=${exact(caseId)}&order=created_at.asc`)).map((row) => row.payload) };
  missing = { replaceForCase: async (caseId: string, items: MissingInformation[]) => { await this.remove("resolution_missing_information", `case_id=${exact(caseId)}`); await Promise.all(items.map((item) => this.insert("resolution_missing_information", { id: item.id, case_id: item.caseId, created_at: item.createdAt, payload: item }))); return this.missing.getByCaseId(caseId); }, getByCaseId: async (caseId: string) => (await this.rows<MissingInformation>("resolution_missing_information", `case_id=${exact(caseId)}&order=created_at.asc`)).map((row) => row.payload) };
  recommendations = {
    create: (item: ResolutionRecommendation) => this.insert("resolution_recommendations", { id: item.id, case_id: item.caseId, status: item.status, created_at: item.createdAt, payload: item }),
    getLatestByCaseId: async (caseId: string) => (await this.rows<ResolutionRecommendation>("resolution_recommendations", `case_id=${exact(caseId)}&order=created_at.desc&limit=1`))[0]?.payload,
    listByCaseId: async (caseId: string) => (await this.rows<ResolutionRecommendation>("resolution_recommendations", `case_id=${exact(caseId)}&order=created_at.desc`)).map((row) => row.payload),
    updateStatus: async (id: string, status: RecommendationStatus) => { const current = (await this.rows<ResolutionRecommendation>("resolution_recommendations", `id=${exact(id)}`))[0]?.payload; return current ? this.patch("resolution_recommendations", id, { status, payload: { ...current, status } }) : undefined; },
  };
  actionPackages = {
    create: (item: ActionPackage) => this.insert("resolution_action_packages", { id: item.id, case_id: item.caseId, status: item.status, created_at: item.createdAt, updated_at: item.updatedAt, payload: item }),
    getById: async (id: string) => (await this.rows<ActionPackage>("resolution_action_packages", `id=${exact(id)}`))[0]?.payload,
    getLatestByCaseId: async (caseId: string) => (await this.rows<ActionPackage>("resolution_action_packages", `case_id=${exact(caseId)}&order=created_at.desc&limit=1`))[0]?.payload,
    listByCaseId: async (caseId: string) => (await this.rows<ActionPackage>("resolution_action_packages", `case_id=${exact(caseId)}&order=created_at.desc`)).map((row) => row.payload),
    updateStatus: async (id: string, status: ActionPackageStatus) => { const current = await this.actionPackages.getById(id); if (!current) return undefined; const updated = { ...current, status, updatedAt: now() }; return this.patch("resolution_action_packages", id, { status, updated_at: updated.updatedAt, payload: updated }); },
    updateCommunication: async (id: string, communication: CommunicationDraft) => { const current = await this.actionPackages.getById(id); if (!current) return undefined; const updated = { ...current, communication, updatedAt: now() }; return this.patch("resolution_action_packages", id, { updated_at: updated.updatedAt, payload: updated }); },
  };
  async getAggregate(id: string, userId: string): Promise<Case | undefined> { const record = await this.findCase(id, userId); if (!record) return undefined; const [evidence, facts, timeline, conflicts, missing, recommendations] = await Promise.all([this.evidence.getByCaseId(id), this.facts.getByCaseId(id), this.timeline.getByCaseId(id), this.conflicts.getByCaseId(id), this.missing.getByCaseId(id), this.recommendations.listByCaseId(id)]); return { ...record, evidence, facts, timeline, conflicts, missingInformation: missing, recommendations, readiness: readiness(record, evidence, facts, timeline, conflicts, missing) }; }
  setStatus(id: string, userId: string, status: CaseStatus) { return this.cases.update(id, userId, { status }); }
}
export type SupabaseRepositoryContract = Repositories;
