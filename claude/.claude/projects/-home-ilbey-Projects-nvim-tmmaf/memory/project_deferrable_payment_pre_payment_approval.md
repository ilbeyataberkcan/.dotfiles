---
name: project_deferrable_payment_pre_payment_approval
description: "IMPLEMENTED (typecheck+build clean, UNCOMMITTED) — deferrable payment + pre-payment approval; mint rows at summary, paymentStatus truthful, 2 new registration perms; pending operator DB steps + UAT"
metadata:
  node_type: memory
  type: project
  originSessionId: 41c4fba2-2b41-403a-9b56-1a6071b35fc5
---

Federation change: applications become approvable BEFORE payment. Plan approved + IMPLEMENTED
2026-07-01 via a 5-stage sequential ultracode workflow. Plan + SUMMARY at
`.planning/quick/260701-deferrable-payment-pre-payment-approval/`. Code-complete: full
`tsc --noEmit` clean + `next build` succeeds. UNCOMMITTED.
**Before it works end-to-end the operator must:** run migration
`0026_backfill_registration_payment_status.sql` (`bun run db:migrate`), reseed the registration
flow to **v22**, and redeploy so `bootstrapAdmin` folds the two new perms into superadmin. Then
UAT (needs docker: tmmaf_pg + tmmaf_mailpit + `stripe listen`). New files:
`lib/admin/registration-permissions.ts` `registration-authz.ts` `registration-permission-catalog.ts`
`online-paid.ts` `components/UnpaidApproveNotice.tsx`, `lib/host-blocks/StatusPayButton.tsx`.
Key deviations: v22 summary CTAs live in `RegistrationChrome` (TmmafSummary is legacy-only);
`payLater` is stripped from the strict step payload then persisted server-side via
`recordPayLaterChoice` (engine has no boolean step-field); step-payment back button removed
(back-nav guard); no overshoot-fold for step-done-deferred (it parks, never overshoots until paid).

**UAT fix round (2026-07-01, typecheck+build clean, UNCOMMITTED):** 4 bugs fixed.
(1) Application reference was `paymentReference ?? fallback` at 5 sites → unstable/changed after pay;
now a stable `applicationReference(athleteId,eventId)` sha256-slice in `lib/registration-reference.ts`
(paymentReference is Stripe-correlation ONLY, never displayed). (2) The `0026` backfill POISONED
deferred rows (`paid_pending_confirmation`+unpaid+null-ref → marked paid w/ null ref → onlinePaid guard
never fired) — corrective migration **`0027`** reverts them (needs `db:migrate`) + `flipRegistrationPaymentToPaid`
WHERE broadened to `(unpaid OR paymentReference IS NULL)` to self-heal. (3) R1 email gained a
`paymentDueBy` deadline callout, gated on `finalState.payLater` + `event.registrationClosesAt`.
(4) P1 receipt never fired: `settlementHook` read camelCase `providerData.customerEmail` off the RAW
Stripe object (always undefined) → fixed by server-sourcing the registration recipient from
the settlement path + reading real raw fields for non-registration. **Follow-up (same session):**
unified P1/P2/P3 for registration behind one testable seam `sendRegistrationSettlementMail(kind,
instanceId, opts)` + `resolveSettlementRecipient(instanceId)` in registration-terminal.ts;
`settlementHook` now routes ALL registration outcomes (paid/failed/canceled/refunded) through it and
returns early (non-registration keeps the raw-field path). `finalizeRegistrationFromSettlement`
reverted to `Promise<void>`. `amountMinor` is `bigint` (PaymentReceipt/RefundContextSchema require
z.bigint() — do NOT Number() it). Dev trigger `scripts/dev-fire-settlement-mail.ts` fires P1/P2/P3
against the newest registration instance via the same seam (unique idempotency keys) — verified all
three deliver via Resend 2026-07-01. P2-refund detection depends on the refund webhook carrying the
flow metadata; falls back to the raw path otherwise.

**Load-bearing facts discovered (non-obvious, verify before editing):**
- A `registration` row is created in ONE place — `dispatchRegistrationTerminal`
  (`lib/registration-terminal.ts:329`) — and only via the settlement webhook
  (`lib/payment.ts:146`). So nothing is approvable pre-payment today. The plan MOVES the
  mint to summary-advance (`advanceAction` step-summary branch, `host-flow-actions.ts:537`)
  for ALL applicants; settlement becomes an UPDATE that flips `paymentStatus` to 'paid'.
- `registration.paymentStatus` (`domain.ts:348`) is DEAD — only ever written `'unpaid'`,
  never flipped. Real "paid" authority today is `lifecycleState='paid_pending_confirmation'`.
  Plan makes the column truthful + backfills existing awaiting rows to 'paid'.
- R1 email `createRegistrationConfirmationEmail` (`email/templates/registration.ts:121`)
  FALSELY says "Ödemeniz alındı" — reword payment-neutral. P1 payment-receipt is separate
  (`payments.ts:66`, fires only on Stripe paid) and correct as-is.
- `RegistrationTerminalSchema.payment_attempts` is `.min(1)` — blocks a pre-payment fold;
  must relax to optional.
- No granular `registration:*` permission exists (approval gates on coarse `admin:access`).
  Plan adds `registration:approve-unpaid` (gate approving unpaid) + `registration:set-payment-status`
  (manual paid/unpaid toggle in review dialog, LOCKED when paid online). Recipe mirrors
  `event:*` (see [[reference_cve_auth_authz_model]]).

Confirmed with user: mint for ALL (not just deferred); approve-unpaid → Approved but payment
still owed; pay-later is self-serve ("Öde" button on status page + deferred done screen);
manual payment switch styled like category-approval toggles, disabled when online-paid.

Relates to [[project_payment_confirm_complete_button]], [[project_cve_core_flow_terminal_rendering]],
[[project_registration_flow_is_signup]], [[project_tmmaf_drizzle_migration_ops]],
[[feedback_client_is_dumb_reflection]] (server-authoritative gates).
