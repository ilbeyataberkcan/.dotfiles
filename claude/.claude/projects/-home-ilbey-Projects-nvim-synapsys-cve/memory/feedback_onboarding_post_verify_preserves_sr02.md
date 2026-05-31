---
name: feedback-onboarding-post-verify-preserves-sr02
description: "Auth onboarding happens POST identity-verification, not at the sign-in input stage — preserves SR-02 silent enumeration"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0645c899-476a-4e96-b88b-f310afefd7d1
---

In synapsys-cve auth flows, **the sign-in page asks for an email and sends a magic link unconditionally — no branching on account existence at that stage.** Onboarding (profile collection + passkey enrollment) only starts AFTER identity verification (i.e., after the user clicks the magic link).

The result is preserved SR-02 silent enumeration discipline: an anonymous visitor cannot learn whether an email is registered just by submitting it. The same generic "Magic link sent" copy is returned in both cases.

**Why:** User feedback verbatim (Phase 23 W6 correction, 2026-05-21):
> "ACtually account doesn't state exists doesn't move to onboarding. The login page gets and email address and magiclink acquired initiates the onboarding. This means the onboarding only starts after identity verification. It doesn't show anything to the user that the account doesn't exists."

This explicitly rejects the Stripe/Vercel/GitHub pattern where the email-input form branches based on whether the account exists — that pattern leaks enumeration. The synapsys-cve convention sides with the stricter security posture even at the cost of some UX friction (new and existing users see the identical magic-link-sent state).

**How to apply:**

1. **Sign-in page = single-stage minimal form.** Email input + "Send magic link" button. No `lookupAccountState` server action. No pre-verify existence check. The explicit "Sign in with passkey" button + conditional-mediation autofill ARE allowed — they query the local credential store, not the server's user table.

2. **Onboarding belongs on `/welcome` (or equivalent post-verify route).** /welcome reads the session, then reads the user's full record (`cve_auth.users.name`, passkey count), then branches:
   - No name → render `OnboardingPrompt` host-block (collect name → server action saves → re-renders /welcome)
   - Has name + no passkey → render `PasskeyEnrollmentPrompt` host-block
   - Has name + has passkey → `redirect('/')`

3. **Server actions for post-verify state changes** (e.g., `saveOnboardingName(name)`) must verify the session before mutating user records. Per CLAUDE.md "Server Components first" + per the always-validate-at-boundary rule.

4. **Magic-link plugin creates the user record on first sign-in** if the email isn't registered. This is BA's default behavior and is what makes the unified flow work — the new-account path doesn't need a separate `signUp` call.

5. **Anti-pattern to avoid:** any `/sign-in` page that calls a server action returning `{ hasAccount: boolean, hasPasskey: boolean }` BEFORE sending the magic link. That action IS the enumeration vector. Captured as D-23-DEFER-08 (superseded).

Related: `project_phase18_ships_package_functionality_only`, `feedback_user_facing_pages_must_use_render_engine`, `feedback_research_use_case_before_demolition`. Also see `D-23-DEFER-07` (cve-auth should eventually ship an auth-proxy primitive so hosts don't hand-roll the proxy.ts gating).
