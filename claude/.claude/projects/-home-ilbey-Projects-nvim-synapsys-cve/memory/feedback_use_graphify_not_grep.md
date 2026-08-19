---
name: feedback-use-graphify-not-grep
description: "Codebase questions go through graphify, not grep sweeps — repeatedly corrected"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 41155c0b-bf35-4b65-a27a-81fae562f1fa
  modified: 2026-08-18T19:39:19.950Z
---

Answer codebase questions with `graphify query "<question>"`, `graphify path "<A>" "<B>"`,
`graphify explain "<concept>"` — not grep/find sweeps. `graphify-out/` exists in BOTH
`synapsys-cve` and `tmmaf`. Use `graphify-out/wiki/index.md` for broad navigation and
`GRAPH_REPORT.md` only for whole-architecture review. Run `graphify update .` after changing code
(AST-only, no API cost).

**Why:** the user has corrected this several times. The graph already encodes the relationships a
grep sweep reconstructs badly and slowly, and grep misses call-graph and cross-package edges
entirely. Reaching for grep after being told is the thing that annoys them, not the tool choice in
isolation.

**How to apply:** before any "where is X / what uses Y / how does Z work" question, run graphify
first. Reserve grep for mechanical text checks where the answer is a literal string and the file is
already known — a forbidden-token gate, a version literal, confirming a specific edit landed.
`.planning/` is out of graphify scope in tmmaf.

Related: [[feedback-check-priors-terse-output]]
