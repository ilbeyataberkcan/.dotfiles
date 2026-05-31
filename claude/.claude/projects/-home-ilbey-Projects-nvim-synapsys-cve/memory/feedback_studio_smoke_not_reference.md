---
name: apps/studio-smoke is not a reference example
description: Do not cite apps/studio-smoke as a precedent or pattern for new work in the CVE project — it is a Playwright test scaffold, not an architecture reference.
type: feedback
originSessionId: f3680a58-9a98-4c47-a4f3-72b0c745efd8
---
When proposing patterns, scripts, CI wiring, or app shapes for the CVE project, do NOT use `apps/studio-smoke` (or `scripts/smoke-studio.js`) as a reference precedent or "this is how we do it here" example.

**Why:** `apps/studio-smoke` exists for a single narrow purpose — providing a Playwright test capability that doesn't require authenticating against the real host application each run. It is a test scaffold, not part of the canonical architecture. Citing it as a pattern misleads future work into copying a one-off shape that was never intended to generalize. The user explicitly flagged this on 2026-05-03 during Phase 8 discuss, after I cited `scripts/smoke-studio.js` as precedent for a new root enforcement script.

**How to apply:**
- Look elsewhere when searching for canonical examples: `packages/auth/` (facade pattern, driver injection, subpath exports), `packages/components/` (RSC schema sibling pattern, registry), `packages/core/` (ORM-agnostic contracts).
- If considering `apps/studio-smoke` as a model, stop and pick a different anchor.
- It is fine to *modify* `apps/studio-smoke` when scope explicitly requires it (e.g., milestone-scope smoke tests), but do not cite it to justify new patterns elsewhere.
- The user's recommended-approach acceptance for the GATE-03 CI script (bun grep script + new verify.yml workflow) was correct on its merits, not because of the smoke-studio precedent — re-derive future justifications from the actual canonical packages.
