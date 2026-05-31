---
name: server-authoritative-client-gathers-requests
description: Authentication systems are always handled on the server; the client only reflects state and gathers/submits requests — never runs auth logic or auto-retries actions.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b5a86170-6cf8-4788-92a9-b38c4f596b21
---

In CVE (and any cve-auth-touching consumer), the auth/authorization authority lives on the server. The client's responsibility is bounded to: (a) reflecting current state via reads (e.g., session, available passkeys), (b) gathering user input (passkey ceremony response, OTP code, magic-link click), (c) submitting those inputs to server routes. The client never runs auth decision logic, never holds a queue of "actions to retry after auth," and never auto-replays sensitive operations.

**Why:** Splitting auth logic across server + client creates two sources of truth that drift; a client-side retry queue (e.g., "remember the action callback, replay it after step-up succeeds") couples auth UI with arbitrary action shapes and creates a coupling violation. The server already knows whether step-up is satisfied via its own state (the immutable `step_up_verifications` row); a fresh request from the client is sufficient to re-evaluate. Memory [[step-up-friction-guard-not-privilege]] is the security framing; this memory is the architectural framing.

**How to apply:**
- Step-up popup: it does NOT hold a callback to the original action. The calling component catches `AuthStepUpRequiredError`, mounts the popup, on success the popup unmounts, and the calling component (or the user's next click) re-submits the request. The popup is purely about completing the step-up ceremony.
- Don't propose client-side retry queues, action-callback threading through popups, or client-side authentication state machines that gate server requests on local conditions.
- Acceptable "client gathers" patterns: form input, button click, file upload, popup completion signal — anything that produces a fresh request the server fully validates.

Phase 07.2 instance: `<StepUpDialog>` exposes `onSuccess` / `onCancel` callbacks; the calling component decides what to do (typically: trigger its own re-render, which re-submits the form / re-attempts the mutation). No "action callback" prop on the popup.
