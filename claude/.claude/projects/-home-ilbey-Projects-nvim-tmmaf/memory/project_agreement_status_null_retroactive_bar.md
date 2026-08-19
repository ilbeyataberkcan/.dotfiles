---
name: project_agreement_status_null_retroactive_bar
description: "Deploying 0055+ makes every pre-existing registration read consent-pending and bars it from weigh-in/draw, if the event resolves any agreement"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5a123e40-a7f5-4597-9321-b20e487009de
  modified: 2026-08-09T11:25:42.659Z
---

`resolveEffectiveAgreementStatus(null, true) → 'pending'` (`lib/registration-agreement-status.ts:61`).
Every registration minted before migration 0055 has `agreement_status = NULL`. The moment its
event resolves ANY agreement — an admin binds one, **or the federation merely uploads the PDF for
an already-bound one** — all those rows read pending and `barredByAgreement` bars them from the
weigh-in queue and the draw pool.

**Why:** the stored stamp is a cached derivation of a mutable input, so every loader coalesces it
against the event's live agreement set. NULL means "nothing was ever asked", not "done" — so once
something IS asked, NULL must mean owed. Fail-closed is correct; it just reaches backwards.

**How to apply:** before deploying 0055+ onto an event that is mid-application-collection, check
whether that event resolves any agreement. If it does, expect a bulk consent round covering
**every athlete, not just minors**. It is remediable in-product, not a data repair: the acceptance
writer selects `agreementStatus = pending OR IS NULL`
(`lib/agreement-acceptance-core.ts:227-230`), so an athlete/parent acceptance flips pre-existing
rows to `accepted`. If the event binds no agreements, this is a non-event.

Verified 2026-08-09 alongside: migrations 0053–0060 are all additive to `registration` (nullable
columns only); the tier engine's `lib/date-bound.ts` extraction is behavior-identical; in-flight
flow instances stay pinned to their own definition version, so flow/UI changes are safe for
already-submitted applications. See [[project_phase253_athlete_consent_parental_authority]],
[[project_phase25_time_tiered_pricing]], [[project_tmmaf_drizzle_migration_ops]].

Stale-comment trap: `lib/payment-composition.ts:130` says the `audit_log` insert sites need
migration **0055** before the new build serves — it also supplies `actorServiceId`/`ipAddress`/
`userAgent`/`metadata`, which land in **0060**.
