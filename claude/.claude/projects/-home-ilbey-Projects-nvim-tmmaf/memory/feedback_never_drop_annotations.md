---
name: feedback_never_drop_annotations
description: Never drop/collapse review-feedback annotations — distinct content is never skipped, and identical content on different targets must each be addressed per-target
metadata:
  node_type: memory
  type: feedback
  originSessionId: 2b34fa58-2e9f-4c0f-b947-d5b1587a3840
---

When processing the operator's review-feedback annotations (and ANY batched feedback), do NOT dedupe or
collapse them away. Two rules, both absolute:
1. **If the contents are NOT identical → never skip.** Every distinct note is its own item; address each.
2. **If the contents ARE identical but the TARGETS differ → don't skip the targets.** Apply the fix to
   EVERY targeted element/specimen individually, not once-and-call-it-done.

The operator caught workflow agents (and my summaries) silently grouping things like #2-#5 (same "bolder
buttons" note, different button targets) or "this applies to all other X" prose into a single fix — that
DROPS coverage. The annotation DATA is safe in `app/review/review-feedback.json`, but the FIXING must be
per-annotation / per-target. The PASS-TOOL "fan-out to siblings" affordance (axis chips + edit-from-sidebar
work) exists partly to turn "applies to all other X" into structured per-sibling annotations — use that
mindset: enumerate the siblings and address each.

**Why:** operator directive 2026-06-08 — "you are dropping some of my feedbacks. If the contents are not
identical don't ever skip them. If the contents are identical but the targets are different don't skip
those targets." Collapsing feedback loses real coverage and erodes trust in the loop.

**How to apply:** when a fix workstream says "applies to all other <component>", expand it to the explicit
list of every matching specimen/target and fix each; never report a cluster as done when only the
representative was handled. Relates to [[project_review_loop_gated_design_tool]], [[feedback_fix_properly_system_wide]].
