---
name: Workspaces only when parallel work is actually happening
description: For v1.1 phases on synapsys-cve, don't spin up a /gsd-workspace worktree until a sibling phase is also in flight. Single-phase work continues on the main checkout.
type: feedback
originSessionId: b706fafd-7a0d-4592-938b-8c7fc7cbf855
---
For the v1.1 milestone (phases 10-19) on synapsys-cve, do NOT create a `/gsd-workspace` worktree for a phase when no sibling phase is concurrently running. Single-phase work proceeds on the main checkout against a phase branch directly.

**Why:** The parallel-coordination machinery in `.planning/v1.1-PARALLEL-COORDINATION.md` and `.planning/v1.1-PARALLEL-EXECUTION-PLAN.md` exists to isolate *concurrent* phases (peak = 3 sessions). When only one phase is active (e.g. P10 right after P9 merged), creating a worktree adds bootstrap overhead — coordination-file row updates, separate `.planning/` snapshot, branched-from-SHA tracking — for zero isolation benefit. The user explicitly course-corrected after I created a worktree for P10 alone.

**How to apply:** When the user invokes `/gsd-workspace --new` for a v1.1 phase, first check the coordination file's "Active sessions" / "Eligibility snapshot". If the phase has no sibling currently `running`, ask whether they actually want a worktree or whether they intend to work on the main checkout. Workspaces are appropriate at step 2+ in the schedule (P11+P12 onward), not step 1 (P10 alone).
