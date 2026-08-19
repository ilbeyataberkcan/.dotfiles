---
name: feedback_worktree_dirty_is_not_unintegrated
description: "A dirty worktree is NOT evidence of unintegrated work — git status compares against that worktree's own stale HEAD, not against the integration branch"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a5006746-e261-4020-bc9e-080b034854b2
  modified: 2026-08-09T16:26:48.200Z
---

I told the operator that 18 worktrees held "real uncommitted work, not residue" and that removing
them would destroy it. **That was wrong**, and they pushed back: *"They should be integrated
already... Don't know why you said they are not."* They were right — 15 of the 18 held literally
nothing.

**Why:** `git status` inside a worktree diffs against **that worktree's own HEAD**, which is
typically hundreds of commits stale. Every file the integration branch changed since the fork
shows up as modified, and every file it *added* shows up as `??` untracked. So a worktree whose
work was long since merged still reads as heavily dirty. I also counted the `node_modules`
symlink as a changed file (`.gitignore` says `node_modules/` with a trailing slash, which matches
a directory but **not a symlink**, so it is genuinely untracked in every worktree).

**How to apply:** to decide whether a worktree still holds unique work, never read `git status`
alone, and never `git diff <integration-branch>` either — that conflates "the branch moved on"
with "this worktree has something". Do this instead:

1. `git rev-list --count <branch> ^staging` — unmerged *commits*.
2. For the files dirty vs the worktree's **own** HEAD, compare each one's content to the
   integration branch: `git hash-object <file>` vs `git rev-parse staging:<file>`. Identical means
   integrated. Missing on staging is the only real signal.
3. Filter `node_modules`, `.next`, `graphify-out`, `.env` before counting anything.
4. For files that genuinely differ, **read the diff** — a superseded draft looks nothing like
   unique work once you see it. Both delegated-payment worktrees turned out to be earlier drafts
   of what staging had already refactored past (`resolvePayableMembers` → `derivePayableStatus` +
   `resolvePayableAmount`; `classifyBatchHold` → `classifyDelegatedHolds`).

Two techniques that looked rigorous and were **not**: `git apply --check --reverse` of the
worktree's patch (context drift alone breaks it, so it false-negatives constantly), and
line-coverage grepping (`git grep -s` isn't a valid flag — every probe errored and silently
counted as "absent from staging", producing a perfect 100% miss rate that should have been the
tell).

When removal *is* right but a worktree has uncommitted content, commit it to its own branch first
and then remove — `--force` discards it irreversibly, and the permission classifier will block
that anyway.

Related: [[project_workflow_worktree_forks_origin_main]], [[feedback_verify_db_state_not_docs]].
