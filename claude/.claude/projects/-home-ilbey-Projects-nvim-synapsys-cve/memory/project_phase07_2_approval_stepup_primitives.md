---
name: phase07-2-approval-stepup-primitives
description: "Phase 07.2 ships TWO sibling primitives in cve-auth/react — ApprovalDialog (per-request guard) and StepUpDialog (TTL-cached, passkey-first with email-OTP fallback)."
metadata: 
  node_type: memory
  type: project
  originSessionId: b5a86170-6cf8-4788-92a9-b38c4f596b21
---

cve-auth's React surface gains two UI primitives in Phase 07.2, paired but distinct:

**`<ApprovalDialog>`** — lightweight client-side guard for sensitive-but-not-step-up-required actions. Fires every time the user requests the action (no caching — explicit consent gesture per invocation). Three-part body shape: `name` (title/action name), `summary` (short description + impact + warnings), and footer buttons (Approve/Cancel). Caller supplies all text via props (props named `name` + `summary`).

**`<StepUpDialog>`** — fires when a server action throws `AuthStepUpRequiredError`. On mount, attempts WebAuthn passkey ceremony automatically IF a passkey is enrolled. If no passkey available, or ceremony fails/cancels: shows two buttons at top — "Authenticate with passkey" (WebAuthn retry) + "Use email OTP". After successful verification, server records the verification row; the verification is cached for the level's TTL (5min purchase / 1hr admin / 24hr general per `DEFAULT_STEP_UP_TTL_SECONDS`), so the same user/session/level doesn't re-prompt within that window.

**Why:** Operator clarification 2026-05-28. Approval ≠ step-up; the original roadmap framing "warning popup" was wrong UX. Approval is host-driven (every dangerous click) and stateless; step-up is server-validated and TTL-cached. Two primitives, one phase.

**How to apply:**
- Both ship from `packages/auth/src/services/auth/react/` (sibling of `UserMenu.tsx`).
- Self-contained — no cve-components peer dep (preserves cve-auth's current zero-cve-components hierarchy; UserMenu precedent at `packages/auth/src/services/auth/react/UserMenu.tsx`).
- ApprovalDialog never imports `cve-auth/client` (it's pure UI; submits nothing on its own — caller decides what `onApprove` does).
- StepUpDialog imports `cve-auth/client` for the step-up ceremony methods (passkey + email OTP); server is the auth authority per memory [[server-authoritative-client-gathers-requests]].
- The "warning popup if user lacks privilege" path from the original roadmap goal is NOT a third primitive — that's just `AuthUnauthorizedError` surfaced via the host's existing error UI.
