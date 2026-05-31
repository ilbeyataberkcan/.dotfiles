---
name: phase23-architectural-correction
description: Phase 23 W9/W10/W11 plans are corrupted — 22.5-FINDINGS § 9 itself documented the wrong direction. Full design correction lives in plan file.
metadata: 
  node_type: memory
  type: project
  originSessionId: 95c401f4-9643-4dfc-abfe-2d5f7d7d6284
---

Phase 23 (cve-auth Cold-Start Layer) W9/W10/W11 plans, as written in commit `0eac034`, are wrong: they direct host route handlers to call `betterAuth.api.*` directly with the literal phrase "No cve-auth indirection." That violates the 22.5 driver-delegation contract. The corruption traces upstream to 22.5-FINDINGS § 9 ("Phase 23 resume readiness") which documented the wrong architectural direction.

**Why:** The user's locked architectural intent is that the host application talks to cve-auth's AuthService only (server + client + catch-all). cve-auth's drivers are the sole bridges to providers like Better Auth. The current plans + 22.5 § 9 contradict this.

**How to apply:** When resuming Phase 23 execution (W9/W10/W11):
- Do NOT trust the existing 23-09-PLAN.md / 23-10-PLAN.md / 23-11-PLAN.md content as written. Treat as draft pending replan.
- Source of truth for the corrected design: `/home/ilbey/.claude/plans/wait-what-that-s-not-zippy-journal.md`. Captures: cve-auth@1.1.0 additive surface (8 ceremony delegators on AuthService + `handleHttpRequest` + agnostic `cve-auth/client` + `cve-auth/client/better-auth`), host migrations (4 server-side rewrites + import-path swaps + catch-all body + proxy gate), plan rewrites, and the 22.5-FINDINGS § 9 erratum requirement.
- The cve-auth additions are all ADDITIVE — no breaking changes to the 1.0.0 surface. Publish as 1.1.0.
- The host's lone BA carve-out remains `lib/auth.ts` (BA instance construction + plugins → BetterAuthDriver init). Everything else in the host imports only `@synapsys-integrated/cve-auth/*`.
- Re-plan must happen via `/gsd:plan-phase 23` with the draft plan as input. Verification loop checks against `23-SPEC.md`, `23-CONTEXT.md`, and the relevant 22.5 artifacts.

Wave restructure: a new W10 (plan `23-08-A`) ships the cve-auth@1.1.0 publish + host import-path migrations + 4 server-side rewrites + catch-all body. The existing W9/W10/W11 become W11/W12/W13. Plan count 12 → 13.

Related: [[project_cve_auth_redesign_paused_p23]] (the pause cause), [[project_cve_auth_redesign_locked_arch]] (the 3-driver lock), [[feedback_client_facade_driver_agnostic]] (the client-side pattern this correction adds), [[feedback_no_provider_type_reexports]] (the type discipline this enforces).
