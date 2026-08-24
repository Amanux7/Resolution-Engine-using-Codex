# Stage 1 audit

## Verified

- The repository now runs as a Next.js TypeScript app with Tailwind styling.
- The primary flow supports a user description, synthetic evidence attachment, intake review, evidence workspace, case overview, timeline, and recommended next step.
- `/api/cases` has a validation boundary and returns human-readable errors for malformed/invalid intake.
- The central `Case` type includes situation, people, facts, evidence, timeline, tasks, recommendations, communications, and status.
- Provenance is present on extracted facts, timeline events, people, and intake fields.
- The agent and tool contracts are defined for Intake, Evidence, Timeline, Resolution, Communication, Escalation, and FollowUp.
- The AI provider is behind a server-side `AIProvider` interface.
- The layout uses semantic headings, labels, native buttons/inputs, visible focus, status/alert roles, non-color-only badges, reduced-motion CSS, and responsive mobile-first sizing.
- Automated tests cover intake validation and synthetic demo integrity.
- Manual rendered browser audit passed at 360px, 390px, 412px, 768px, and 1280px with no horizontal overflow and no captured browser errors or warnings.
- The primary flow was checked through intake, evidence workspace, and case overview using the required problem description. The overview showed problem, status, evidence, timeline, and recommendation.
- Empty submission returned a human-readable validation alert; malformed intake returned a human-readable API error; unknown case ID returned a clean 404 message.

## Fixed

- Restored the missing Stage 1 implementation into the current empty repository.
- Added a friendly error state for invalid/empty case descriptions.
- Added explicit no-evidence copy explaining what is missing, why it can help, and that the user can continue.
- Added explicit “Synthetic demo workspace” / “Demo processing” messaging so mocked extraction is not presented as real.
- Added unknown-case API behavior and malformed request handling without stack traces.
- Added a no-saved-cases GET response that explains the next action.
- Added workspace ignores for generated build/install output.

## Remaining

- Evidence extraction and processing status are mocked; uploaded browser files are represented in client state only.
- There is no persistence, authentication, real storage, or external communication.
- Empty timeline and recommendation rendering is represented in the overview component contract, but the demo dataset intentionally contains both so the main path is useful.
- A repeatable automated browser test and visual snapshot suite are not yet part of the repository; the audit below was manual in the in-app browser.
- The in-app browser's file chooser did not expose a controllable chooser during this audit, so the UI's file-validation code was inspected and the built-in synthetic evidence path was verified in the rendered flow.
- In this OneDrive-backed workspace, the first dev-server compilation was unusually slow; the successful production build and `next start` server were used for the rendered audit.

## Stage 2 prerequisites

The typed interfaces in `types/agent.ts` are ready for implementations of `IntakeAgent`, `EvidenceAgent`, `TimelineAgent`, `ResolutionAgent`, `CommunicationAgent`, `EscalationAgent`, and `FollowUpAgent`. Each result includes confidence, citations/provenance, tool-call records, and structured errors. `types/tool.ts` defines independently callable tool contracts, while `lib/ai/provider.ts` defines the provider seam.

## Risks

- The current demo case uses a stable synthetic ID and in-memory/client state; introducing persistence should preserve provenance and relational integrity.
- Uploaded evidence IDs currently use browser timestamps. A storage/repository layer should replace these with durable IDs.
- The future model/provider adapter must preserve user approval boundaries and should never turn unsupported inferences into facts without provenance.
