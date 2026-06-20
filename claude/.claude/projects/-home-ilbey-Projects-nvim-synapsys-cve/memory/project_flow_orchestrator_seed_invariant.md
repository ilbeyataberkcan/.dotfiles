---
name: project_flow_orchestrator_seed_invariant
description: "FlowOrchestratorNode must seed inProgressInput from the mounted step's fields only, never the whole accumulated_state"
metadata: 
  node_type: memory
  type: project
  originSessionId: b75c36d8-a3ef-4a41-9a28-8017f0098a40
---

`FlowOrchestratorNode` (cve-core/flows) seeds its client `inProgressInput` (the
per-step typing bag sent as the next strict submit) by SLICING `initialState` to
the mounted step's declared field names — NEVER the whole bag. The host mounts it
with `initialState = row.accumulated_state` (the full cross-step store, all it
has); seeding the whole bag pushes cross-step keys (e.g. `verifiedEmail`,
`payment_attempts`) into a step that never declared them, and the server's
`buildStepSubmitSchema(...).strict()` rejects them → `ZodError: Unrecognized keys`.
Invisible until you resume-mount onto a step whose strict schema excludes
already-committed keys (the post-payment registration landing was the first such
path).

The slice uses `restoreStepFieldValues` — the SAME function the server `transition()`
uses on back/re-entry — which lives in `packages/core/src/flows/runtime/walk-helpers.ts`
(the anti-drift module) so client mount-seed and server submit share ONE definition.
Do NOT reintroduce a second copy of "what fields does this step declare". Fixed
2026-06-02 (commit 942916a2); regression test in orchestrator-multistep-walk.test.tsx.
Related: [[project_runtime_always_validate]], [[feedback_never_work_around_root_cause]].
