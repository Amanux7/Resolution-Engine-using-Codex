# Submission summary

**Resolution Engine turns scattered consumer evidence into a clear, grievance-ready case.**

When a purchase goes wrong, people often already have the proof they need—an invoice, screenshots, delivery updates, photos, and support messages—but it is fragmented and difficult to use. Resolution Engine starts with a simple question: “What went wrong?” It organizes the user’s description and evidence into source-linked facts, an evidence-backed timeline, visible conflicts and missing details, and a reviewable next step.

Rather than acting like a generic complaint-writing chatbot, the product reconstructs the case first. Deterministic validation checks provenance, detects contradictions, preserves uncertainty, ranks low-risk next actions, and requires user approval before preparing a factual message and Resolution Pack. Nothing is automatically sent or submitted.

OpenAI is used server-side as an optional multimodal extraction provider for screenshots and images. Its output is candidate-only: it must pass structured schema validation, fact validation, provenance checks, and conflict detection before it becomes case state.

The demo uses fictional evidence and synthetic policy guidance. The working prototype includes real case organization, provenance, timelines, recommendations, communication preparation, and a Resolution Pack; it does not provide legal advice, submit grievances, or connect to government systems.
