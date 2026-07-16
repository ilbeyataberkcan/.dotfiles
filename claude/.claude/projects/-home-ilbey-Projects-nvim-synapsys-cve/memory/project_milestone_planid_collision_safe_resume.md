---
name: project_milestone_planid_collision_safe_resume
description: Archived-milestone commits collide with new-milestone plan IDs; execute-phase safe-resume false-positives on git-log grep
metadata:
  node_type: memory
  type: project
  originSessionId: 92b3695c-f574-470b-9045-eb41374e5a7d
---

Each new GSD milestone RESETS phase numbering to 1 (v1.3 archived → v1.4 Phase 1). So git history carries commits like `feat(03-05): ...` from an *archived* milestone's Phase 3 that collide with the *current* milestone's Phase 3 plan IDs (03-01…03-05).

**Why it matters:** execute-phase's `safe_resume_gate` runs `git log --grep="03-0N"` and finds those archived commits → false "production commits exist, SUMMARY missing → stop before dispatch" signal. It is NOT real prior work.

**How to apply:** confirm freshness by the *artifact*, not the git grep — check the current phase dir for `*-SUMMARY.md` (init `summaries: []`) AND that the plan's declared new file is absent on disk (e.g. v1.4 03-01's `member-soft-delete-roundtrip.test.ts`). The archived commits' *content* (unrelated feature) is the tell. Related: [[project_synapsysintegrated_deprecated]], [[project_execute_phase_worktrees_off_and_env_bridge]].
