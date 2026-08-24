# Stage 6 audit — India-first citizen journey

## UX strategy

The product remains problem-first: the first screen asks what went wrong, accepts natural language, and reassures people that nothing is sent without their approval. Internal terms such as model, agent, confidence score, and orchestration are not part of the normal journey.

## India-first decisions

- Mobile-first tap targets and a vertical evidence/timeline flow remain the default.
- Essential onboarding copy can switch between English and simple Hindi (`हिन्दी`).
- Hindi, Hinglish, Devanagari, Indian dates, and `₹` render using a system font stack with Devanagari fallbacks.
- Intake preserves text exactly. Deterministic mock intake recognises the supplied Hinglish damaged-product/refund phrases; full multilingual semantic extraction is not claimed in mock mode.
- Image/screenshot upload is the primary evidence action, with standard mobile `capture="environment"` support where browsers provide it.

## Trust and accessibility

Evidence states now use plain language such as “Reading your file”, “Ready to review”, and “Not confirmed”. Fact cards use “Supported by evidence” or “May need checking”, not raw scores. Existing semantic headings, native buttons, labelled fields, visible focus rings, keyboard-accessible details controls, source inspection focus management, and reduced-motion support were preserved.

## Low-bandwidth

No decorative imagery, remote fonts, video, or added client data dependencies were introduced. The evidence UI retains original files without rendering full-resolution previews. Existing retry paths keep a case usable when evidence processing is temporarily unavailable.

## Judge demo path

1. On the home screen, select **Try a sample case**.
2. Review the clearly labelled fictional damaged-phone case.
3. Generate and approve the recommended next step.
4. Select **Prepare it**, inspect sources, and mark the organized package ready to use.

The sample case is created separately with a `Sample case —` title; it does not overwrite a user-created case.

## Verification

The home and evidence journey was checked at 360, 390, 412, 768, and 1280px with no horizontal overflow. The normal UI remains free of technical provider terminology. The browser console was clean during the prior Stage 5 baseline and is rechecked for this stage.

## Limitations

- Hindi translation covers essential onboarding chrome, not every string.
- Mock mode has intentionally limited multilingual interpretation.
- No external submission, official integration, legal decision, or automatic message occurs.
- Policy records, sample cases, and local persistence remain prototype-only.

## Stage 7 readiness

Stage 7 can focus on opt-in live OpenAI verification, extraction/adversarial evaluation, deployment readiness, and a rehearsed hackathon demo without changing the citizen journey architecture.
