---
name: pause-between-phase-workflows
description: "Always pause between discuss-phase → plan-phase → execute-phase. User starts each workflow in a fresh session. No auto-advance, no --chain, no auto-routing even when the trailing workflow would normally chain."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: cfbcd8b5-eabe-483f-906e-a60e3f3a475a
---

User pilots each phase workflow boundary explicitly with a fresh session. Discuss-phase finishes → STOP (don't route to plan-phase). Plan-phase finishes → STOP (don't route to execute-phase). Always wait for user to invoke the next workflow.

**Why:** Fresh-session-per-workflow keeps each context window focused; prevents stale state from leaking across workflow boundaries; gives the user a clean inspection moment between major commits. Extends the wave-pause discipline ([[pause-between-waves-proc01]]) to workflow-pause.

**How to apply:**
- After writing CONTEXT.md + committing: display the next-step hint as text only. Do NOT call `Skill(skill='gsd-plan-phase')` or otherwise dispatch the next workflow.
- After writing per-plan tasks + committing: same. Do NOT auto-advance to execute.
- If `--chain` or `--auto` flags are present, honor them (user is explicit opting in). Otherwise, the default is pause.
- Workflow files like discuss-phase.md include an `auto_advance` step that routes based on `--auto`/`--chain` — in their absence, the default is `confirm_creation` (text summary only). Phase 7 confirmed this matches user preference.

Related: [[pause-between-waves-proc01]] (wave-to-wave pause discipline for PROC-01 plan execution).
