---
name: project_gsd_resolve_model_ids_omit_trap
description: "GSD's resolve_model_ids \"omit\" silently forces every agent to sonnet, overriding model_profile entirely"
metadata: 
  node_type: memory
  type: project
  originSessionId: 6d3dd75b-25b7-4f52-9991-0d90157486f4
  modified: 2026-07-29T22:29:55.379Z
---

`resolve_model_ids: "omit"` in GSD config short-circuits model resolution **before** `model_profile`
is consulted — every agent resolves to `sonnet` regardless of profile. It is set automatically at
install for non-Claude runtimes; on Claude it is always wrong. Found 2026-07-30 in tmmaf, where
`model_profile: "quality"` had been inert for the whole project.

**Why:** GSD workflows pass `model="{planner_model}"` from init JSON straight to `Agent()`, so the
bad resolution reaches every spawned agent. Symptom is invisible — agents run, just on the wrong model.

**How to apply:**
- Check with `gsd-sdk query init.plan-phase <N>` and read `planner_model` / `executor_model` /
  `checker_model` / `verifier_model`. All `"sonnet"` on a `quality` profile means this bug.
- Fix: `gsd-sdk query config-set resolve_model_ids false` (`false` emits the alias `"opus"`, which
  tracks current Opus; `true` pins the catalog's stale `claude-opus-4-7`).
- `models.<phaseType>` is **inert** in the installed SDK (`get-shit-done-cc` 1.42.3) — only
  `model_overrides.<agent-name>` works. Do not rely on the phase-type block.
- Even a working `quality` profile maps *verification* to sonnet by design (`gsd-plan-checker`,
  `gsd-verifier`), so per-agent pins are required to honour [[feedback_model_effort_ponytail_matrix]].
- `~/.gsd/defaults.json` carries the same `"omit"` — new projects inherit the bug until it's fixed there.
- **Reasoning effort is not configurable in GSD** for the Claude runtime (catalog entries carry only
  `model`; `reasoning_effort` is Codex-only). Effort must be set at spawn time, and only the
  `Workflow` tool's `agent()` accepts an `effort` param — the plain `Agent` tool does not.
