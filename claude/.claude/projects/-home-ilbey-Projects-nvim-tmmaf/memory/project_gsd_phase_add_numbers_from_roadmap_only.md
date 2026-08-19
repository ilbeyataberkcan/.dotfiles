---
name: project_gsd_phase_add_numbers_from_roadmap_only
description: "gsd-sdk phase.add numbers from ROADMAP.md alone, so it proposes a number a milestone directory already owns — check .planning/<milestone>/ first"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9cf9af0e-4032-474f-ba3d-ec6befc6b524
  modified: 2026-08-13T05:53:12.747Z
---

`gsd-sdk query phase.add "<desc>"` finds the highest integer phase **in `ROADMAP.md`** and returns
max + 1. In tmmaf that is wrong: `ROADMAP.md`'s phase details stop at **29** (Delegated Payment),
while the active milestone's phases **30–43** are specified in
`.planning/tournament-day-operations/` (SPEC.md / PLAN.md / DECISIONS.md) and never got roadmap
entries.

So on 2026-08-13 it proposed **"Phase 30"** for a new phase, colliding with tournament-day-ops
phase 30 (`tdo-w0`, already shipped and tagged). Two different "Phase 30" would have broken every
later reference. Corrected by hand to **44**: renamed the created directory, rewrote the roadmap
entry, and left a numbering note in both `ROADMAP.md` and `STATE.md`.

**Why:** the SDK has one source of truth and this project has two. `STATE.md`'s `progress.total_phases`
(48) does not match `ROADMAP.md`'s visible phases either, which is the same divergence from a
different angle — see [[project_gsd_roadmap_verb_miscount]].

**How to apply:** before accepting any SDK-proposed phase number, list `.planning/` for milestone
directories and check the phase span they own. Number a new phase of the ACTIVE milestone by
continuing that span, not by continuing `ROADMAP.md`. Verify afterwards with
`ls .planning/phases/` — a directory whose prefix already exists is the tell.

Related: [[project_phase44_operator_test_session_fixes]], [[project_tournament_day_operations_milestone]].
