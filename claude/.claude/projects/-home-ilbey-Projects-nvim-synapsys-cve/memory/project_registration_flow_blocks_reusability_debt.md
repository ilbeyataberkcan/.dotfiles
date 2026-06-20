---
name: project_registration_flow_blocks_reusability_debt
description: "The registration payment-flow host-blocks are host-specific scaffolding, not reusable cve-* primitives — promote later"
metadata: 
  node_type: memory
  type: project
  originSessionId: b75c36d8-a3ef-4a41-9a28-8017f0098a40
---

The registration flow's payment host-blocks in apps/cve-test-host/lib/host-blocks/
(`PayBlock`, `RegistrationFailedBlock`, `PaymentConfirmationBlock`) + their server
actions in `host-flow-actions.ts` (`initiateRegistrationPayment`,
`retryRegistrationPayment`, `saveAndExitRegistration`, `pollRegistrationPaymentStatus`,
`rewindRegistrationToPayGate`) are HOST-SPECIFIC scaffolding, NOT reusable
cve-package primitives. The operator explicitly flagged this 2026-06-02: "our
implementations were far from being re-usable. It is OK for now but we need to do
something about it later."

The reusable patterns worth promoting later (into cve-payment-processing and/or
cve-core/flows): the redirect→webhook race handling (a poll-confirm waiting-room
step + read-only status poll + manual-Continue), the position-encodes-state move
(advance into the waiting room at PAY TIME so the resume is pure read-and-render),
the "rewind to the pay gate" lifecycle move shared by retry/save-and-exit, and the
pay/confirm/failed block trio. Don't treat any of these host blocks as canonical
reusable architecture when designing the real package surface — they are a working
reference to distill, like [[feedback_studio_smoke_not_reference]]. Apply the
composable-primitives litmus test ([[feedback_composable_primitives_litmus_test]])
when promoting.

Full actionable list (incl. the cve-payment return-URL decoration → opt-in decision,
operator 2026-06-02): `.planning/todos/pending/2026-06-02-payment-flow-reusability-cleanup.md`.
That decision: cve-payment-processing's Stripe driver appends intent_id/status/token
to EVERY hosted-checkout return URL (R23 anonymous status-check) — invert to OPT-IN
so the default is clean/webhook-authoritative URLs; keep the feature behind a flag for
guest flows ([[project_public_guest_actor_flows]]). Left as-is for now (inert + low-risk
for the authenticated registration flow).
