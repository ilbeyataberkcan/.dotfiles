---
name: project_payment_confirm_complete_button
description: step-confirm screen — Başvuruyu Tamamla button + resume-first re-initiate; settlement is webhook-only; live-verify deferred
metadata: 
  node_type: memory
  type: project
  originSessionId: 2c562bdf-3046-465e-b51c-5e41411f62db
---

quick task 260627: reworked the post-payment waiting room `step-confirm`
(`lib/host-blocks/TmmafPaymentConfirm.tsx`) to serve TWO registrants on the pending
spinner — already-paid-but-lagging and never-finished-paying.

- **"Başvuruyu Tamamla"** (primary) = pure authoritative re-check via
  `pollRegistrationPaymentStatus`; on `paid` flips phase → existing auto-advance finishes.
  NEVER initiates payment → cannot double-charge. Unconfirmed click only shows a "keep
  waiting" hint (never fabricates completion — security).
- **"Ödemeyi yeniden başlat"** = now **resume-first** via new `continueRegistrationPayment`
  (`lib/host-flow-actions.ts`) → `continuePaymentForFlow` (`lib/payment.ts`, reuses
  `FLOW_GATE_SYSTEM_ACTOR`, only `payment:transaction:view`). `resume`→same Stripe session
  (no new charge); `settled`→paid; `retry`→re-poll the gate ONCE (double-charge guard:
  `continuePayment` returns `retry` for BOTH expired AND complete-but-webhook-lagging
  sessions, so a just-settled user is routed to paid, never re-charged) → else `expired`.
  A fresh mint (`retryRegistrationPayment`) is gated behind an explicit "Yeni ödeme başlat"
  shown only after `expired`. **Removed** the old "Ödeme özetine dön" (rewound to pay gate
  → wrong for a paid user). The OLD re-initiate minted a fresh intent unconditionally = the
  double-charge bug this fixes.

**Hard constraint (package design):** settlement is **webhook-only**. `continuePayment` /
`verifyAfterRedirect` read our OWN webhook-fed DB row and NEVER fabricate `paid` / fire the
settlement hook. The Stripe driver's `getSessionStatus` DOES expose live `paymentStatus`,
but the facade deliberately hides it. So a host-only button can't confirm payment the
webhook hasn't reported yet.

**DEFERRED (user chose host-only 260627):** true "complete while webhook is missing/slow"
needs a live-verify method added to `cve-payment-processing` (reads Stripe's authoritative
paymentStatus, settles + finalizes idempotently) — facade forbids host-side direct Stripe
calls. Remind the user if webhook-independence is ever wanted. Related:
[[project_payment_redirect_closed_tab_fix]], [[project_cve_core_flow_terminal_rendering]].

UNCOMMITTED; full Playwright+`stripe listen` manual leg still pending.
