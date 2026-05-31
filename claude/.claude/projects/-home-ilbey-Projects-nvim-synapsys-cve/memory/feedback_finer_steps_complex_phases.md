---
name: feedback-finer-steps-complex-phases
description: "For phases with high architectural complexity (multi-package composition, detour publishes, fork decisions), waves must decompose into atomic per-commit steps the user can inspect without volume overwhelm."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 21cef440-0be3-440f-bf70-8f00e272dc8c
---

For phases that compose multiple packages or involve a fork decision mid-phase (Phase 23: Better Auth + cve-auth dual instantiation + Linux passkey discovery + @0.4.0 detour + 13 tables + 8 step-up sites), the Phase 22 D-22-A "5-wave with 3-5 steps each" shape is too coarse. The user needs per-commit step granularity to inspect changes without being overwhelmed by volume.

**Why:** When the architecture itself is being learned by integration (the cold-start mission of v1.2), step-level visibility is what makes pilfall capture and decision validation possible. A single 200-line wave commit hides the per-decision learning that PROC-01 is supposed to surface.

**How to apply:**
- Wave count expands (8-12 waves) when complexity warrants — waves become publish/release-significant checkpoints, not bundles of work
- Each wave decomposes into 3-8 atomic steps; each step = single focused commit with one verification gate (curl, UI pilot, or psql)
- Per-step volume: roughly one file create OR one focused edit, ≤50 lines new code typical, single migration per applicable step
- User-pilot pause points at every wave boundary AND at step-internal pivot points (decision-fork steps like "BA passkey works on Linux? swap path if not")
- Companion to [[feedback_pause_between_waves_proc01]] — that memory says pause at waves; this one says decompose waves finely enough that the pause is meaningful
- Do NOT use this for low-complexity phases (Phase 22 5-wave shape stays correct for that complexity tier)
