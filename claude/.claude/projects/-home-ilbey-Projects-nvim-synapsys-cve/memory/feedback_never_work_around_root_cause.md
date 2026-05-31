---
name: feedback-never-work-around-root-cause
description: Never patch downstream packages to work around a bug whose root cause lives upstream. Fix at the root so siblings stop inheriting the same vulnerability.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 535d597b-2671-4822-8bfc-9bdd50e09e20
---

**Rule:** When a bug surfaces in a downstream package because an upstream package allowed a bad invariant through, fix the UPSTREAM package first. Downstream defensive patches are an anti-pattern — they leave the original vulnerability alive for every other consumer.

**Why:** The user has called this out repeatedly across phases. Patching only the visible symptom (e.g. studio-side `hasRemovedKeys` guard for a `computePropsDelta` → `applyDiff` round-trip bug) leaves cve-core silently dropping `undefined`-valued props through JSON serialization. Every other consumer of cve-core inherits the same broken round-trip. The user's standing position: "such fixes should be fixed at its core so other modules and packages won't get affected by it."

**How to apply:**
- When a fix is proposed, ask: "where does the invariant actually break?" — if the answer is an upstream package, the fix belongs there.
- If path-ownership forbids touching the upstream package in the current phase (see [[feedback_boundary_check_before_recommending]]), flag the boundary cost EXPLICITLY and offer the upstream fix as the preferred option even if it requires a follow-up coordination row.
- Pair the upstream fix with input validation at the boundary — if invalid values can flow in (e.g. empty-string node ids, undefined prop values that mean "remove"), make the validator reject or canonicalize them. Don't rely on downstream code to guess intent.
- Never frame a downstream patch as "the safer option" when the real motivation is scope avoidance — that's a workaround, not a tradeoff.
- Related: [[feedback_honest_recommendations]] (defend the upstream fix or admit the framing was wrong; no agreement-for-agreement's-sake).
