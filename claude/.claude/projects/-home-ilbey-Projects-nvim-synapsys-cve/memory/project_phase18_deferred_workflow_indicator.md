---
name: project-phase18-deferred-workflow-indicator
description: "Phase 18 intentionally does NOT wire cve-multilingual-workflow's WorkflowState indicator (draft → in-translation → ready) into Studio. It's a translator-coordination flag, not canonical page state. Surface when user asks \"what's left\" or \"what to improve.\""
metadata: 
  node_type: memory
  type: project
  originSessionId: 695d2b81-3a47-46ac-8c5c-8d03f86252cc
---

cve-multilingual-workflow ships a `WorkflowState` enum (`draft → in-translation → ready`) addressable per `(pageId, variantKey, locale)`. It was introduced by P12's implementing agent as a translator-efficiency indicator.

**P18 decision (2026-05-13):** NOT wired into Studio. Reasons:
- Not canonical for page state (publish state per-variant is already covered by `PageVariant.publishedAt`; canonical page state is the cve-core editorial cycle).
- Wrapper-layer convenience that should not drive Studio behavior.
- Would force a non-trivial snapshot-payload extension to persist an indicator that is not crucial for release at this point.

**Why:** User direction during P18 spec-phase Q3 round 1. "It is just an indicator." Avoiding scope creep into snapshot schema for a non-critical feature.

**How to apply:**
- If the user asks "what's left to improve / what did we defer / where could we go next?" — re-surface this. It's a candidate for a later Studio milestone or a follow-up phase under multilingual depth work.
- If a future phase plans to extend snapshot payloads, this indicator is a candidate to ride along.
- Do NOT silently add WorkflowState wiring to Studio without explicit user authorization — that's regressing this decision.

Related: [[project-phase13-deferred-host-verifications]] (similar "remember to re-surface" pattern).
