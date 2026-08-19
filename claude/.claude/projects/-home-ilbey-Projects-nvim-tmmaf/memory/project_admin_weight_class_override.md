---
name: project_admin_weight_class_override
description: "Admin ±1 weight-class override + bounded athlete lists — COMMITTED 2026-08-03 on feat/admin-weight-class-override, awaiting operator UAT + push"
metadata: 
  node_type: memory
  type: project
  originSessionId: 419e278f-3706-4666-9299-d2e75233451f
  modified: 2026-08-04T14:59:06.695Z
---

Parallel worktree `../tmmaf-weight-override` (branch `feat/admin-weight-class-override`,
forked from `staging` HEAD 172b5962). 4 commits: 77a2ec2b feat, 490a25cb fix, c3d2185d
docs, 45be34e3 graph. No migration, no seed, no flow-version bump.

Admins can assign an athlete the weight class **one rung above or below their own** per
discipline. Ladder = offered weight classes sharing (discipline, gender, age band, branch
scope); `adjacentWeightClassIds` in `lib/registration-eligibility.ts` is the pure helper,
opened via `resolveCategoryDisciplineGroups(..., { adjacentWeightOverride: true })`.
A separate `overridable` flag — `eligible` keeps its honest meaning so the athlete-side
advance guard is untouched. See [[project_registration_category_model]].

**The admin terminal fold ran NO weight check before this** — the lock was purely the
disabled chip in the browser, so a crafted `selected_lines_json` could mint any offered
class. `finalizeAdminCategoryEditLocked` now re-derives the ±1 window server-side.
Two traps found by existing fixtures, both fixed in the rule not the test:

- **Null window falls back to offered-set-only.** No declared weight / no profile /
  outside every offered class = no own-class to measure from. Failing closed there makes
  every weightless imported registrant un-assignable.
- **Uniqueness counts `added`, not `desired`.** The island prefills the applied line, so
  a reassignment legitimately carries baseline + replacement; the old line is displaced
  by the athlete's acceptance.

Also bounded three unpaginated athlete lists to `max-h-72 overflow-y-auto`
(RegistrationListCard, InProgressTable + sticky thead, DrawSetupWizard seed roster) per
the approval-grid design brief's ~6–10 rows rule.

**ON STAGING 2026-08-04** — merge commit `8790b6e9`, staging tip `ff2fd8d8`. Safety ref
`backup/staging-pre-weight-merge-260804` points at the pre-merge `eae991a0`.

**The real conflict was against the main checkout's UNCOMMITTED work, not against any branch.**
`/home/ilbey/Projects/nvim/tmmaf` was carrying 133 uncommitted files (the RF9 codex flow audit +
parent/coach flow work), committed first as `cfc63b98` so it could be merged at all. Four source
files were edited by BOTH sides: `dispatch-admin-category-edit-terminal.ts`,
`registration-document-review.ts`, `email/templates/registration.ts`, `host-flow-actions.ts`.
When a branch looks conflict-free, check the working tree too — a clean `git diff` between two
branch tips proves nothing about a dirty checkout.

The one judgement call, in `dispatch-admin-category-edit-terminal.ts`: the two sides had
**incompatible mail models**. Staging mailed a consent *offer* (token + `reviewUrl` CTA) fanned
out to the athlete AND a minor's guardians; the branch deleted the token flow entirely for
*settle-on-submit* (`settled: true`, `removed` rows, no CTA). Resolution keeps the branch's settled
semantics and the RF9 guardian fan-out: loop `resolveAthleteNoticeRecipients` with a per-recipient
idempotency key derived from `changeKey`. A shared key would suppress the guardian copy.
`replacesExistingSelection` was dropped because the template only reads it in the non-settled
voice. Symptom of getting this wrong: `offerRoundSig` / `reviewUrl` / `head` survive as orphans.

**Full-suite on merged staging: 2 failed files / 4 tests** (`event-creation-edit-mode`,
`send-payment-reminders`) — both pre-existing; the other 4 old baseline failures were fixed by the
RF9 work. **The earlier "15 failed" figure was timeout noise** — `bun run test` under concurrent
load (e.g. the post-commit graphify rebuild) times suites out at 20s. Re-run quiet before believing
a regression. typecheck + lint (0 errors) + `bun run build` all green.

OPERATOR PENDING: visual UAT of the ±1 chips + the three lists, then push. `fix/coach-governance-stepup`
is now obsolete — it holds no unique source, only a redundant merge and two chores.
