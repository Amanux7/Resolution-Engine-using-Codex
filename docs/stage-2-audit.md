# Stage 2 audit

## Verified

- Cases persist through a provider-neutral repository interface backed by local JSON storage.
- Evidence is validated server-side, stored through a storage interface, and linked to its case.
- TXT evidence is normalized and processed deterministically in the server pipeline.
- PDF and image evidence remain preserved and visibly marked `needs_processing` when no parser/OCR adapter is configured.
- Facts are validated before persistence and retain source evidence ID, source text, confidence, creator, and extraction method.
- Conflicting dates/amounts are represented as conflicts instead of being silently merged.
- Missing expected information is represented separately from known facts and shown in the case review.
- Timeline events are generated only from dated facts and link back to their source fact.
- A case can be reopened from the saved-case list, with its evidence, facts, timeline, conflicts, and missing information intact.
- REST-like case, evidence, fact, timeline, and retry routes are present with server-side validation and demo-user ownership checks.
- The review UI separates confirmed, user-provided, lower-confidence/inferred, and unknown information, and shows deterministic readiness counts.
- The AI provider remains a server-side seam. The current mock provider returns no facts, so the UI does not claim that AI performed extraction.

## Fixed

- Replaced client-only synthetic evidence state with repository-backed evidence records and local file storage.
- Added upload validation for supported type, extension, empty files, malformed MIME data, and per-type size limits.
- Added transparent processing states and retry behavior for unavailable extractors.
- Added deterministic text fact extraction, fact validation, conflict detection, missing-information detection, and timeline building.
- Added repository/pipeline tests and a Vitest alias-free import path so the end-to-end pipeline runs in the configured test command.
- Made month/day text dates deterministic for the current runtime year instead of depending on JavaScript's implementation-specific date parsing.
- Updated ESLint to ignore generated build and local runtime data.
- Updated the README with persistence, storage, API, provider, and Stage 2 boundary decisions.

## Remaining

- The local repository is a development fallback, not a multi-user production database. It is intentionally file-backed and has no authentication.
- Supabase/Postgres and S3-compatible adapters are contracts/seams, not connected production integrations.
- Local PDF extraction and OCR are not configured. These files are safely retained, but no facts are claimed from them.
- Deterministic text extraction is intentionally narrow and is not a general language understanding system.
- The current demo user is fixed to `user-demo` for the prototype. Real identity, authorization, retention, encryption, and privacy controls belong to a later stage.
- Resolution, policy lookup, communications, escalation, and autonomous actions are intentionally not implemented.
- Browser-level automated file chooser coverage is not included; server-side upload and pipeline behavior are covered by tests.

## Stage 2 prerequisites

- `CaseRepository`, `EvidenceRepository`, `FactRepository`, `TimelineRepository`, conflict, and missing-information repositories are ready for a Postgres/Supabase implementation.
- `StorageProvider` is ready for Supabase Storage or S3-compatible storage without changing UI components or processors.
- `EvidenceContentExtractor` is the seam for PDF parsing, OCR, and future multimodal processing.
- `AIProvider.extractFacts()` accepts structured extraction input and returns validated candidates; the application controls persistence.
- `types/agent.ts` contains contracts for IntakeAgent, EvidenceAgent, TimelineAgent, ResolutionAgent, CommunicationAgent, EscalationAgent, and FollowUpAgent.

## Risks

- Replacing local JSON with a concurrent database must preserve ownership checks and the replace-for-evidence semantics used to avoid duplicate facts on retry.
- Future OCR/LLM adapters must attach precise source text or source locations and must not turn uncertain output into confirmed facts without validation.
- Date-only evidence without a year currently uses the runtime year; production ingestion should use document context or explicit user confirmation.
- Any future external action must remain behind an explicit approval boundary and must not be inferred from the current `review` state.

## Recommended Stage 3 starting point

Implement the Resolution Agent against the existing persisted case aggregate, beginning with a read-only next-action planner that consumes validated facts, timeline events, conflicts, missing information, and policy-tool results. Keep recommendations review-only until user approval and leave external submission/communication out of the first Stage 3 slice.
