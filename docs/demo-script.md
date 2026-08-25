# Resolution Engine — two-minute demo script

Use **Try a sample case** as the primary path. It is fictional and deterministic. Show the optional live image extraction only when it was successfully pre-checked.

| Time | Show | Narration |
| --- | --- | --- |
| 0:00–0:08 | Invoice, support chat, delivery update, damaged-phone image | “When a consumer problem goes wrong, the evidence is usually already there—but scattered everywhere.” |
| 0:08–0:16 | Home intake | Enter `Mera phone damaged aaya tha. Return pickup ho gaya but refund confirm nahi hua.` “Resolution Engine starts with the messy version.” |
| 0:16–0:27 | Evidence and details | “It keeps each useful detail connected to its source.” Show one synthetic live extraction only if available. |
| 0:27–0:39 | Timeline and uncertainty | “It reconstructs what happened and makes uncertainty visible instead of guessing.” |
| 0:39–0:50 | Recommendation | “The next evidence-backed step is to ask the seller for written refund confirmation.” |
| 0:50–0:58 | Message and Resolution Pack | “The user approves the direction. Nothing is sent automatically.” |
| 0:58–1:10 | Architecture diagram | “This is not an LLM deciding a case from a prompt.” |
| 1:10–1:23 | Evidence pipeline | “OpenAI can extract candidate facts from a screenshot. Schema checks, provenance, and validation decide whether they can enter the case.” |
| 1:23–1:35 | Conflicts + ranking | “Conflicts, missing information, synthetic policy guidance, and deterministic ranking shape the recommendation.” |
| 1:35–1:47 | Approval controls | “The person remains in control through recommendation and communication review.” |
| 1:47–1:55 | Product + source links | “Codex helped build and test the architecture; the product boundaries and final review remain human-directed.” |
| 1:55–1:58 | Resolution Pack | “Resolution Engine does not replace grievance systems. It helps people arrive with a case they can use.” |

## Live-provider fallback

If the provider is unavailable, say: “The live provider is optional for this demo. The fictional sample case shows the complete outcome reliably, and we do not pretend a live extraction succeeded.” Continue with the sample case; never wait on a spinner.
