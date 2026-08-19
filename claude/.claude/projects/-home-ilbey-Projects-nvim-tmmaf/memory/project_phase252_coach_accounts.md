---
name: project-phase252-coach-accounts
description: "Phase 25.2 coach accounts + delegated registration — EXECUTED 2026-07-30, 14/14 plans, 72 commits, audits closed; blocked on the operator gate (0054 unapplied)"
metadata:
  node_type: memory
  type: project
  originSessionId: 4090539e-7acd-45ef-8678-2fd8eced67a5
  modified: 2026-07-30T19:02:32.424Z
---

Phase 25.2 (coach accounts and delegated athlete registration) is **CODE COMPLETE** as of
2026-07-30 — 14/14 plans, 72 commits `3110b5e..7aa7518` on `staging`, unpushed (user pushes).

**Gates:** typecheck 0 · lint 0 errors / 70 pre-existing warnings · `bun run test` **2163 passed /
0 failed** / 7 skipped / 89 todo (208 files) · `bun run build` 0 with the dev server down.
Validation closed 8/8 Nyquist gaps (coverage 15/8/4); `25.2-SECURITY.md` is `threats_open: 0`
across 141 threats with 18 accepted risks.

**The blocker the security audit caught, and the class it belongs to.**
`resolveOrStartRegistrationInstance(userId, eventId)` was exported from `lib/registration-entry-actions.ts`,
a `'use server'` module that a `'use client'` component imports from — so Next registered an action
id for it. A direct POST with an attacker-chosen `userId` minted a registration flow instance owned
by that victim and disclosed their live `instanceId`. A plan-03 *extraction* regression: pre-phase
the id came from `resolveFlowCallerOrGuest()` inline. Fixed at `91791f7` by moving the resolver to
`lib/registration-entry-core.ts` with no directive.
**The rule:** extracting a helper out of a server action and leaving it exported from the same
`'use server'` file publishes it. Owner-parameterized cores belong in a `*-core.ts` module with no
directive (the pattern `lib/storage/document-actions-core.ts` already set). Guarded by three
mutation-verified tests in `tests/unit/coach-delegation-invariants.test.ts`.

**Execution shape that worked (reuse it):** collision-aware *lanes*, not plain waves. Seven plans
touch `lib/host-flow-actions.ts`, so lanes serialize on shared files and run in parallel across
disjoint ones — one Workflow per wave, orchestrator merges between waves. Waves 1-3 in worktrees
(with the mandatory base-recovery merge from [[project_workflow_worktree_forks_origin_main]]);
single-plan waves ran directly on the main checkout, which skips the merge entirely.
Two things every parallel agent needed: `GRAPHIFY_SKIP_HOOK=1` on every commit (the post-commit
hook rebuilds the graph and races on one output dir), and a ban on `bun run build` / the full suite
(they contend on `tmmaf_pg`) — gate once at the end.

**Corrections that outrank the planning artifacts** (they are wrong on disk; SUMMARYs record it):
- Migration `0054`'s national-ID alphabet is digits-only `'\D'`. Plan 06's text said `'\s'` in FOUR
  places. A whitespace index would disagree with plan 01's pre-check and could abort the migration.
- `VALIDATION.md` and `RESEARCH.md` say TWO production `flowsRuntime.advance(` sites; the shipped
  architecture has exactly ONE (the bulk driver routes through `advanceCore`).
- `acceptor_user_id`'s FK is ON DELETE **no action**, not cascade.
- The R4 display exemption is `lib/admin/components/ApplicationReviewDialog.tsx:828` —
  `lib/host-blocks/ApplicationReviewDialog.tsx` does not exist, though several plans name it.
- Acceptance criteria number 27, not the SPEC header's 28.
- `VALIDATION.md` grep #1 was *unsatisfiable as written* (demanded `/\s/`'s only hit be a module
  that uses `/\D/g`) — it would have failed on the operator's desk for a non-defect. Replaced.

**Blocking, all operator-only** (26-step checklist with exact commands in `25.2-14-SUMMARY.md`):
migration `0054` is authored but UNAPPLIED everywhere, and it blocked ZERO tests because every new
suite mocks `@/lib/db/client` — the green suite says nothing about whether it applies. Local has
2 duplicate normalized-national-ID groups / 11 rows ([[project_national_id_duplicates_are_test_residue]]).
`athletes_user_id_unique_idx` is absent on local and `0054` deliberately does not create it.
**Release order RESOLVED — the deploy stays zero-downtime.** `tmmaf-deploy.zsh` runs `migrate`
BEFORE rolling either replica, so both app1 and app2 serve the PREVIOUS release against the new
schema for the whole rollout — a rolling deploy makes that window longer, not shorter. The acceptor
CHECK inside `0054` rejected every snapshot insert for that window. Split out to
`db/operations/enforce-acceptor-present.psql`, run after both replicas are healthy (`f25fedd`).
**The general rule for this repo:** a migration statement that the PREVIOUS release's code cannot
satisfy must never ride in the migration — additive first, enforce after the roll. Guarded by
`tests/unit/coach-delegation-invariants.test.ts`. The coach registration surface is **boot-seeded via
`queueMicrotask`** — an unseeded tree renders blank with no error, invisible to a green build, so
only a staging look proves it. The coach undertaking PDF must be uploaded and version-pinned before
any coach run, and `bun run seed:explicit-permissions` re-run ([[project_dewildcard_drift_gap]]).

**Architecture (operator round 2, overrides discuss-phase):** there IS a coach flow tree — a
*controller* whose steps mirror the athlete flow and which drives each athlete's own real
`registration` instance headlessly through the existing seams. Athlete instances are the source of
truth; re-opening auto-fills from them. Coaches get NO cve-auth role — the `coach_athlete` link is
the authority. Intent metadata is `athlete_id` + `payer_id` on every intent. The undertaking rides
an agreement location, not an event binding.

Related: [[project_phase25_time_tiered_pricing]], [[project_tmmaf_drizzle_migration_ops]],
[[feedback_no_doc_item_numbers_in_prose]], [[project_national_id_duplicates_are_test_residue]],
[[project_workflow_worktree_forks_origin_main]], [[project_dewildcard_drift_gap]]
