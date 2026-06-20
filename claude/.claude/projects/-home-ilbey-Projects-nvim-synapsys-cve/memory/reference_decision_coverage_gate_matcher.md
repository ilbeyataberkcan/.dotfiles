---
name: reference-decision-coverage-gate-matcher
description: How the GSD plan-phase decision-coverage gate matches D-NN citations (scans whole PLAN.md except <objective>)
metadata: 
  node_type: memory
  type: reference
  originSessionId: 2199f21f-2bcd-44b9-a46a-45aa6115a805
---

The GSD `check.decision-coverage-plan` gate (plan-phase Step 13a, BLOCKING) decides "covered" by word-boundary matching each `\bD-NN\b` token from CONTEXT.md's `<decisions>` block against the PLAN.md text — but it **excludes the `<objective>` block**. A decision cited only inside `<objective>` prose (e.g. "Build the inversion core (D-01/D-03/D-11)") counts as UNCOVERED. Citing it anywhere else — `must_haves.truths`, `must_haves.key_links` `provides:`, task `<action>`/`<acceptance_criteria>`, or any body section outside `<objective>` — counts as covered. Bare `D-04` works; the colon form `D-04:` is NOT required (the gate's "cite D-NN:" hint is misleading).

**Why:** confirmed empirically on Phase 07.6 — the planner referenced 15 of 20 decisions only in objectives, gate reported 5/20; adding one citation truth per plan tying it to its owned decisions → 20/20. The handler lives in the compiled SDK (not in `gsd-tools.cjs`/`gap-checker.cjs`, which is the separate Step 13e post-planning tool).

**How to apply:** when authoring/reviewing GSD plans, put `D-NN` citations in `must_haves.truths` or task bodies, not just the objective. If the gate fails with decisions you know are implemented, the fix is citation-placement, not re-planning. The separate Step 13e gap-analysis (`gsd-tools.cjs gap-analysis`) scans ALL of REQUIREMENTS.md against one phase's plans, so its "N of M not covered" is expected noise — trust the per-phase requirements gate + this decision gate instead. See [[feedback_verify_code_not_just_tests]].
