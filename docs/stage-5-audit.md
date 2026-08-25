# Stage 5 audit — OpenAI multimodal evidence intelligence

## Architecture

The live image path is deliberately narrow: one stored image is read server-side, passed to `OpenAIProvider`, parsed through a strict runtime schema, validated as fact candidates, and then written through the existing evidence repository. The provider has no repository access and cannot change case state directly.

`AI_MODE=mock` remains the default. `AI_MODE=openai` activates only PNG, JPG/JPEG, and WEBP extraction. TXT processing remains deterministic; the existing PDF fallback is unchanged.

## Responses API and model choice

The provider uses the official JavaScript SDK and the Responses API with an `input_image` data URL and strict JSON-schema output. The default is `gpt-4.1-mini`, a configurable multimodal model intended for focused extraction with practical latency and cost. Set `OPENAI_MODEL` to change it without editing application code.

## Structured extraction and provenance

The schema covers evidence type, concise summary, fact candidates, dates, amounts, uncertainty, and warnings. Closed Zod schemas reject unknown or malformed data. Accepted facts retain the uploaded evidence ID, a short visible source excerpt when available, `extractionMethod: llm`, and `createdBy: agent`. Evidence records retain non-user-facing provider/model/version metadata.

## Guardrails

The model receives only one evidence item plus an extraction instruction. Image content is explicitly treated as untrusted data, including instruction-like text. It cannot decide the case, make legal/fraud conclusions, or recommend an action. Invalid schema output is not partially stored. Fact validation, provenance checks, idempotent `replaceForEvidence`, conflict detection, missing-information detection, and timeline building all run after extraction.

## Failure behavior and privacy

The provider has a 25-second timeout and one bounded retry for transient timeouts, rate limits, and server errors. Authentication, invalid input, and schema errors are not retried. A failed item remains stored and receives a human-readable retry message. Development telemetry contains only evidence ID, model, timing, status, and optional token counts—never image bytes, prompt text, or extracted document contents.

## Evaluation

Five in-memory fictional PNG fixtures exist: order confirmation, support conversation, conflicting record, adversarial instruction-like text, and no-useful-evidence image. Normal tests validate fixture safety, schema strictness, and prompt-injection expectations. A paid live test is skipped unless both `RUN_OPENAI_INTEGRATION_TESTS=true` and `OPENAI_API_KEY` are set.

## Limitations

- No live OpenAI call is required or made by normal tests.
- PDF extraction remains a transparent local fallback.
- No external action, legal advice, official integration, or automatic communication is introduced.
- The normal UI intentionally does not display model or prompt details.

## Stage 6 readiness

Stage 6 can build India-first language, low-bandwidth, and accessibility polish on stable seams: server-side evidence processing, deterministic case facts, provenance-aware recommendations, reviewed communications, and manual-only Resolution Packs.
