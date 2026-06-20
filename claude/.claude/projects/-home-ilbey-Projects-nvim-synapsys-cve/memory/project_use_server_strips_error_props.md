---
name: project_use_server_strips_error_props
description: "Next.js 'use server' error serialization strips custom Error own-properties — banner text must be returned as data, not thrown"
metadata: 
  node_type: memory
  type: project
  originSessionId: ffa89335-492e-46f8-910f-1d2b5576e6ee
---

Next.js reconstructs a **plain `Error`** on the client when a `'use server'` action rejects: it keeps `.message` only in **dev** and **strips every custom own-property** (a `controlled = true` class field does NOT survive); in **production** it redacts `.message` entirely to a generic string + `digest`. Live-proven 2026-06-02 with a Playwright probe against `apps/cve-test-host` demo flow — server logged `{ controlled: true, digest }` but the client banner showed the generic fallback.

**Why:** Phase 07.6 WR-04 first gated verbatim banner display on `err.controlled === true` (commit `eacf34f0`). That mechanism is unimplementable across the boundary, and it silently suppressed the host's intended messages too. Superseded by `de2d80a7`: `advanceErrorMessage` in `FlowOrchestratorNode.tsx` now ALWAYS returns a neutral message for any thrown failure (no Zod/SQL/driver leak).

**How to apply:** Never rely on a thrown error carrying a user-safe marker or message to the client. User-facing guidance is delivered as DATA on the response (the flow engine uses `renderInstruction.fieldErrors`, rendered inline) — RSC data is not subject to error redaction. Throwing is only for the fail-safe neutral banner. Relates to [[feedback_server_authoritative_client_gathers_requests]] and [[project_phase07_6_flow_uat_remaining]].
