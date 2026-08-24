# Resolution Engine

Resolution Engine is an independent prototype that turns a messy consumer problem into an organized, evidence-linked case. It does not submit complaints, contact sellers, make legal decisions, or handle production personal data.

## Run locally

```bash
npm install
npm run dev
```

Checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

No external database, storage, or model credentials are required for local development. The local repository persists case state in `data/local/state.json`, and the local storage adapter persists uploaded evidence in `data/local/uploads/`. Both paths are ignored by git. `AI_MODE=mock` is the default deterministic recommendation mode. `AI_MODE=openai` is a documented server-side seam and intentionally reports unavailable until a real adapter is connected.

## Architecture

- `app/` contains the Next.js shell and REST-like server boundaries. Case ownership is server-controlled by the current demo user (`user-demo`); client requests cannot choose an owner.
- `types/` contains the central case model plus provenance, agent, and tool contracts.
- `lib/db/` contains provider-neutral repository interfaces and the local JSON implementation. `lib/db/supabase-repository.ts` is the seam for a future Supabase/Postgres adapter.
- `lib/storage/` contains the provider-neutral storage interface and local filesystem implementation. UI and evidence processing depend on the interface, not on a storage vendor.
- `lib/evidence/` validates uploads and runs the evidence-processing pipeline. Text is parsed deterministically; PDF and image files are retained with an explicit `needs_processing` state until a parser/OCR provider is connected.
- `lib/facts/` validates extracted candidates, preserves provenance, detects conflicts, and represents missing information.
- `lib/timeline/` builds a source-linked chronological view from dated facts only.
- `lib/agents/resolution-agent.ts` runs the read-only recommendation pipeline against a deliberately constructed case context.
- `lib/policy/` contains synthetic demo guidance, never authoritative legal rules.
- `lib/resolution/` contains completeness checks, action candidates, deterministic ranking, and recommendation validation.
- `data/demo/` contains fictional synthetic demo material.
- `components/` contains the mobile-first flow: start, intake, evidence workspace, and case review.

## Persistence and evidence flow

The Stage 2 flow is:

```text
description → case repository → storage provider → evidence repository
           → content extractor → validated facts + provenance
           → conflicts / missing information / timeline → persisted case aggregate
```

The application never lets an extractor or future model write directly to the database. Candidate facts must pass deterministic validation, including supported type, confidence, date/amount shape, and source identifiers, before persistence.

Supported uploads are PNG, JPG/JPEG, WEBP, PDF, and TXT. Size limits are 10 MB for images, 15 MB for PDFs, and 2 MB for text. Uploads are validated server-side before they are stored.

## API surface

```text
POST   /api/cases
GET    /api/cases
GET    /api/cases/:id
PATCH  /api/cases/:id
POST   /api/cases/:id/evidence
GET    /api/cases/:id/evidence
POST   /api/evidence/:id/process
GET    /api/cases/:id/facts
GET    /api/cases/:id/timeline
POST   /api/cases/:id/recommendation
GET    /api/cases/:id/recommendation
PATCH  /api/cases/:id/recommendation
```

## Stage boundaries

The current stage stops at a reviewable recommendation. Approval or rejection changes only internal recommendation status. It never sends a message, submits a complaint, contacts a seller, or changes an external system. Communication preparation, escalation execution, authentication, and production data handling remain future work.

See [`docs/stage-1-audit.md`](docs/stage-1-audit.md), [`docs/stage-2-audit.md`](docs/stage-2-audit.md), and [`docs/stage-3-audit.md`](docs/stage-3-audit.md) for verification notes and known limitations.

