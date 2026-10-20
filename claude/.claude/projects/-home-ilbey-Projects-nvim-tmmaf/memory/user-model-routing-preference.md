---
name: user-model-routing-preference
description: "Which model to use for which subagent work — Fable 5.1 for real tasks, Opus 5 only for simple exploration chores; the main agent plans and verifies itself"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7d934e1b-2ede-4813-b944-504e1ac92aa6
  modified: 2026-09-03T22:35:02.141Z
---

Use Fable 5.1 (the inherited default) for implementation and deep investigation agents. Route only
very simple codebase-exploration chores to Opus 5 (`model: 'opus'`). Never delegate the reasoning
and planning: the main agent synthesizes, decides the plan, and spot-checks agent results itself.

**Why:** Stated by the user on 04.09.2026 mid-workflow: "Use Fable 5.1 for the tasks. You use
Opus 5 for very simple codebase explorations. But check the results yourself too … do the
reasoning and planning yourself."

**How to apply:** In Workflow/Agent calls omit `model` for task agents; set `model: 'opus'` only
for grep-and-list style chores. After every agent report, verify the load-bearing claims against
the code before acting on them. See also [[tmmaf-test-baseline-needs-docker]].
