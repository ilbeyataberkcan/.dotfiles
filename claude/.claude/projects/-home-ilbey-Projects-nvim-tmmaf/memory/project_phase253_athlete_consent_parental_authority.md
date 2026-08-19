---
name: project-phase253-athlete-consent-parental-authority
description: "Phase 25.3 athlete consent + parental authority — EXECUTED 2026-08-01, 15/16 plans merged and verified on staging; cve-storage publish CLOSED 2026-08-04 (build green), db:migrate for 0054+0055 still outstanding"
metadata: 
  node_type: memory
  type: project
  originSessionId: 478d714b-5b77-4e3a-97ae-5cd709302868
  modified: 2026-08-08T01:49:37.614Z
---

Phase 25.3 (athlete consent and parental authority). **EXECUTED 2026-08-01** — 5 ultracode Workflow
waves (one per wave, agents in isolated worktrees) plus 3 repair passes and a phase gate. 90 commits
on `staging` from 8172167. Suite 2166 → **2282 passing**; typecheck clean apart from one
operator-blocked line.

**15 of 16 plans merged and independently verified** — an adversarial per-plan verifier checked every
`must_haves` entry against merged code, not against summaries. 14 `passed`; 25.3-15 `human_needed`
(code verified, needs a browser walk); 25.3-12 `not_delivered` for its delegated-upload half only.
Plan 16 is the operator gate and was deliberately not executed.

## OPERATOR ACTIONS (1 of 2 now closed)

1. ~~**cve-storage snapshot publish + both pin moves.**~~ **RESOLVED 2026-08-04.** 25.3-04 shipped
   `ownerId` on `ServerUploadInput` and `storage:upload:on-behalf` into the cve-storage SOURCE
   (`/home/ilbey/Projects/nvim/synapsys-cve`, commits 4cedd6b8 + changeset 95c553b3). It is now
   published as **`@synapsys-integrated/cve-storage` 0.4.0** — tmmaf pins `^0.4.0` in both
   `dependencies` and `overrides`, and 0.4.0 is installed. **`bun run build` passes** (operator-run,
   dev server down); the old failure at `scripts/seed-storage-roles.ts:83` is gone and 25.3-12's
   delegated-upload half (R18) is unblocked. Keep the lesson, not the blocker: a `^0.3.5` caret
   cannot resolve a `0.0.0-storage-onbehalf-*` snapshot, so after any snapshot pin grep the installed
   dist for the literal key to prove the pin took.
2. **`bun run db:migrate`** — local DB re-verified migrated 2026-08-08 (63 migrations, 100 tables).
   Original note follows: 0054 AND 0055 unapplied everywhere and applied in ONE
   transaction, so `verify-coach-identity.psql` must read READY first (local blocks at 2 groups / 11
   rows). Until it lands ~114 tests in ~19 DB-backed suites **abort in beforeAll and report skipped,
   not run** — `2282 passing` overstates coverage — and R20 is unverifiable by construction because
   every audit insert throws into `audit-sink`'s swallowing catch.

**`25.3-OPERATOR-GATE.md` is the single run sheet**: 17 steps deduplicated from all 15 summaries,
with a **SILENT IF WRONG** line on every step that fails without erroring. Four flow trees were
bumped (welcome 14, registration 31, coach-registration 2, event-creation 23) and an unseeded bump
does NOT white-screen — `findDefinitionBySlug` orders by `desc(version)` and permanently PINS the
stale tree for every instance minted in that window.

## Post-gate closure and residuals

The phase gate found 3 code gaps. Two were closed at the root (f9d9451 + b7307cb): **R19** — the
masking policy had shipped as a formatter (`initialledName`) with zero production consumers while the
projection still emitted the full surname; **R20** — a delegated guardian mint was audit-attributed
to the athlete because `finalizeRegistrationLocked` had no acting-caller parameter, and four of five
`parent-onboarding` emissions wrote no delegation marker while the fifth named the guardian.

**R18 is CLOSED, and `25.3-VERIFICATION.md` gap #1 is stale — re-verify before quoting it.**
Checked 2026-08-04 against the merged tree: `app/api/storage/on-behalf-upload/route.ts` exists
(211 lines, commit `763e2f92` "feat(25.3-09): secure delegated athlete document uploads"), gates on
`STORAGE_PERMISSIONS.UPLOAD_ON_BEHALF`, calls `uploadDocumentCore` with `ownerId: athleteUserId`,
and audits via `COACH_DELEGATED_UPLOAD_ACTION_ID`. The chain is end-to-end:
`TmmafDocuments` (`delegated` + `athleteUserId` + `eventId` props, `:76`/`:183`) →
`uploadFileOnBehalf` (`lib/storage/upload-file.ts:46`) → that route → the athlete's own vault.
The verification said "does not exist" because it read the plan set, not the merged route. What
IS still missing is only the **coach-side entry point** — no surface mounts the delegated
documents panel. Operator still owes `seed:storage-roles` so coaches actually hold the grant.

Five residuals are recorded in `25.3-VERIFICATION.md`. The sharpest is a **convention split**:
guardian onboarding writes `onBehalfOfUserId` unconditionally while
`lib/agreement-acceptance-core.ts:215` writes it conditionally — so the delegation predicate for
guardian rows is `on_behalf_of_user_id <> actor_user_id`, never `IS NOT NULL`.

## Design facts that survived execution (still authoritative)

`25.3-RESEARCH.md`'s 31 X-corrections override CONTEXT.md, which overrides SPEC/NOTES. The
federation ruled a coach accepting an athlete's per-event agreements invalid; consent is now an
asynchronous act by the real authority — the athlete if 18+ at event start, their parent if not.
25.2's `acceptor_user_id` + `on_behalf` schema was correct and was reused. **25.2 must not reach LIVE
before this phase does** — see [[project_phase252_coach_accounts]].

- The revoke was **three coupled edits**, not one call — stopping only the write deadlocks the coach
  path at summary with a green suite, because the bulk driver fabricates an accepted payload.
- **Stale-NULL `agreement_status` is a defect CLASS**, fixed at READ time via
  `resolveEffectiveAgreementStatus(stored, eventRequiresAgreements)`, never by assuming a backfill —
  the larger trigger is the federation uploading a bound agreement's PDF, which flips
  `resolveEventAgreements` from empty to non-empty with no binding write at all.
- The gate's own find: a self-registering **minor** still accepted their own agreements. Closed
  inside the fold's transaction — starving the snapshot alone was not enough, the `'accepted'` stamp
  had to go too, and a minor-acceptor snapshot is `onConflictDoNothing` so it would have permanently
  swallowed the parent's later acceptance.
- Parent payment correlation is jsonb containment over the child instance's `payment_attempts`, not a
  column on `registration` — the parent's intent is stashed into the child's instance or settlement
  never finds it.

Related: [[project_phase252_coach_accounts]], [[project_workflow_worktree_forks_origin_main]],
[[project_registration_flow_is_signup]], [[feedback_shared_tooling_scope_agnostic]],
[[project_national_id_is_the_athlete_identifier]]
