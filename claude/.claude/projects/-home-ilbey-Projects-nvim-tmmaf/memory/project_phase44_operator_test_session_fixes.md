---
name: project_phase44_operator_test_session_fixes
description: "Phase 44 — SHIPPED TO STAGING as v0.8.0 (2026-08-13); 4 of 10 reported premises were wrong; the staging merge reversed this branch's guardian-SMS decision"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9cf9af0e-4032-474f-ba3d-ec6befc6b524
  modified: 2026-08-13T12:53:18.474Z
---

Opened **2026-08-13** from the operator's 2026-08-12 test session. Ten items, investigated by a
10-lane read-only workflow + cross-check BEFORE any code. Full distilled findings live in
`.planning/phases/44-operator-test-session-fixes/CONTEXT.md` — read that, not this.

**FOUR OF TEN REPORTED PREMISES WERE WRONG**, and in each case the real defect was smaller and
somewhere else. This is the durable lesson: the operator reports a *symptom* accurately and a
*cause* speculatively, so the investigation lane must be allowed to contradict the report.

- "Re-draw ignores merged athletes" → entrant resolution was already merge-aware. The bug was that
  `applySeedingEdit`'s roster-drift guard refused **every** op including `recalc`, the only remedy —
  telling the operator to do the thing it had just refused.
- "TCKN/passport column is the wrong type" → all four columns were already `text`. The bug was a
  normalizer that **silently deleted** letters, so `AB1234567` became `1234567` and failed a length
  floor.
- "Athletes can't enter a city for non-TR countries" → city entry was never blocked; it degraded to
  a bare text box. The real hard block was the **country select** (no KKTC, no free-text escape).
- "Nginx blocks the Twilio webhook / do we even have one" → the route exists, Caddy proxies it, and
  `lib/env.ts` already pairs all six Twilio credentials to the transport, so the app cannot boot
  without `TWILIO_AUTH_TOKEN`. (CONTEXT.md's own claim that the superRefine was missing was itself
  stale and an implementer caught it.)

**Waves** (ordered by verified file-disjointness — one branch, no worktrees):
1. redraw-after-merge · redraw-approved-confirm · brackets-pdf · ac-37.1 · twilio · country-city
2. identifier alphabet (**migration 0069**) · datetime components · referee four-screen loop
3. medical-clearance gate (**migration 0070**) — blocked on a ruling that reverses DECISIONS §1.9
   "No bar", AND on wave 1, since arming the flag without lane 1's fix strands every affected
   category behind the same refusal.

**AC-37.1 did not need a package release.** `cve-scheduling` 0.3.1's `Constraints.byGroup` counts
per group, which produces the `capA + capB` the federation rejected (ruling §9.1: shared count,
per-discipline ceiling). The first attempt gave the solver the *loosest* cap and demoted the exact
rule to an advisory board badge — a **safety regression**, because the previous `min(caps)` collapse
would at least have spilled the illegal bout to day 2. The answer was to keep the loose solver cap
(so nothing legal is refused) and make the host-side re-decision a **hard** violation folded into
the same list the publish gate reads. Package change avoided.

**The independent second review pass earned its keep again**: 7 confirmed / 35 refuted after nine
lanes had already passed in-workflow adversarial review. One confirmed finding was mine — I fixed
`DateField`'s commit-or-clear bug and never checked its sibling `TimeField`, which the schedule swap
had just made load-bearing. See [[feedback_two_review_passes_not_one]].

**Standing operator debt this phase adds** (on top of the unapplied 0061–0068 backlog):
- **0069 must run after 0065–0068.** Until it does the app accepts alphanumeric identifiers while
  the index still keys digits-only, so two passports sharing digits collide as "already registered".
- **Reseed the flows** — welcome v18, registration v37. Without the version bump the seed does not
  reseed and the identity fields keep a numeric keyboard and the old "9–12 haneli" hint.
- Re-run `db/operations/verify-coach-identity.psql` after 0069.

**Open rulings** (recorded in `tournament-day-operations/DECISIONS.md` §9): medical-clearance default
scope (per-event off / on for new events / unconditional) — asked, unanswered.

Related: [[project_tournament_day_operations_milestone]], [[project_tmmaf_clone_dont_migrate]],
[[project_gsd_phase_add_numbers_from_roadmap_only]], [[feedback_audit_every_user_facing_sentence]].

---

## SHIPPED 2026-08-13 as `v0.8.0`

`staging` at `288422f3` with the annotated tag on the merge commit; branch at `48470df8`. Gate on
the merged tree: typecheck 0 · lint 0 errors · **3902 passed / 0 failed** · build clean.

**Staging cannot run it until migrations `0061`→`0069` are applied AND the flow trees reseed**
(welcome **v18**, registration **v37**) — a tree only reseeds on a version bump, and without it the
identity fields keep their old numeric mask so the passport fix reaches nobody.

## The staging merge reversed a decision this branch made — and the lesson generalises

The branch deleted the invite link from the guardian SMS on the strength of the RUNBOOK's
no-URL-for-Turkey rule. **Staging had already re-validated that rule and rewritten it:** it was
written for an **alphanumeric** sender, which Turkish operators do filter, and it does **not** bind
the pinned long code in `TWILIO_SMS_FROM` that ships today and delivers URLs today. Every outreach
conflict resolved to staging, whose `LINKED_REASONS` carries first-party links with URL validation.

**Two dependents were NOT flagged as conflicts and would have shipped false:** a success message
claiming e-mail was the only channel, and a test asserting the SMS body carries no URL.

**A semantic conflict is not always a textual one.** After resolving a merge, grep every sentence
and every assertion that depended on the behaviour the other side changed — git will not point at
them. See [[feedback_audit_every_user_facing_sentence]].

## Open at hand-off

- **The two flow-test events are invisible in the admin Events list on local**, cause unproven.
  `loadEventsListData`'s exact SQL returns both (verified); the untraced suspect is the
  grant/permission path running AFTER the query in `get-events-module.tsx`. If it is a grant
  filter it affects real events too, not just fixtures.
- **Medical clearance default** — the tenth item, wave 3, unbuilt and still awaiting the ruling.
- Eight tests failed once under full-suite parallelism (`invoice-batch-heal`,
  `category-edit-timeline`), passed on re-run and in isolation. Unattributed; the honest suspect is
  the referee fixture now sharing one catalog row across parallel files.
