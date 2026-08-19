---
name: feedback-shared-tooling-scope-agnostic
description: Shared tooling must be use-case agnostic and parameterized by its caller — never bent to fit a second consumer
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6b92de7a-b465-4df9-8bb0-a894b36cdb15
  modified: 2026-07-31T12:55:38.368Z
---

When a second consumer needs an existing utility, **do not extend the utility with the new
consumer's vocabulary**. Extract a public, use-case-agnostic component whose arguments and
parameters are supplied by each caller.

Stated by the operator 2026-07-31 when the plan was to add an `'event-start'` member to the pricing
module's `TierBoundSchema` anchor enum so a consent deadline could reuse it:

> "Such tool components should be agnostic of its use case or scope and should be implemented as a
> public component that its arguments and parameters provided by the use case. You can export the
> private resolver but just be sure you don't make this an untangleable knot."

**Why:** an anchor enum naming `opens`/`close` encodes *pricing's* world. Adding `event-start` to it
makes every future consumer a member of pricing's vocabulary, and the module accumulates unrelated
concerns until nothing can be changed safely. Exporting a private helper is fine; coupling two
domains through a shared enum is not.

**How to apply:**
- Generic module takes a **caller-supplied named anchor map**, not a fixed enum.
- The generic module imports **nothing** from either consumer. Both depend on it; it depends on
  neither. If that ever inverts, the extraction failed.
- Re-express the original consumer on top of it with **no behaviour change and no persisted-shape
  change** — already-stored payloads must still parse byte-identically.
- Exporting a previously-private resolver to enable this is acceptable and expected.

This generalizes: it is a standing preference, not a one-off for date bounds. Compare with the
opposite direction in [[project_review_loop_gated_design_tool]] — mechanism belongs in the
package/shared layer, policy in the caller.

Related: [[feedback_fix_properly_system_wide]], [[feedback_architecture_before_tests]],
[[project_phase253_athlete_consent_parental_authority]]
</content>
