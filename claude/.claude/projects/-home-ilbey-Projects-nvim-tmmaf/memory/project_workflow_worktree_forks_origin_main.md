---
name: project_workflow_worktree_forks_origin_main
description: "Workflow tool's isolation \"worktree\" forks from origin/main, NOT current HEAD — agents silently get a stale tree unless the prompt forces a base-recovery merge"
metadata: 
  node_type: memory
  type: project
  originSessionId: cd4a277f-863d-4203-96ac-6bb51ed00014
  modified: 2026-08-09T16:26:34.271Z
---

**The `EnterWorktree` TOOL does this too** — same trap, different entry point, confirmed
2026-08-04. Its `worktree.baseRef` defaults to `fresh` = `origin/<default-branch>`, so entering a
worktree while working on `staging` landed **286 commits behind**, with `lib/coach-payables.ts`,
`lib/parent-payables.ts` and `app/api/storage/on-behalf-upload/route.ts` all absent. Check the
base immediately after **every** `EnterWorktree`, not just inside Workflow agents.

**Recover with `merge`, never `reset --hard`.** On that run `git reset --hard staging` would have
silently dropped 2 commits: `main` carries merge commits (`Merge staging … into main`) that
`staging` itself does not, so HEAD is **not** an ancestor of `staging` and the reset is lossy, not
a no-op. Always check `git rev-list --count staging..HEAD` first — nonzero means reset destroys
work. `git merge staging --no-edit` keeps both sides and is the correct recovery.

The Workflow tool's `agent(..., { isolation: 'worktree' })` creates the worktree off
**`origin/main`**, not off the orchestrator's current HEAD. Verified 2026-07-30 on tmmaf across
three separate Workflow runs (10 agents): every worktree landed on `origin/main` while work was on
`staging`, ~332 commits ahead. In that tree `.planning/phases/25.1-*/` did not exist at all.

**Why:** an agent that doesn't check will edit a months-old tree and produce plausible-looking but
wrong work. Passing an `EXPECTED_BASE` and only *warning* on mismatch is not enough — one agent
noticed and recovered, one refused and did nothing, and that was luck, not design.

**How to apply:** put a MANDATORY base-recovery merge in the agent prompt's first bash block, and
assert it took before allowing any edit:

```bash
if ! git merge-base --is-ancestor <BASE_SHA> HEAD; then
  git checkout -- graphify-out/ 2>/dev/null || true   # pre-commit hook dirties these and blocks the merge
  git merge --no-edit <BASE_SHA> -m "merge: recover the intended base" || exit 1
fi
git merge-base --is-ancestor <BASE_SHA> HEAD || exit 1
test -f <a file that only exists on the target branch> || exit 1   # the real proof
```

The merge is content-safe when the stale tip's parents are already ancestors of the target — verify
with `git rev-list --parents -n 1 <stale> ` then `git merge-base --is-ancestor` per parent, and
confirm with `git diff --stat <BASE>..<branch>` showing only the plan's own files before merging back.

Other things that bite in the same setup, all needed in the prompt:
- Worktrees have **no `node_modules` and no `.env.local`** (both gitignored) so typecheck/lint/test
  all fail. **Symlink** `node_modules` from the main checkout — never `bun install` in a worktree,
  which risks a second copy of `cve-core` (see [[project_bun_dual_cve_core_store]]).
- Branch names are `worktree-<runid>-<n>`, which does NOT match the `worktree-agent-*` allow-list
  the generic gsd-executor pre-commit assertion expects. Use a protected-ref **deny-list**
  (main/master/staging/develop/detached) plus "toplevel != main checkout" instead.
- Forbid `git stash` in parallel worktrees — `refs/stash` is shared and corrupts siblings.
- Ban `bun run build` / full `bun run test` / `graphify update` in parallel agents: concurrent
  suites contend on `tmmaf_pg` and graph rebuilds race on one output dir. Gate once after merging.
- Cleanup must be **manifest-scoped** to the branches the agents reported, so a broad sweep never
  destroys a live worktree.
  **Update 2026-08-09: the repo is now down to ONE worktree — the main checkout.** All 18 others
  (incl. the long-lived Federation Platform ones) were audited and removed; `.claude/worktrees/`
  and `~/Projects/nvim/wt/` no longer exist. Any new worktree is one this session created, so
  treat the "12 long-lived worktrees" warning above as historical.

Related: [[feedback_ultracode_gsd_plan_execute]], [[project_gsd_roadmap_verb_miscount]].
