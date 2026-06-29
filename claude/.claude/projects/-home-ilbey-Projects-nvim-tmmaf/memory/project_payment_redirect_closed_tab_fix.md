---
name: project_payment_redirect_closed_tab_fix
description: cve-payment-processing 10.2.0 closed-tab fix on worktree fix/payment-redirect-flow; verifyAfterRedirect NOT needed (flow gate already server-authoritative); host fix = settlement-hook canceled handling
metadata: 
  node_type: memory
  type: project
  originSessionId: 211c621c-5fbf-4085-bb4a-c58c20952d1c
---

Closed Stripe-tab no longer strands a registrant at payment-approval. Upgraded
cve-payment-processing 10.1.0→10.2.0 on worktree branch `fix/payment-redirect-flow`
(branched from staging HEAD 2026-06-22, NOT yet merged), in parallel with the
event-creation/weight-category agents on staging.

**Key architecture finding (don't re-derive):** TMMAF drives payment through
cve-core flows. The Stripe `success_url` is the flow instance page
(`/flows/registration/{id}`), and on return the flow re-evaluates server-authoritative
gates — it NEVER trusts the redirect (`app/flows/[[...slug]]/page.tsx` lines 112-134:
`?canceled=true` is the only honored hint → step-failed; "paid" comes only from the
webhook-fed `payment-paid` gate). So the briefing's REQUIRED `verifyAfterRedirect`
was ALREADY satisfied natively — `pollRegistrationPaymentStatus` maps
settled/expired/pending → paid/failed/pending. Did NOT bolt it on (would duplicate
the webhook-authoritative poll).

**The actual host fix:** `lib/payment.ts` settlement hook now fires
`failRegistrationFromSettlement` on `outcome === 'canceled'` (the closed-tab
`checkout.session.expired` signal), not just `'failed'`. The fail-park function was
already built for canceled/expired; only the caller was gated. `failRegistrationFromSettlement`
moves a stuck `step-confirm` → `step-failed` browser-independently. `payment-failed`
flow condition already handled `state.tag==='canceled'` (tested in flows-conditions.test.ts).

Also: explicit `session: { expiresInSeconds: 3600 }` policy (tunable, driver clamps
[1800,86400]); `paymentIntents.state` is jsonb so canceled/processing need NO migration;
`processing` outcome is a documented no-op.

**Operator residual:** add `checkout.session.expired` to the Stripe Dashboard webhook
endpoints (staging + live `/api/payment/webhooks/stripe`). See `docs/payment-webhook-events.md`.
Closed-tab path is only fully verifiable against live Stripe webhooks (E2E with a
deliberately-closed tab).

**Assessed + deferred:** `continuePayment` resume-of-open-session (host retry mints fresh
= the `retry` kind, correct; resume adds surface to the waiting-room block the parallel
agents may touch). NOT migrating to `createPaymentStatusCondition` (host conditions already
handle the widened union; migration would risk seeded flow trees keyed by condition kind).
Relates to [[project_cve_core_flow_terminal_rendering]], [[project_registration_flow_is_signup]].

**UPDATE 2026-06-24 (session 2): waiting-room recovery IMPLEMENTED (the deferred surface above), on staging UNCOMMITTED.** Symptom: browser-back / closing the Stripe tab without finishing leaves the intent unsettled and the registrant STUCK on step-confirm polling forever (no `?canceled=true`, so the closed-tab settlement fix can't help — that needs an actual provider/webhook signal). Fix is host-only, reusing existing actions:
- `lib/host-blocks/TmmafPaymentConfirm.tsx` PENDING state now shows two ghost escape buttons (not-prominent, easily-visible): "Ödemeyi yeniden başlat" → `retryRegistrationPayment` (rewind to step-payment + mint FRESH intent + append payment_attempts + redirect — handles expired intents) and "Ödeme özetine dön" → `saveAndExitRegistration` + re-enter (back to the payment summary one step). Auto-advance-on-paid + the paid/failed screens are UNCHANGED (operator confirmed correct).
- TIMEOUT (pollDeadlineMs 5min) no longer dead-ends on "Tekrar kontrol et"; it lands on step-failed (its retry/review/save actions). New action `parkRegistrationPaymentFailed(instanceId)` in host-flow-actions.ts moves confirm→failed, RACE-GUARDED: only if `currentStepId==='step-confirm'` (a late paid settlement that already moved to step-done wins). Removed the pollNonce re-arm.
- GATES: typecheck clean, lint no-new (pre-existing 1083 assertion untouched), the 6 flaky full-suite timeouts were dev-server (dev:https) CPU/DB contention — same 8 files pass 70/70 in isolation. graphify updated. UNCOMMITTED.
- GOTCHA (round 4 fix): cve-core@10.1.2 `flowsRuntime.resumeInstance(instanceId,...)` ZOD-VALIDATES instanceId as a UUID and THROWS — `RegistrationResumeBranch` (app/flows/[[...slug]]/page.tsx) caught only FlowOwnershipError/FlowNotFoundError and re-threw the rest → a non-UUID URL segment (e.g. a stale/test payment-retry link `inst-test-intent-failed-...` from payment-settlement-email.test.ts's `test-intent-failed-${Date.now()}`) = uncaught ZodError = 500. Fix: a permissive UUID_RE guard at the TOP of RegistrationResumeBranch → malformed id renders neutralGatedSurface(), never crashes. Real instances are always UUIDs (prod retry link unaffected). Untrusted URL instanceIds must be UUID-guarded before resumeInstance.
