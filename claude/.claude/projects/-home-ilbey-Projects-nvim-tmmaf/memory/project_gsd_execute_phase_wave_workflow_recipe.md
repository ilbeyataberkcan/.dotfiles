---
name: project_gsd_execute_phase_wave_workflow_recipe
description: "The working recipe for driving a large GSD phase as one ultracode Workflow per wave — worktree boot block, per-wave integrate agent, per-plan adversarial verify"
metadata: 
  node_type: memory
  type: project
  originSessionId: 61f06968-536d-475b-aaa1-35af144eef98
  modified: 2026-07-31T21:10:12.643Z
---

Proven on tmmaf phase 25.3 (2026-08-01): 16 plans, 5 waves, 3 repair passes, 90 commits, zero lost
work and zero bad merges. The shape that made it work:

**One Workflow per wave, three phases inside it** — `Execute` (N plan agents in parallel, each
`isolation: 'worktree'`, small per-agent schema) → `Integrate` (ONE agent, no isolation, merges the
wave's branches onto the working branch, runs typecheck + the full suite, removes worktrees by exact
path) → `Verify` (one adversarial agent PER PLAN, `parallel()` with a small schema each). Never
collect a per-plan result in one fan-in agent — see
[[project_workflow_structured_output_fanin_trap]].

**`args` arrives as a STRING, not an object.** Start every script with
`const A = typeof args === 'string' ? JSON.parse(args) : args`. Without it the first `.map` throws
and the run dies before any agent starts.

**The worktree boot block is mandatory and must be the agent's first tool call** — worktrees fork
from `origin/main`, not HEAD ([[project_workflow_worktree_forks_origin_main]]). Assert the branch is
not a protected ref, assert `--show-toplevel` is not the main checkout, merge the real base, then
**prove it took by testing for a file that only exists on the target branch**. Symlink `node_modules`
and `.env.local` from the main checkout. When the base is a descendant of `origin/main` the merge
fast-forwards, so `rev-list --count BASE..HEAD` reads 0 — that is success, not a failure to merge.

**Prefix every agent commit with `GRAPHIFY_SKIP_HOOK=1`** — the post-commit hook rebuilds the graph
and parallel worktrees race on one output dir. Refresh the graph once, from the main checkout, after
the last wave.

**Thread a `knownRed` + `knownTypecheck` list into every later wave.** Once an operator-blocked
failure exists, every downstream integrate agent needs to distinguish REGRESSION from EXPECTED or the
signal is gone by wave 3. Make the integrator state that classification explicitly in its result.

**Use the planner's frontmatter waves, not the SDK's recomputed ones** — `gsd-sdk query
phase-plan-index` re-derives waves topologically and moved a plan into a wave where its
`files_modified` collided with a sibling. The planner's assignment had zero intra-wave overlap.

**Checkpoint policy for an AFK operator:** auto-approve a `human-verify` whose only purpose is
eyeballing work the agent can verify itself; for anything needing a credential or an outward-facing
action (publish, migrate, deploy) forbid it explicitly, tell the agent to ship every task that does
NOT depend on it, and require the operator sequence verbatim in the SUMMARY. Telling plan 25.3-12
"do NOT write code against the unpublished API, leave that task unimplemented and return partial" is
what kept a 20-file plan from committing a second class of typecheck error.

**Partition lanes by FILE OWNERSHIP, not by requirement — and let the orchestrator own the shared
seams BEFORE the fan-out.** Proven on tmmaf TSU W2+W3 (2026-08-20): 9 lanes, 16 agents, ONE shared
worktree (no `isolation`), zero merge conflicts. Both waves had hotspots — `WeighInInstrument.tsx`,
`DrawReviewOverview.tsx` — that a per-requirement fan-out would have made three lanes fight over, so
each hotspot went to exactly one lane and the rest reported `crossLaneNeeds` instead of editing.
The two permission keys every lane needed were added by the orchestrator first, with anchored
`replace` + `count == 1`, so no two lanes owned that file. Chain a consumer lane behind its producer
with `.then()` inside `parallel()` rather than barriering the whole fan-out. Pre-assign migration
numbers per lane. **Forbid every lane from running the suite** — the integrate agent runs it alone,
which is what kept the not-concurrency-safe suite from producing phantom failures across two runs.
Then: integrate → adversarial review → fix → an INDEPENDENT `/code-review` in the main loop.
Verify every gate number with your own run before writing it into a handoff.

Related: [[feedback_ultracode_gsd_plan_execute]], [[feedback_model_effort_ponytail_matrix]],
[[project_phase253_athlete_consent_parental_authority]]
