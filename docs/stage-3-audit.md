# Stage 3 audit

## Architecture

The read-only decision pipeline is:

```text
Persisted case aggregate
  → deliberately constructed ResolutionContext
  → deterministic completeness check
  → synthetic policy search
  → multiple action candidates
  → deterministic ranking
  → provider-structured recommendation
  → runtime validation
  → append-only persistence
  → user review state
```

`ResolutionAgent` receives a `ResolutionContext`; it cannot query arbitrary database state. The context contains the case, facts, evidence, timeline, conflicts, missing information, and the policy references returned for this run. The agent records bounded tool summaries and lifecycle events without logging prompts or uploaded contents.

The only mutations are creation of a recommendation, transition of the case to `action_ready` after a reviewable recommendation, and controlled recommendation status changes. No external action exists in Stage 3.

## Policy boundary

Every current policy record has `sourceType: "synthetic_demo_policy"`. These records are fictional product guidance for evaluating the decision flow. They are not legal advice, regulations, statutory requirements, or official consumer-platform guidance. The provider and validator require policy reasons to reference records that were actually supplied in the current resolution context.

## Deterministic ranking

Candidate values use a 0–5 scale. A higher `userEffort` value means lower effort for the user.

```text
total = evidenceSupport × 4
      + urgency × 3
      + lowUserEffort × 2
      + reversibility × 2
      - uncertainty × 3
      - risk × 3
```

The stable tie-breaker is the candidate ID. Mock mode always selects the first ranked candidate, so the same context produces the same action. Refund scenarios generate candidates for written confirmation, collecting evidence, possible waiting when a supported future date exists, and preparing a later escalation review. The lower-risk written clarification normally ranks first.

## Guardrails

- Completeness checks block specific recommendations when the description, facts, expected evidence, or active case state is insufficient.
- Unresolved conflicts are never silently resolved and force low recommendation confidence.
- Missing or unverified refund information is described as unconfirmed, never as proof that the seller failed to initiate a refund.
- Runtime schema validation rejects malformed structures, invalid confidence/status values, missing reason provenance, unknown evidence/fact/timeline/policy IDs, and policy records not present in the current context.
- Deterministic phrase checks reject unsupported legal, fraud, theft, and statutory conclusions.
- `requiresUserApproval` must be true.

## Provenance

Each recommendation reason identifies a fact, timeline event, evidence item, supplied demo policy record, or deterministic system check. Evidence references must resolve to evidence in the same case. The UI shows the source text and lets the user return to the Evidence workspace to inspect the evidence record.

## Evaluation fixtures

| Fixture | Expected result | Confidence | Required grounding |
| --- | --- | --- | --- |
| Damaged product + refund pending | Ask for written refund status confirmation | High or medium | Fact, missing-information check, demo policy |
| Missing delivery | Verify delivery/tracking status before stronger escalation | High or medium | Fact and demo policy |
| Wrong product delivered | Preserve evidence and request the seller's return/replacement process | High or medium | Fact and demo policy |
| Refund promised but delayed | Reference the supported conversation and request written status | High or medium | Fact, missing-information check, demo policy |
| Conflicting evidence dates | Confirm the conflicting date before relying on either | Low | Conflict check |

All five fixtures pass their expected action, uncertainty, confidence range, required source types, and prohibited-claim assertions in mock mode.

## Verification

- Unit/integration suite covers recommendation generation, incomplete cases, conflict handling, legal/fraud blocking, malformed output, missing provenance, deterministic ranking, persistence/history, controlled review state, and POST/GET/PATCH API behavior.
- Stage 1 and Stage 2 regression tests remain in the same test command.
- The rendered flow was exercised through case creation, validated text-evidence processing, recommendation generation, evidence-source inspection, return to review, and approval-state persistence. The approval control only records review state and explicitly confirms that no external action occurred.
- Responsive checks at 360, 390, 412, 768, and 1280 pixels found no horizontal overflow. Recommendation, uncertainty, evidence, and review controls remained present at every size, with no citizen-facing AI/agent terminology detected in the main content.
- The in-app browser's native file chooser could not attach a local file in this environment. The same server-side upload route was therefore exercised with a fictional text fixture; file validation, storage, processing, fact extraction, persistence, and reopening all ran through the production route.
- See the final task report for the exact lint, typecheck, test, and build results.

## Limitations

- There is no external action, complaint submission, seller contact, payment/refund operation, or government integration.
- The product does not provide legal advice or authoritative policy interpretation.
- `AI_MODE=openai` is a clean placeholder; no real OpenAI request is made and no API key is required.
- The mock provider is deterministic and intentionally narrow. It does not replace evaluation against a production model/provider.
- The local JSON repository is a development fallback, not a concurrent multi-user production database.
- PDF parsing and OCR remain provider seams from Stage 2.

## Stage 4 readiness

Stage 4 should start with a read-only `CommunicationAgent` that consumes only an approved `ResolutionRecommendation`, its cited evidence, and an explicit user instruction. It should prepare—not send—a factual draft, validate every case claim against provenance, expose recipient/channel/body for review, and require a separate approval before any future delivery integration. Follow-up tasks can then be derived from approved drafts and deadlines without executing external actions.
