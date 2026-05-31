---
name: feedback-boundary-check-before-recommending
description: "Before recommending a fix that touches workspace packages, check whose phase owns those paths and flag the per-phase ownership convention explicitly — don't latch onto \"get it green\" and quietly violate the boundary rule."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4ec8544f-a4f5-457b-8965-a20e25cfe838
---

When recommending fixes to CI / lint / test failures in a monorepo phase context, check the writable boundary for each file I'm about to touch BEFORE presenting the recommendation. If any fix would cross a sibling phase's `packages/<pkg>/**` territory, flag that explicitly as a scope/convention cost in the recommendation — never quietly bundle cross-phase edits under a "small fix" framing.

**Why:** During Phase 17 PR #10 (post-merge CI hotfix), I drafted a "fix all in PR #10" recommendation that included edits to `packages/payment-processing/**` (P13) and `packages/extensions/studio/**` (P18). The user had to stop me mid-stride and ask whether I was about to violate the boundary. I hadn't named the cost. The coordination file's "Only the row for your phase is yours to edit" rule is a real convention with real audit-trail consequences — slipping past it for pragmatic reasons should be a deliberate authorized override, not something the user has to catch.

**How to apply:**

1. When proposing a fix that touches a workspace file, identify which phase owns the path (per `.planning/v1.1-PARALLEL-COORDINATION.md` Boundary table + the convention that `packages/<name>/**` is owned by the phase that delivers that package).
2. If ALL files are in the current phase's writable boundary OR workspace-root (`turbo.json`, `package.json`, `.github/workflows/**`, root configs): proceed normally.
3. If ANY file crosses into a sibling phase's territory: surface that in the recommendation as an explicit cost line — e.g. "This touches P13's `packages/payment-processing/` territory (boundary override required)." Then offer at least one option that respects the boundary (split into a follow-up PR or scope down).
4. When the user authorizes a cross-boundary edit, document the override in the commit message ("Cross-phase edit authorized 2026-MM-DD: …") so the audit trail is honest.

Related: [[feedback_check_priors_terse_output]] (check priors before proposing); coordination file's per-phase ownership rule.
