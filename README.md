# Resolution Engine

> Turn a messy real-world problem into an organized, evidence-grounded case.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-41%20passing-2E7D32)](#quality-and-testing)
[![Stage](https://img.shields.io/badge/project-Stage%204-8B5CF6)](#implementation-status)

Resolution Engine is an independent case-resolution prototype for ordinary consumers. A user describes what went wrong and adds the evidence they already have—screenshots, documents, photographs, PDFs, or text. The product organizes that material into facts, provenance, missing information, conflicts, an evidence-backed timeline, and a reviewable next-action recommendation.

It is deliberately **not a generic chatbot**. The case is the central product object, and every important claim is designed to remain traceable to its source.

## Why this project exists

Consumer problems often arrive as an unstructured bundle of messages, receipts, dates, screenshots, and partial memories. People should not need to understand complaint categories, government departments, legal terminology, APIs, or AI systems before they can organize what happened.

Resolution Engine turns that mess into a usable case record:

```text
Problem → Evidence → Facts → Provenance → Timeline
        → Conflicts and missing details → Recommended next step → User review
```

The current hackathon scenario is a fictional damaged-phone case in which a return pickup occurred but refund completion cannot be verified.

## Product principles

- **Problem first, technology second** — internal AI and agent terminology stays out of the citizen-facing experience.
- **Evidence before assertion** — important facts retain source IDs, source text, confidence, and extraction method.
- **Uncertainty is visible** — missing, unknown, unverified, inferred, and conflicting information are not silently converted into facts.
- **Action over information** — the product explains the most useful next step, not just a summary.
- **Human approval remains mandatory** — recommendation review never triggers an external action.
- **Plain language by default** — the interface explains what is known without bureaucratic or legalistic wording.

## Current user experience

A user can:

1. Describe a consumer problem in plain language.
2. Create and persist a case.
3. Upload supported evidence.
4. Process plain-text evidence deterministically.
5. Inspect extracted facts and their source text.
6. See missing information and conflicting facts.
7. Review an evidence-backed timeline.
8. Reopen a previously created case.
9. Generate a deterministic, provenance-aware recommendation.
10. Approve, reject, or request changes to that recommendation without executing it.

## Implementation status

| Stage | Focus | Status |
| --- | --- | --- |
| Stage 1 | Product shell, design system, case model, responsive and accessible core flow | Complete |
| Stage 2 | Persistence, evidence processing, provenance, fact validation, conflicts, missing information, timeline | Complete |
| Stage 3 | Read-only Resolution Agent, synthetic policy guidance, deterministic ranking, recommendation validation and review | Complete |
| Stage 4 | Evidence-grounded communication preparation and Resolution Pack review | Complete |
| Stage 5 | Real multimodal provider integration behind existing guardrails | Not started |

Detailed verification notes are available in the [Stage 1 audit](docs/stage-1-audit.md), [Stage 2 audit](docs/stage-2-audit.md), [Stage 3 audit](docs/stage-3-audit.md), and [Stage 4 audit](docs/stage-4-audit.md).

## Technology stack

- Next.js 15 with the App Router
- React 19
- Strict TypeScript
- Tailwind CSS
- Zod validation
- Vitest
- Local JSON repository and filesystem storage for zero-configuration development
- Provider-neutral seams for PostgreSQL/Supabase, object storage, OCR/PDF extraction, and model providers

## Quick start

### Prerequisites

- Node.js 20 or newer
- npm or pnpm

### Installation

```bash
git clone https://github.com/Amanux7/Resolution-Engine-using-Codex.git
cd Resolution-Engine-using-Codex
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No database, storage service, or model API key is required. `AI_MODE=mock` provides deterministic local processing and recommendations.

## Environment configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_MODE` | `mock` | Selects deterministic local processing and recommendation behavior. |
| `OPENAI_API_KEY` | unset | Optional server-only API key for live image evidence extraction. |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Optional multimodal extraction model override. |
| `NEXT_DIST_DIR` | `.next` | Optional alternate Next.js build directory, useful in synchronized folders such as OneDrive. |

Secrets must remain server-side. Environment files are ignored by Git except for `.env.example`.

## Architecture

The application is organized around a central `Case` aggregate:

```text
Case
├── Situation
├── Organizations and people
├── Evidence
├── Facts and provenance
├── Missing information
├── Conflicts
├── Timeline
├── Recommendations
├── Tasks
├── Communications
└── Status
```

### Evidence pipeline

```text
Description
    ↓
Case repository
    ↓
Validated upload → Storage provider → Evidence repository
                                      ↓
                               Evidence processor
                                      ↓
                              Extracted candidates
                                      ↓
                         Deterministic fact validation
                                      ↓
                    Provenance-aware facts and conflicts
                                      ↓
                         Evidence-backed timeline
```

Processors and future model providers return candidates only. They cannot mutate case state directly. The application validates supported fact types, confidence ranges, date and amount formats, source existence, and case ownership before persistence.

### Resolution pipeline

```text
Persisted case aggregate
    ↓
Deliberately constructed ResolutionContext
    ↓
Completeness check
    ↓
Synthetic policy search
    ↓
Candidate action generation
    ↓
Deterministic ranking
    ↓
Structured recommendation
    ↓
Safety and provenance validation
    ↓
Append-only persistence
    ↓
User review state
```

The `ResolutionAgent` receives only the supplied context. It cannot independently query arbitrary application state or change an external system.

### Deterministic action ranking

Candidate actions use a documented, repeatable score:

```text
score = evidenceSupport × 4
      + urgency × 3
      + lowUserEffort × 2
      + reversibility × 2
      - uncertainty × 3
      - risk × 3
```

A stable candidate ID breaks ties. The same case context therefore produces the same recommendation in mock mode.

## Provenance and trust model

Extracted facts retain:

```text
sourceType
sourceId
sourceText
confidence
extractionMethod
createdBy
```

Recommendation reasons must reference a valid fact, evidence item, timeline event, supplied synthetic policy record, or deterministic system check. Validation rejects nonexistent sources, malformed output, missing provenance, and unsupported legal, fraud, theft, or statutory conclusions.

The interface distinguishes confirmed, user-provided, inferred, missing, unknown, and unverified information rather than mixing them into one set of claims.

## Evidence support

| Type | Extensions | Maximum size | Current behavior |
| --- | --- | ---: | --- |
| Image | PNG, JPG/JPEG, WEBP | 10 MB | Validated and stored; remains explicit about needing OCR/provider processing. |
| PDF | PDF | 15 MB | Validated and stored; extraction failure is surfaced without deleting the original. |
| Plain text | TXT | 2 MB | Normalized and processed deterministically; used by the critical pipeline tests. |

Uploads are validated server-side for MIME type, extension, size, empty content, and malformed requests. Uploaded content is never rendered as arbitrary HTML or written to application logs.

## Persistence and provider boundaries

Local development uses:

- `data/local/state.json` for case aggregates
- `data/local/uploads/` for uploaded evidence

Both locations are ignored by Git. Repository and storage interfaces isolate provider-specific behavior, allowing later PostgreSQL/Supabase and S3-compatible adapters without coupling UI components to a vendor.

Recommendations are append-only. Existing recommendation content is never overwritten; only controlled review-state transitions can mutate a recommendation status.

## API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/cases` | Create a validated case. |
| `GET` | `/api/cases` | List cases for the server-controlled demo user. |
| `GET` | `/api/cases/:id` | Retrieve a persisted case aggregate. |
| `PATCH` | `/api/cases/:id` | Update allowed case fields. |
| `POST` | `/api/cases/:id/evidence` | Validate, store, and register evidence. |
| `GET` | `/api/cases/:id/evidence` | List evidence associated with a case. |
| `POST` | `/api/evidence/:id/process` | Process or retry an evidence item. |
| `GET` | `/api/cases/:id/facts` | Retrieve provenance-aware facts. |
| `GET` | `/api/cases/:id/timeline` | Retrieve the evidence-backed timeline. |
| `POST` | `/api/cases/:id/recommendation` | Generate, validate, and persist a recommendation. |
| `GET` | `/api/cases/:id/recommendation` | Retrieve the latest recommendation. |
| `PATCH` | `/api/cases/:id/recommendation` | Update review state only. |

Ownership is determined on the server by the current synthetic demo user. Client-provided ownership identifiers are not trusted.

## Project structure

```text
app/                    Next.js pages and REST-like route handlers
components/             Case, evidence, recommendation, and UI components
data/demo/              Fictional damaged-phone demo data
data/evaluations/       Resolution Agent evaluation fixtures
docs/                   Stage verification and architecture audits
lib/agents/             Read-only agent implementations
lib/ai/                 Provider-neutral model interface
lib/db/                 Repository contracts and adapters
lib/evidence/           Validation, extraction, and processing pipeline
lib/facts/              Fact validation, conflicts, and missing information
lib/policy/             Synthetic demo policy guidance
lib/resolution/         Context, completeness, ranking, and guardrails
lib/storage/            Provider-neutral storage adapters
lib/timeline/           Deterministic timeline builder
lib/tools/              Deterministic tool contracts
tests/                  Unit and integration tests
types/                  Domain, agent, recommendation, and tool types
```

## Quality and testing

Run the complete quality gate:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The current suite contains 41 passing tests across Stages 1–4. Coverage includes case validation, repositories, uploads, evidence processing, provenance, conflicts, timelines, recommendation ranking and guardrails, communication claims, user-edit handling, Resolution Pack history, controlled review states, APIs, and five fictional evaluation scenarios.

The interface has also been checked at 360, 390, 412, 768, and 1280 pixels with no horizontal overflow in the primary recommendation flow.

## Synthetic evaluation scenarios

1. Damaged product with refund pending
2. Missing delivery
3. Wrong product delivered
4. Refund promised but delayed
5. Conflicting evidence dates

Each fixture defines the expected action, uncertainty, confidence range, required source types, and claims that must never be recommended.

## Accessibility

The foundation includes semantic headings, native form controls, accessible labels, keyboard-operable actions, visible focus states, screen-reader status messaging, non-color-only state indicators, reduced-motion support, and mobile-first layouts.

## Security, privacy, and safety boundaries

This repository is a hackathon prototype—not a production consumer service.

The current application does **not**:

- Submit complaints or contact a consumer helpline
- Send messages to sellers or other recipients
- Trigger refunds, payments, or financial operations
- Make legal decisions or provide authoritative legal advice
- Integrate with government systems
- Execute escalations
- Provide production authentication or multi-tenant authorization
- Connect to a real OpenAI model in the current implementation

Demo policy records use `sourceType: "synthetic_demo_policy"` and must never be presented as law or official guidance. Important external actions remain outside the system and would require explicit user approval in a future stage.

## Known limitations

- Local JSON persistence is intended for development, not concurrent multi-user production workloads.
- `AI_MODE=openai` enables server-side OpenAI Responses API processing for PNG, JPG/JPEG, and WEBP evidence. Output stays candidate-only until schema, fact, provenance, and conflict validation succeed.
- `AI_MODE=mock` remains the default and never makes a network call. It keeps deterministic TXT extraction; image evidence is transparently marked as needing a configured processor.
- Full PDF extraction remains a provider seam and fails transparently when unavailable.
- The synthetic policy dataset is deliberately narrow and non-authoritative.
- Authentication, production personal-data handling, rate limiting, malware scanning, and cloud deployment configuration remain future work.

## Roadmap

The recommended next stage is India-first language, low-bandwidth, accessibility, and final citizen-journey polish. The provider, provenance, validation, conflict, safety, and human-approval boundaries are already in place.

Later work may include authoritative policy-source adapters, production persistence and storage, OCR/PDF providers, authentication, follow-up tasks, and carefully controlled external integrations.

## Contributing

Before opening a change:

1. Keep domain logic outside React components.
2. Preserve provider-neutral repository, storage, tool, and model boundaries.
3. Add provenance for new extracted or generated case claims.
4. Add deterministic validation around model output.
5. Keep external side effects behind explicit user approval.
6. Run lint, typecheck, tests, and the production build.

## Disclaimer

Resolution Engine is an independent fictional prototype. It is not affiliated with a government body, consumer helpline, marketplace, seller, or legal service. Demo names, orders, policy records, and case data are synthetic. Nothing in the application should be interpreted as legal or financial advice.

## License

No open-source license has been declared yet. All rights remain with the repository owner until a license is added.
