---
name: project_planning_reconciliation_260726
description: "2026-07-26 /gsd:health pass — ROADMAP/STATE were 2 milestones stale; phases 8-19 marked shipped, 20/21/22 added, staging fast-forwarded to the matchday tip"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5f29178f-9d35-4b75-a9a4-48a380caf105
  modified: 2026-07-26T15:13:36.114Z
---

`.planning/ROADMAP.md` and `.planning/STATE.md` had drifted ~5 weeks and two shipped milestones behind
disk. `gsd-sdk query validate.health` reported **healthy** the whole time — it validates file *presence*,
not whether the contents are true. Do not treat a green health check as evidence the roadmap is accurate.

**What was wrong:** the progress table listed phases 8–19 as "Planned 0/N" when all 12 had shipped
2026-07-08 (42/42 plans + summaries, executed in per-phase worktrees `gsd/phase-08`…`gsd/phase-19`);
STATE.md was pinned at phase 07.2 / 78% / last-activity 2026-06-22; the entire matchday run was absent
from the roadmap; `HANDOFF.json` + four `.continue-here.md` files pointed at long-closed phases.

**What was fixed:** 42 plan checkboxes flipped, progress table rewritten with git-sourced dates,
Federation Platform milestone marked ✅ SHIPPED, new milestone *Matchday Completion & Data Integrity*
added with phases **20** (matchday panels — BUILT, retro summary at
`.planning/phases/20-matchday-panels-build/20-SUMMARY.md`), **21** (design parity + E2E verification —
the open gap), **22** (identity-safe registrant import, promoted from quick task `260716-nvd`). Orphaned
handoff markers removed; the quick task's `.continue-here.md` was **kept** as phase-22 context.

**Known false positives — do not "fix" these:** `/gsd:health` reports I001 "plan without SUMMARY" for
`07.1-02`, `07.1-08`, `07.1-10`, and `07.2-10`. All four are closed-by-supersession (the abandoned
event-creation-flow plans), documented as such in ROADMAP.md. Also, `roadmap.analyze` names phase 20 as
`current_phase` because it has a summary but no PLAN.md files — the real active phase is 21.

**Why:** the operator asked for a stable starting point and an honest record. Marking matchday
"complete" because its sub-roadmap said "done" would have buried the actual gap — the operator's verdict
is that the panels are up but *their UIs are not designed and implemented well and nothing is verified
end to end*. Build-complete is not design-complete.

**How to apply:** when a GSD milestone runs outside `.planning/phases/` (as matchday and the federation
pack both did), record it in ROADMAP.md as it happens — the tooling cannot see work it has no directory
for, and the drift compounds silently. Related: [[matchday-design-implementation-milestone]],
[[tmmaf-stray-unmerged-branch-work]], [[project_registrant_import_admin]],
[[project_federation_platform_spec_pack]], [[gsd-roadmap-verb-miscounts]].
