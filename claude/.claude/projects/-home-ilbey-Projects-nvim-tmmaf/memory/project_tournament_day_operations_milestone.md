---
name: project_tournament_day_operations_milestone
description: "Tournament Day Operations (phases 30-43) — waves 0-4 SHIPPED on gsd/tournament-ops-completion (tags tdo-w0..tdo-w4), migrations 0061-0068 UNAPPLIED everywhere, phase 43 now blocked on operator debt not code"
metadata:
  node_type: memory
  type: project
  originSessionId: 3c0c9770-8c16-4511-903a-5f92c57069be
  modified: 2026-08-10T20:28:17.301Z
---

Milestone **Tournament Day Operations**, phases **30–43**, on branch
`gsd/tournament-ops-completion`. **NOT PUSHED** as of 2026-08-10 (the user pushes; Bitwarden gates
the key, and `gh auth status` was permission-denied in-session).

**State: waves 0–4 converged and tagged** — `tdo-w0` (30), `tdo-w1` (31/32/33), `tdo-w2` (34/35/36),
`tdo-w3` (37/38/39), `tdo-w4` (40/41). Gate at `tdo-w4`: typecheck 0, lint 0 errors / **127**
warnings, **3612 tests / 322 files / 0 failed**, build 0.

**Everything durable is in the repo, not here** — `.planning/tournament-day-operations/` holds
`DECISIONS.md` (scope authority, binding), `SPEC.md`, `PLAN.md`, `MIGRATIONS.md`, `TEST-POINTS.md`,
`CARRY-FORWARD.md`, `40-DESIGN-BRIEF.md`, `recon/`. `.planning/STATE.md` opens with a **RESUME
HERE** block carrying the full operator sequence and the open federation rulings.

**Migrations 0061–0068 are applied NOWHERE** — not local, not staging, not live. PLAN.md's ledger
is SUPERSEDED: the journal must stay contiguous, so wave 3 took 0065/0066/0067 and wave 4 took 0068.
`0067` is the milestone's only one-way door (swaps the `bout_score` unique index to include
`round_index`; once a second round's card exists, reverting needs a human decision).
See [[project_tmmaf_drizzle_migration_ops]] and [[project_tmmaf_clone_dont_migrate]].

**The method that is working — keep BOTH passes.** Each wave = file-disjoint **domain** lanes
(never theme lanes), then an adversarial verify pass per lane that tries to REFUTE its own claims,
then a headless-Firefox walk, then repair + re-gate. Wave 3 came back with 49 findings, wave 4 with
33. **Then an independent `/code-review` at high effort found TEN MORE confirmed defects in each
wave, after the adversarial pass had already cleared the code** — including two that would have
broken mat day. The second pass is not redundant; see [[feedback_two_review_passes_not_one]].

**Recurring defect shapes, all found again in waves 3–4:** false Turkish copy (every wave so far);
capabilities reachable by NO role (three now — medical officer, `ring-referee`/`ring-main-referee`,
and every event export for `event-manager`); state validated OUTSIDE the transaction that mutates it
(three merge/schedule paths, plus all 14 gated schedule mutations sharing one out-of-transaction
draft gate); and **tests asserting a fiction** — a side-desk panel test injected a `boutList`
production never supplies, which is why a stale-promise bug looked covered.

**Phase 43 (the E2E walk, T10, the milestone exit criterion) is now blocked on OPERATOR DEBT, not
code**: migrate 0061→0068, run `scripts/backfill-bracket-placements.ts` (nothing back-fills on
migrate, so completed brackets have no standing of record), grant the referee roles, grant the
weigh-in permissions, **bind a default match format to `mma-pro`** (it is NULL, so no mma-pro bout
can be scored at all), seed the foul reason vocabulary (one entry today), and publish
`cve-scheduling` 0.3.0 + bump both pins.

**Wave 5 (phase 42, athlete/coach visibility) is deliberately NOT started** — `DECISIONS` §4.1
sequences it after confirmation that referees can actually run the day.

Open federation rulings, none guessed at: the pool tie-break for 3+ athletes on equal wins (the
arbitrary UUID ordering is gone — slots are left empty and the tie is reported); whether a
*generated* export needs `storage:inspect`; the 44px coarse-pointer floor on main-desk chrome;
whether the main desk scores (`pendingDesks` counts it, so no round closes without its card).
