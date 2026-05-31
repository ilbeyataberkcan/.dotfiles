---
name: Prefer git worktrees over child-repo clones for parallel work
description: For parallel phase work in the same repo, default to git worktrees, not separate clones — even when wrapper tools (gsd-workspace) offer both.
type: feedback
originSessionId: d8789fe0-f215-4e77-9023-ecec3a9e78af
---
For parallel/concurrent work in this repo (and similar same-repo, same-remote setups), default to `git worktree add` — not full repo clones / child repos.

**Why:** User explicitly rejected the clone strategy: "these are very well be handled by branches and worktrees." Same `.git` store, seconds to create, all branches PR back to `origin/main` — clones add no isolation that worktrees don't already provide for this workflow.

**How to apply:**
- When suggesting parallel session setup for a multi-phase milestone, lead with `git worktree add` commands, not `git clone` or `gsd-workspace --strategy clone`.
- If using `/gsd-workspace --new`, pass `--strategy worktree`.
- Only suggest a clone when there's a real reason: untrusted fork, different remote, evaluating divergent history.
