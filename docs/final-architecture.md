# Resolution Engine architecture

```text
Citizen
  ↓
Case intake
  ↓
Evidence processing
  ↓
OpenAI multimodal extraction (optional, server-side)
  ↓
Candidate facts
  ↓
Validation + provenance
  ↓
Conflict and missing-information checks
  ↓
Evidence-backed timeline
  ↓
Resolution Engine
  ├─ synthetic policy tool
  ├─ candidate actions
  └─ deterministic ranking
  ↓
Human review
  ↓
Communication preparation
  ↓
Resolution Pack
```

React components call server APIs only. Server APIs use repository and storage abstractions, so no UI component is coupled to a database, object store, or model provider.

## Trust boundary

OpenAI can produce **candidate** facts from one image. Candidates are runtime-schema checked, fact validated, source-linked, conflict checked, and only then persisted. The provider never writes case state directly. Recommendation and communication claims undergo separate provenance and unsupported-claim validation.

## Hosting seam

Local development uses JSON persistence and local file storage. A public durable deployment should replace those adapters with the existing repository and storage seams backed by hosted Postgres/Supabase and private object storage. Server APIs remain the boundary for both modes.
