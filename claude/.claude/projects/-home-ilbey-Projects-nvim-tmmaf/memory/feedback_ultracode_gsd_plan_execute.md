---
name: feedback_ultracode_gsd_plan_execute
description: "Ultracode on GSD phases = one planning Workflow then one execution Workflow, gated on verified plans with all-severity findings fixed; executor prompts must carry ponytail full + graphify-first + cve-design-system + /impeccable"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1d3e3eca-24fe-4e36-aa71-fdb12b837372
  modified: 2026-07-27T04:01:58.404Z
---

When the operator says "ultracode" on a GSD phase, it means the **Workflow tool**, not ad-hoc Agent
calls: **one planning workflow, then one execution workflow**. Re-affirmed 2026-07-27 on phase 23.

**The gate between them is explicit.** The execution workflow may be launched *without asking again*
only once all three hold: (1) planning finished, (2) plans verified, (3) **all severity levels** of
the validation/verification findings fixed — not just blockers and majors (see
[[feedback_fix_all_severity_findings]]).

**Every executor prompt must carry, explicitly:**

- **`/ponytail full`** — the lazy-senior ladder (YAGNI → reuse → stdlib → native → installed dep →
  one line → minimum), root-cause fixes, deletion over addition, `ponytail:` comments for deliberate
  simplifications. See [[feedback_model_effort_ponytail_matrix]] for the model/effort staffing.
- **`/graphify` first** — `graphify query|explain|path` before any grep sweep or speculative read;
  raw reads only for a known file, or for `../synapsys-cve` (not in the graph).
- **`cve-design-system` is mandatory for any UI**, plus the `/impeccable` toolset to raise fidelity.
  The operator's reason is organizational neatness: host-local one-off UI fragments the system.
  Reuse DS primitives and tokens; a gap any host would hit is fixed in the package, not the host.
  Ties to [[feedback_design_tokens_no_hardcoded]] and [[feedback_no_hairline_outlines]].
- A hard ban on comments that narrate what the code obviously says.

**Why:** the operator wants depth and parallelism on hard phases but will not re-authorize each stage,
and has been burned by executors that raw-browse, over-build, or hand-roll UI outside the design system.

**How to apply:** author the execution workflow so operator-gated steps (`db:migrate`, package
publish, Stripe dashboard changes, `git push`, design fidelity sign-off) are **handoff points, not
agent tasks** — see [[project_tmmaf_drizzle_migration_ops]] and [[feedback_bitwarden_ssh_agent]].
The operator remains the design fidelity gate ([[feedback_visual_analyzers_weak]]).
