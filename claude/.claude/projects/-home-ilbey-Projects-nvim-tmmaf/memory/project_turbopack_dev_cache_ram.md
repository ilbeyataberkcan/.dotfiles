---
name: project_turbopack_dev_cache_ram
description: next dev RSS tracks .next/dev cache SIZE — 5.3GB cache = 8.1GB idle before compiling anything; clear .next
metadata:
  type: project
---

**Measured 2026-08-07 on the 16GB box.** Turbopack's dev persistent cache is resident at
startup, so `next dev` idle RSS tracks `.next/dev` on-disk size almost linearly:

| `.next/dev` | idle RSS (nothing compiled) | after 5 routes |
|---|---|---|
| 5.3 GB | **8125 MB** | OOM territory |
| cleared | **1292 MB** | 5351 MB |
| 4.9 GB (staging) | **3951 MB** | 6142 MB peak |

**It is NOT branch-specific** — staging reproduced the same 5–6GB curve over the same routes.
A branch's module-graph delta of ~2% cannot produce a 6GB swing. Suspecting feature code here
wastes hours; **measure idle RSS against `du -sh .next/dev` first.**

Fix: `rm -rf .next`. Second effect is inherent: ~700MB per route compiled, never released.

**Also proven the same day (do not re-litigate):** symlinking a worktree's `node_modules` to the
main checkout BREAKS TURBOPACK BUILDS — first "cannot find next/package.json / set turbopack.root",
then a hard panic "Invalid file type Directory" with per-entry symlinks. A worktree needs a real
`bun install`. That symlink was NOT the RAM cause though — the RAM problem reproduced with a real
install. See [[project_workflow_worktree_forks_origin_main]].

Beware `head -3 | grep "use client"` for directive detection — this repo's doc comments quote
`'use client'` constantly, so it yields false positives. Parse past leading comments.
