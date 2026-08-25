# Stage 4 audit

## Architecture

Stage 4 adds a separate, append-only `ActionPackage` aggregate. A recommendation answers what the user should probably do; an action package contains what the user needs to do it manually.

```text
Approved recommendation
  → deterministic CommunicationContext
  → CommunicationAgent
  → communication claim validation
  → deterministic ResolutionPackBuilder
  → package provenance validation
  → append-only ActionPackageRepository
  → user review and ready_to_use state
```

`CommunicationAgent` performs bounded language preparation through the existing provider interface. `ResolutionPackBuilder` is ordinary deterministic software that assembles validated facts, evidence, timeline events, conflicts, missing information, the recommendation, and the communication. It does not call a model.

## Human approval

Action preparation requires the latest recommendation to have status `approved`. Draft, ready-for-review, rejected, and needs-more-information recommendations are rejected by the API with a plain-language instruction to review the recommendation first.

Action packages support only `draft`, `ready_for_review`, `approved`, `needs_changes`, and `ready_to_use`. There are no sent, submitted, filed, executed, or resolved package states.

## Provenance

Every generated communication claim references a fact, timeline event, evidence item, or the approved recommendation. The validator resolves each source ID against the deliberately supplied communication context. Resolution Pack sections retain fact, evidence, timeline, recommendation, and communication provenance.

Conflicted facts are removed from communication generation. Missing information is qualified as unconfirmed instead of converted into a negative claim. Generated legal, fraud, theft, statutory, and invented-deadline assertions are rejected deterministically.

## User edits

`CommunicationDraft.generatedBody` preserves the generated version while `body` contains the current editable version. Generated claims remain unchanged when the user edits text. Added sentences are recorded as unsupported statements rather than being promoted to verified claims.

Ordinary unsupported additions receive a visible warning. Severe legal, fraud, theft, or invented-deadline language requires explicit confirmation before package approval. The wording is retained; it is never silently deleted or marked as evidence-backed.

## Resolution Pack

The persisted pack contains:

- Supported case summary fields
- Key facts with verified, user-provided, or inferred state
- Evidence index and supported fact labels
- Concise evidence-backed timeline
- Visible conflicts
- Missing and unresolved information
- Approved recommendation linkage
- Prepared editable communication
- Manual next-step instructions
- Section-level provenance
- A manual-only destination record

The UI describes the pack as grievance-ready only as an organizational aid. It does not imply official compatibility, legal sufficiency, or acceptance by a public service.

## External-action boundary

Stage 4 sends and submits nothing. It has no email, messaging, seller, payment, refund, helpline, grievance, or government-system action integration. `ready_to_use` means that the user has reviewed material they may copy and use manually.

## Evaluation

| Fixture | Expected preparation behavior | Result |
| --- | --- | --- |
| Damaged product + refund pending | Request written refund status; no legal threat | Pass |
| Missing delivery | Request delivery verification; no theft accusation | Pass |
| Wrong product | Describe supported mismatch and request resolution; no invented product data | Pass |
| Delayed refund promise | Request status using supported context; no invented deadline | Pass |
| Conflicting dates | Omit both disputed dates; never silently select one | Pass |

The Stage 4 suite also verifies approval gating, source validity, generated-claim safety, missing-information qualification, tone/source invariance, user-edit separation, pack contents, history, controlled transitions, REST behavior, persistence, and reload.

## Accessibility and responsive behavior

The communication editor has a native label. Tone choices use keyboard-operable radio controls with 44-pixel targets. Source inspection uses an accessible expanded state and moves focus to the source heading. Evidence controls have descriptive names. Unsupported wording uses icon, heading, and text rather than color alone. Status changes use screen-reader status messaging.

The rendered path was exercised through persisted case reopening, approved recommendation gating, package preparation, clear/firm/formal tone regeneration, source inspection, unsupported-accusation warning, safe user editing, package approval, `ready_to_use`, and a second reopen. The edited body and final state persisted. Browser logs were clean after the final flow.

Checks at 360, 390, 412, 768, and 1280 pixels found no horizontal overflow. The communication, source panel, Resolution Pack, manual-only wording, and ready state remained present, with no misleading sent/submitted/filed/executed status.

## Limitations

- Language generation uses deterministic mock mode.
- The OpenAI adapter remains a server-side placeholder.
- OCR and complete PDF extraction remain Stage 2 provider seams.
- Policy guidance remains synthetic and non-authoritative.
- No official consumer-platform or government integration exists.
- No message or grievance is sent automatically.
- The prototype does not provide legal advice.
- Local JSON persistence is not a production multi-user datastore.

## Stage 5 readiness

Stage 5 should implement the real server-side OpenAI adapter behind `AIProvider`. Start with structured multimodal evidence extraction and `generateCommunicationDraft`, retain the existing Zod and provenance validators, and keep provider output candidate-only. Evaluation should compare real provider results against the existing five fixtures and adversarial unsupported-claim tests before enabling the adapter outside development.
