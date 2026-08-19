---
name: project-workflow-structured-output-fanin-trap
description: "Workflow agent({schema}) that fans N items INTO one structured object truncates and blows the retry cap — partition the schema per item"
metadata: 
  node_type: memory
  type: project
  originSessionId: f13d6298-2df3-471a-93be-8c91cb396902
  modified: 2026-07-31T16:20:22.591Z
---

A Workflow `agent()` call with a `schema` that must carry **one entry per item across a large fan-in**
will truncate its JSON at max output tokens, fail schema validation on the missing tail key, retry, and
die on `StructuredOutput retry cap (5) exceeded`. It burns the full agent runtime each attempt.

Hit on 2026-07-31 planning phase 25.3: one adjudicator asked for `{plan_fixes: [{plan, instructions[]}]}`
across **16 plans** of edit instructions. Every attempt died on
`must have required property 'plan_fixes'` — the object was cut off before the key closed. 33 of 34
agents had already succeeded; the whole run aborted at the fan-in.

**Why:** fan-OUT is free (N agents, N small outputs). Fan-IN through a single structured object is
bounded by one response's output budget, and schema validation is all-or-nothing — a 95%-complete JSON
scores the same as an empty one.

**How to apply:** when a structured result would carry one entry per item, do not collect it in one
agent. Partition it — `parallel(ITEMS.map(id => () => agent(promptFor(id), {schema: SMALL})))` where the
schema describes ONE item, and route the inputs to each agent in plain JS rather than asking a model to
do the routing. Cap list-valued fields in the schema description ("at most 12; merge rather than
exceed"). Reserve single-call structured output for genuinely small results — a verdict, a count, a
handful of issues.

Recovery is cheap if the failure is late: `Workflow({scriptPath, resumeFromRunId})` replays every
unchanged `agent()` call from cache, so editing only the failing phase re-runs only that phase. Edit
the persisted script file in place — do not resend the script, and do not touch anything above the
failure or the cache prefix breaks.

Related: [[feedback_ultracode_gsd_plan_execute]], [[project_workflow_worktree_forks_origin_main]]
