# Stage 9 audit — cross-domain civic experience

## Product

Resolution Engine now provides seven fictional sample cases through one validated `/api/demo-case` route: Documents, Benefits, Bills, Transport, Education, Payments, and the existing Consumer refund case. The client can pass only a known sample identifier; fixtures are never selected by a file path.

Each sample is persisted using the same repository, provenance, conflict, missing-information, timeline, recommendation, approval, communication, and Resolution Pack pipeline as a user-created case. The product makes no claim that an authority will approve, correct, or resolve an issue.

## Signature experience

The homepage introduces “Different problems. One Resolution Engine.” with an editorial sample library. The visual system uses a restrained navy, white, and warm off-white palette plus Playfair Display for English H1 headings; Poppins and the existing Devanagari-safe fallback stack handle the rest of the citizen interface.

The public product explanation now lives at `/`, while the working intake and case workspace lives at `/app`. Validated sample links use `/app?sample=<known-id>`, and `/cases/[caseId]` reopens persisted cases through the same shared workspace component. The landing page remains server-rendered and adds no new business logic.

Typography is deliberately narrow: H1 headings use italic Playfair Display; the remaining interface uses Poppins with Devanagari-safe fallbacks. The landing page presents the problem categories, shared reconstruction process, provenance model, India-first inputs, fictional samples, trust boundary, and Resolution Pack without exposing internal agent terminology.

The case workspace now foregrounds a deterministic intelligence strip, source-linked vertical timeline, calm conflict presentation, missing-information section, and a lightweight evidence map. These are CSS layouts, not a graph library, so they remain suitable for mobile and low bandwidth.

## Verification

The Stage 9 fixture test verifies all sample cases create through the common endpoint, persist evidence/fact provenance, retain timelines and missing information, and show expected conflicts for document correction and electricity billing. Existing consumer tests remain in the suite.

## Boundaries

Supabase provider selection, storage, server-only OpenAI extraction, environment names, and approval gates are unchanged. All sample data is fictional. The product remains preparation-only: it does not contact departments, submit forms, or make legal conclusions.

## Verification

The local browser pass covered the landing page, `/app`, direct sample routing, `/cases/[caseId]`, one cross-domain sample (electricity billing), conflict display, evidence map, and recommendation explanation. The 360/390/412/768/1024/1280/1440 px matrix showed no horizontal overflow. Computed styles confirmed italic Playfair Display on H1 and Poppins on H2/body interface text.

## Remaining work

Deployment QA should be performed from the deployed feature branch before any production merge. Real sample outcomes remain deterministic fixtures; they are demonstrations of the common architecture, not authoritative service workflows.

