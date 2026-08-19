---
name: project_phase25_time_tiered_pricing
description: Phase 25 time-tiered event pricing — on main since 2026-08-03 as a partial staging promotion (merge 6347859, migrations 0044-0052); staging UAT + phase-24 joint settlement check never confirmed
metadata: 
  node_type: memory
  type: project
  originSessionId: 7865d8f2-0562-4658-a27f-894162e2fc44
  modified: 2026-08-03T10:38:58.800Z
---

Phase 25 (time-tiered event pricing) closed 2026-07-29. 10 plans, 14 code-review
findings, 4 operator-UAT gaps — all closed. Pushed to `origin/staging`
(`9082c19..9f783fc`, 83 commits). Gates at close: 176 files / 1838 tests,
typecheck clean, lint 0 errors, build compiled.

**Architecture:** `applyTierSchedule` in `lib/pricing/tier-schedule.ts` is the single
place a base price meets a schedule — charge (`resolvePaymentAmountForLines`),
display, and `resolvePricingTimeline` all route through it, so charge/quote
divergence is unreachable by construction. Migration **0052** (journal tip);
`event_discipline.tier_schedule` jsonb, `event.add_line_tier_policy`,
`registration.paid_amount_minor` + `paid_currency`. Event-creation flow at **v22**
(`step-tiers`; `requireFields: ['tiersValid']` gates the advance button).

**PROMOTED TO `main` 2026-08-03**, in two steps. First `6347859` (tree = `d7f8bf7`,
phase 25 closed, migrations 0044–0052) — pushed `656dd57..6347859`. Then `c861235`
(tree = `5b39c74`, +phase 25.1 club lockdown, migrations through **0053**), because
the goal was parity with **the image staging actually runs**, not the staging branch
tip: `/srv/tmmaf-staging/.deploy-tags` read `staging-sha-5b39c747…` and live's
`__drizzle_migrations` count of 54 (= `0000`–`0053`) is what identified it. The
deployed staging is **264 commits behind the staging branch tip** — always read
`.deploy-tags` + the migration count before assuming staging == its branch.
Excluded: 25.2 coach accounts, 25.3 parental authority, outreach (`0054`–`0058`).

Both merges were built with `commit-tree` + `update-ref` instead of checkout+merge,
so the dirty staging working tree was never touched, and each produced a tree
byte-identical to its target commit — the later full `staging → main` merge stays
clean. Live goes 44 → 54 migrations on this deploy. **The `0053` Ferdi-sentinel
pre-flight applies** (`db/operations/verify-club-registry.psql`, pgAdmin PSQL Tool):
its Ferdi-affiliation count is unrecoverable once the migrator runs. The `0054`
coach-identity gate does not apply. The three items below were NOT confirmed done
before the promotion — verify them against live.

**OUTSTANDING:**
1. Staging confirmation of the four fixed UAT behaviours (tier-step backward nav,
   live validation, timeline bounded at registration close, publish latency).
2. **Phase 24 verifies JOINTLY with 25** — 24's pending settlement verification now
   runs against 25's restructured `flipRegistrationPaymentToPaid`. Verifying 24
   against pre-restructure code proves nothing about what ships.
3. **D-20 / D-25-22 queries against LIVE.** R15 changes behaviour on ship: a
   null-date `applications_open` event silently vanishes from the athlete list while
   the admin table still reads «Başvurular Açık»; an event past its close stops
   accepting registrations. See [[project_payments_financial_phases_23_24]].

**Deferred, code-proven only:** AC-23 (category-edit timeline) and AC-29 (R16
add-a-line tier policy) both sit behind `CATEGORY_EDIT_ENABLED = false`.
`duplicateEvent` drops per-discipline settings and now also drops tier schedules —
recorded follow-up, needs a decision about what duplication means for a schedule
anchored to a different event's window.

**Four defects found that PREDATED the phase**, all fixed: the cve-storage empty
allow-list trap ([[project_cve_storage_empty_allowlist_trap]]); a racy
`ensureFederationOrganization` that rethrew on a holder deleted mid-run and could
crash app startup; the same function re-adding soft-deleted staff on every bootstrap;
and `publishEvent` awaiting a serial 259-recipient SMTP loop (14.3s), now deferred
with `after()` — every gate still runs before the response.

**Why:** the phase is code-complete but NOT verified end-to-end, and the two
verification gaps are both on the money path where a silent defect is expensive.

**How to apply:** treat staging UAT + the joint phase-24 settlement check as blocking
for promotion to `main`, not as optional cleanup.
