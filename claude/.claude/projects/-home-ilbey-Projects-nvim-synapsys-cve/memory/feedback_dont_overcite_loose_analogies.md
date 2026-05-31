---
name: feedback-dont-overcite-loose-analogies
description: "Don't cite another package or component as \"already does this\" when the use case is materially different"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 35018667-17a6-4972-9746-3556f3689131
---

When defending or proposing a design, only cite a precedent as "already proven" if its USE CASE shares the load-bearing properties of the proposal.

**Why:** Loose analogies disguise a proposal as "already validated" when its actual merits and tradeoffs are unexplored. The user pushed back hard on a Studio citation that I used to defend the variant-resolution flip in Phase 20: I claimed "Studio already does this" because Studio uses `applyDiff` before passing trees to a client renderer. But Studio's case is editorial choice + pre-fetched data + parallel rendering of multiple variants — none of which match a page route's runtime URL resolution + single-active-variant + DB-publishedness-check flow. The user called it out as "completely different."

**How to apply:** Before citing example X as precedent for proposal Y:
1. Name the load-bearing properties of Y (e.g., "runtime URL parsing," "DB lookup at request time," "single active variant," "publishedness validation").
2. Check whether X actually shares those properties. Same library call (`applyDiff`) used in a different scenario is NOT the same pattern.
3. If X only partially matches, either drop the citation or name the differences explicitly ("Studio uses `applyDiff` but for a different reason — editorial preview, not request-time resolution").

Related: [[feedback-honest-recommendations]] (don't defend with weak arguments), [[feedback-check-priors-terse-output]] (verify alignment before stating).
