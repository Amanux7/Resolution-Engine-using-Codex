# Stage 8 audit — final submission readiness

## Release baseline

Stage 7 was committed as `test: harden resolution engine for submission` on `codex/stage-6-citizen-journey`. Secrets, `.env.local`, local JSON state, uploaded files, build output, and temporary staging artifacts are ignored. The system `npm` shim remains broken in this environment, so the equivalent checked-in executables are used for validation.

## Deployment architecture decision

The application has a local JSON repository and local filesystem storage only. The Supabase repository is deliberately a seam, not an implementation, and no Supabase/Postgres URL, Supabase key, object-storage configuration, or hosting project was supplied. A serverless deployment using the current local adapters would not be durable or reliable.

**Decision:** do not deploy blindly. The project is deployment-ready in architecture but not publicly deployed. Before publishing, implement/configure the existing repository and storage abstractions with hosted Postgres/Supabase and private object storage, then set server-only deployment variables. This is the sole blocker for a public URL.

## Reviewer paths

- **Reliable sample path:** `Try a sample case` creates a clearly labelled fictional damaged-phone case and does not depend on OpenAI.
- **Prototype case path:** a user can enter a problem and upload supported evidence. `AI_MODE=mock` is the local default; `AI_MODE=openai` is optional and server-only.

The UI now includes the disclosure: “Independent hackathon prototype using synthetic data.” Nothing claims government endorsement or automatic complaint submission.

## OpenAI status

The app uses the server-side Responses API with a strict JSON schema and the configured `gpt-4.1-mini` default. Stage 7 exposed and corrected strict nullable-field handling. Controlled synthetic image requests subsequently reached the provider but received rate-limit responses. No live extraction success is claimed, no key was logged, and no repeated paid retries were performed. The user-facing fallback remains calm and recoverable.

## QA

- Non-paid lint, typecheck, test, and production-build checks pass.
- The test suite uses serial file execution and ignores local staging artifacts so the shared local JSON fallback is not corrupted by duplicate test discovery.
- Stage 6 previously validated the citizen journey at 360, 390, 412, 768, and 1280 pixels. Stage 8 did not introduce layout changes beyond a short footer disclosure.
- Keyboard controls, semantic controls, focus styles, and text rendering remain part of the existing accessibility test and UI foundation.

## Submission assets

- [Final architecture](final-architecture.md)
- [Project summary](submission-summary.md)
- [Two-minute demo script](demo-script.md)
- [Recording checklist](recording-checklist.md)
- [Submission checklist](submission-checklist.md)
- [Public demo checklist](public-demo-checklist.md)
- [Evaluation report](evaluation-report.md)

## Genuine blockers

1. No hosted database/object storage or deployment project is configured, so a public HTTPS URL cannot be responsibly created.
2. The configured OpenAI project is rate-limited; rerun one synthetic opt-in image test only after capacity is restored.

## Stage 8 close

Feature development is frozen. The next action is operational: configure hosted persistence/storage and a deployment target, verify the public sample journey in an incognito browser, then record the two-minute submission video.
