# Resolution Engine

> Give us the mess. We’ll turn it into a case.

Resolution Engine is an independent hackathon prototype that turns scattered consumer evidence into a clear, actionable, evidence-grounded case.

## What it solves

When a purchase or service goes wrong, consumers may have an invoice, delivery screenshots, photos, support chats, and dates—but no organized way to explain what happened or decide what to do next.

## What it does

```text
Evidence → Facts → Provenance → Timeline
         → Missing details and conflicts
         → Resolution recommendation → Action package
```

The product starts with **“What went wrong?”** A person can describe the problem in simple English, Hindi, or Hinglish, then add the screenshots and documents they already have. Resolution Engine organizes the case, makes uncertainty visible, recommends a low-risk next step, and prepares a factual message and Resolution Pack for user review.

It never sends a message, files a complaint, or makes a legal decision.

## Why this is different

This is not a generic complaint-writing chatbot. It reconstructs the case first:

- Facts remain linked to a user statement or evidence source.
- Conflicting dates or amounts are surfaced instead of silently chosen.
- Missing information remains missing—no invented refund or delivery status.
- Deterministic validation and ranking sit around model output.
- The user reviews every recommendation and prepared message.

## Trust architecture

```text
Uploaded evidence
  ↓
Candidate facts
  ↓
Schema + fact + provenance validation
  ↓
Conflict and missing-information checks
  ↓
Evidence-backed timeline
  ↓
Deterministic recommendation ranking
  ↓
Human review → prepared action package
```

See the concise [final architecture](docs/final-architecture.md).

## OpenAI

OpenAI is an optional, server-side multimodal extraction provider for a single uploaded image. It receives only the evidence item and a strict extraction instruction; it returns candidate facts, not database writes. Candidates must pass the existing structured schema, validation, provenance, and conflict checks before they become case state.

`AI_MODE=mock` is the safe local default. `AI_MODE=openai` enables the Responses API integration when a server-side `OPENAI_API_KEY` and model are configured. Live-provider verification is opt-in and its current status is documented honestly in the [evaluation report](docs/evaluation-report.md).

## Codex contribution

Codex was used as a coding collaborator throughout the project: it helped build the case domain and repository boundaries, evidence pipeline, provenance and guardrails, deterministic Resolution and Communication Agents, accessible India-first UX, test coverage, OpenAI adapter, adversarial checks, and release documentation. Product decisions, scope boundaries, and final review remained human-directed.

## Run locally

Prerequisites: Node.js 20+ and npm or pnpm.

```bash
git clone https://github.com/Amanux7/Resolution-Engine-using-Codex.git
cd Resolution-Engine-using-Codex
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local`.

Open [http://localhost:3000](http://localhost:3000). No key, database, or cloud storage is required in mock mode.

Run checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The OpenAI integration test is deliberately opt-in and uses only synthetic images:

```powershell
$env:AI_MODE = "openai"
$env:RUN_OPENAI_INTEGRATION_TESTS = "true"
npm test -- tests/openai-image.integration.test.ts
```

## Demo

Choose **Try a sample case** on the home screen for the reliable reviewer journey. It loads a clearly labelled fictional damaged-phone case with evidence, a timeline, uncertainty, recommendation, prepared communication, and a Resolution Pack—without depending on a live model call.

The [demo script](docs/demo-script.md) and [recording checklist](docs/recording-checklist.md) prepare a two-minute walkthrough.

## Hosted deployment

The provider-neutral persistence and storage seams support both local development and Vercel + Supabase hosting. Hosted mode uses Supabase PostgREST for the existing case repositories and a private Supabase Storage bucket with short-lived server-generated evidence URLs. Follow the exact [deployment guide](docs/deployment.md); it includes the migration, required server-only variables, and verification path.

## Limitations and disclosure

- Independent hackathon prototype using synthetic data; it is not an official government product.
- Synthetic policy guidance is not legal advice or authoritative regulation.
- No grievance, seller, marketplace, email, payment, or government integration exists.
- No external action is automatic or executed by the prototype.
- Full multilingual semantic understanding, durable cloud persistence, and cloud object storage require future configuration.

## Submission material

- [Project summary](docs/submission-summary.md)
- [Submission checklist](docs/submission-checklist.md)
- [Evaluation report](docs/evaluation-report.md)
- [Final architecture](docs/final-architecture.md)
