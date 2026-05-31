---
name: feedback-research-use-case-before-demolition
description: "ROADMAP / SC text is not a demolition order. Before proposing to remove or refactor existing infrastructure, research its actual use case and prior-phase decisions; the SC may have a different intent than the literal reading."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 695d2b81-3a47-46ac-8c5c-8d03f86252cc
---

When a SC reads like "no parallel X" / "consolidate to canonical Y" / "retire Z", do NOT pre-commit to ripping out the existing code in the discuss/spec phase. First:

1. Search the codebase for who actually calls / depends on the targeted code.
2. Read the prior-phase decisions that introduced it — there is usually a real use case (e.g. host-less preview, test-time isolation, infrastructure-only seam) that the SC author may not have meant to demolish.
3. Reconcile: the SC might be satisfied by a less aggressive change (extracting a shared core, adding props for the new capability, gating with a flag) instead of removal.

**Why:** P18 incident — I told the user "SC#3 mandates retiring `ClientRenderEngine`" as a major deliverable. The user corrected: `ClientRenderEngine` exists for **client-side preview rendering without an established host application** (local tests, host-less editor previews). The SC's "no parallel renderer" intent is about *locale-aware page rendering consistency*, not about scorching the host-less preview path. P15 and P17 had already established that the codebase ships infrastructure and host apps configure — `ClientRenderEngine` is infrastructure for the "no host yet" case.

**How to apply:**
- In `/gsd-spec-phase` and `/gsd-discuss-phase`, when a SC sounds destructive, the first research bullet is "what does the targeted code currently serve?" — not "how do we replace it?"
- Surface the use case to the user before locking the replacement plan; let them confirm or relax the SC's literal scope.
- Relates to [[feedback-check-priors-terse-output]] (check priors) and [[feedback-archetypes-are-illustrative-not-contract]] (don't take labels as contracts).
