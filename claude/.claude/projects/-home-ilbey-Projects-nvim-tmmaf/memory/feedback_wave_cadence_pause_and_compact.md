---
name: feedback_wave_cadence_pause_and_compact
description: Per-wave working cadence — ultracode Workflow for the wave, /gsd-pause-work + a compaction prompt at every wave boundary
metadata:
  type: feedback
---

The operator wants a **fixed rhythm at every wave boundary**, not ad-hoc check-ins:

1. **Run the wave as an ultracode `Workflow`**, not as inline solo work and not as ad-hoc `Agent`
   calls. This is `CLAUDE.md` rule 1 + the ultracode convention. Doing a wave solo was called out
   explicitly: *"you are not using the ultracode workflows for the waves... That's not good."*
2. **`/gsd-pause-work` at the end of every wave**, so a failure can resume from exactly that point.
   Not only when asked — regularly.
3. **Recommend the pause/clean point yourself.** The operator clears context between waves and wants
   to be told when it is safe.
4. **Hand them a compaction prompt** when carrying context forward is more useful than clearing:
   a paste-ready summary they feed to `/compact` so the next stretch starts well-briefed rather than
   blank.

**Why:** long milestones outlive a context window. Losing the ruling log or the discovered
anti-patterns mid-milestone is far more expensive than the tokens spent writing them down.

**How to apply:** finish wave → full gate → `/code-review` → fix ALL severities → commit in logical
units → `/gsd-pause-work` → say "safe to clear here" or hand over a compaction prompt. Before
planning any wave, check what already ships (see [[project_tsu_check_prior_art_per_wave]]).

Related: [[feedback_ultracode_gsd_plan_execute]], [[project_gsd_execute_phase_wave_workflow_recipe]],
[[feedback_two_review_passes_not_one]], [[feedback_fix_all_severity_findings]].
