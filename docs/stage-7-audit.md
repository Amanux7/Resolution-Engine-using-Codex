# Stage 7 audit — verification, reliability, and demo readiness

## Baseline

The Stage 1–6 non-paid verification suite remained green. The environment’s global `npm` shim is broken, so the equivalent checked-in executables were used for lint, typecheck, Vitest, and the Next.js production build.

The published Stage 6 reference is `8ff663211e64ea7ff90b33207e3ff7bd35e17081` on `codex/stage-6-citizen-journey`. The workspace’s local `.git` metadata is disconnected/empty, so it cannot independently report that history; GitHub was used as the source of truth for the published reference.

## Live OpenAI verification

The server-side `OpenAIProvider` uses the Responses API with a strict JSON schema and a configured `gpt-4.1-mini` default. The first live attempt exposed a strict-schema optional-field incompatibility, which was corrected by making model-facing optional fields explicitly nullable. Follow-up calls reached the provider but received a rate-limit response. The UI-facing message remained: “We couldn't read this image right now. Please try again later.”

Live extraction is therefore **not marked successful** in this environment. The key was never printed, committed, or sent to the browser. See [the evaluation report](evaluation-report.md) for exact results.

## Reliability and adversarial guardrails

- Evidence processing now shares an in-flight operation per evidence ID, preventing rapid taps or retries from triggering duplicate provider calls.
- The strict Responses API schema now encodes optional fields as nullable and normalizes only those explicit placeholders before the existing Zod validator runs.
- Retrying processed evidence replaces facts for that evidence source rather than appending duplicates.
- Instruction-like evidence text such as “ignore previous instructions” is treated as untrusted evidence data and cannot trigger state changes.
- Candidate claims containing unsupported fraud, theft, or legal conclusions are rejected before fact persistence.
- Existing recommendation and communication validators still block unsupported legal/fraud claims.
- Provider authentication, timeout, rate-limit, invalid response, and schema-validation classifications are kept as safe internal metadata only; raw provider payloads are not logged.

## Deployment readiness

The Next.js production build succeeds. Secrets are environment-only, and no runtime code depends on OneDrive paths. `AI_MODE=mock` is the safe default; `AI_MODE=openai` is server-only.

The current JSON repository and local filesystem storage are suitable for local development and a single-process demo, but **not a durable serverless deployment**: deployed filesystem state may be ephemeral and instance-local. A hosted Postgres/Supabase repository and object storage adapter are required before claiming durable multi-user deployment. The existing repository/storage interfaces are the intended seam; no risky migration was made in Stage 7.

## Demo readiness

The one-click sample case is the canonical, deterministic demo route. It is fictional, separate from the user-created case flow, and independent of live model availability. The optional live moment is a single synthetic order screenshot → extracted details → source review. If unavailable, the demo falls back transparently to the sample case.

See [the executable demo script](demo-script.md).

## Remaining limitations

- Live provider verification is currently blocked by rate limiting; re-run the opt-in test when capacity is available.
- No hosted database or object storage is configured.
- PDF extraction and non-English semantic interpretation remain provider seams.
- Synthetic policy content is not legal advice or official guidance.
- The prototype sends, submits, and files nothing.

## Stage 8 readiness

Stage 8 should focus on deployment configuration, a successful opt-in live extraction verification after capacity is restored, final adversarial rehearsal, a two-minute submission video, submission copy, and final QA. It should not alter deterministic trust boundaries or add product scope.
