---
name: synapse-core-design-system-learn
description: PLACEHOLDER (build wave B4). Stage 9 closing module, Read-loaded by the parent. Append an L-format ledger entry and file skill-deltas so the skill self-improves. Not separately invokable; the parent pulls it in by path at the end of a run.
---

# learn — Stage 9, capture learnings (PLACEHOLDER)

> Closing module, Read-loaded by the parent at the end of a run. Not a top-level skill, and not an
> operator-invoked stage — a closing step in the pipeline. Wave B4 writes the real body.

**Responsibility.** Extract what generalized; file skill-deltas (a script that missed a leak, a gate
that let a mispaint through) so each lesson becomes an enforced gate next run.

**In → Out.** the run's operator deltas + observations → an appended L-format ledger entry.

**Scripts owned.** `scripts/learn/append-learning.ts`. Append via the script (fixed format); the
extraction of what-generalized is LLM judgment.

## Deterministic outputs
- An appended L-format ledger entry — gate G9 (ledger updated; every operator delta fixed or filed as
  a known limitation).
- Operator checkpoint **C9** (lightweight) on the skill-delta list.

## Nudge-knobs
- Which lessons rose to "generalized" vs "engagement-specific" (LLM judgment).

References: `../references/determinism.md`.
