import type { PolicyReference } from "../../types/resolution";

/** Synthetic prototype guidance. It is not legal or regulatory advice. */
export const demoConsumerPolicies: PolicyReference[] = [
  {
    id: "synthetic_demo_policy.refund-status-confirmation",
    title: "Refund status confirmation",
    summary: "When a return pickup is supported but refund completion is not confirmed, ask the seller for written confirmation of the refund status before considering a further step.",
    category: "consumer",
    sourceType: "synthetic_demo_policy",
    effectiveDate: "2026-08-01",
  },
  {
    id: "synthetic_demo_policy.delivery-not-received",
    title: "Missing delivery follow-up",
    summary: "When delivery is not confirmed, ask the seller or marketplace for the delivery status and retain the order and tracking information.",
    category: "consumer",
    sourceType: "synthetic_demo_policy",
    effectiveDate: "2026-08-01",
  },
  {
    id: "synthetic_demo_policy.wrong-product",
    title: "Wrong product follow-up",
    summary: "When the delivered item differs from the order, keep photographs and order details together, then ask for the replacement or return process in writing.",
    category: "consumer",
    sourceType: "synthetic_demo_policy",
    effectiveDate: "2026-08-01",
  },
  {
    id: "synthetic_demo_policy.confirm-conflicts",
    title: "Confirm conflicting information first",
    summary: "When important dates or amounts conflict across sources, ask for confirmation before relying on one version for an escalation decision.",
    category: "consumer",
    sourceType: "synthetic_demo_policy",
    effectiveDate: "2026-08-01",
  },
];

export function searchDemoPolicy(input:{category:string;query:string}):PolicyReference[]{
  const words=input.query.toLowerCase();
  const matches=demoConsumerPolicies.filter(policy=>policy.category===input.category&&[
    words.includes("refund")&&policy.id.includes("refund"),
    (words.includes("missing delivery")||words.includes("not delivered")||words.includes("did not arrive"))&&policy.id.includes("delivery"),
    (words.includes("wrong product")||words.includes("different product")||words.includes("different item"))&&policy.id.includes("wrong-product"),
    words.includes("conflict")&&policy.id.includes("conflicts"),
  ].some(Boolean));
  return matches.length?matches:demoConsumerPolicies.filter(policy=>policy.category===input.category).slice(0,1);
}
