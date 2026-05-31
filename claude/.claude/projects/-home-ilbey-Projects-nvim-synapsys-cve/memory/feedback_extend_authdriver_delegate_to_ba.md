---
name: extend-authdriver-delegate-to-ba
description: Step-up email OTP (and any feature BA already implements) — extend AuthDriver + delegate to BA APIs in BetterAuthDriver; never reinvent.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b5a86170-6cf8-4788-92a9-b38c4f596b21
---

When BetterAuth already implements a feature cve-auth needs (email OTP, passkey authenticate, account linking, etc.), the cve-auth shape is: extend the `AuthDriver` interface with cve-auth-vocabulary methods, then implement those methods in `BetterAuthDriver` by delegating to the BA plugin/API.

**Why:** BA is the source of truth for ceremony semantics, storage shape, and security defaults. Reinventing in cve-auth core duplicates code, drifts from BA's evolving security posture, and creates a parallel storage system that conflicts with BA's tables (e.g., BA's `verification` table for email OTP). Per memory [[cve-auth-redesign-locked-arch]] rule "varies-by-impl → driver, uniform → cve-auth core": OTP storage + algorithm vary by provider implementation → live in driver. Per memory [[cve-auth-no-provider-type-reexports]]: cve-auth's `AuthDriver` method shapes are CVE-owned (not re-exports), but the IMPLEMENTATION in BetterAuthDriver wraps BA calls 1:1.

**How to apply:**
- Before designing new persistence (tables, sub-drivers, generators): grep BA's docs/plugins for the feature. If BA has it, extend `AuthDriver` only.
- New AuthDriver methods are cve-auth-owned shape; BetterAuthDriver method body is a delegation wrapper around `betterAuth.api.*` / `auth.$context.internalAdapter` / plugin helpers.
- Never duplicate BA's storage in `cve_auth.*` tables for features BA already persists. The cve-auth `step_up_verifications` table is fine because it's cve-auth-owned policy state; transient codes belong to BA.
- Use the better-auth MCP (`mcp__better-auth__search_docs` / `get_doc`) to lock API signatures BEFORE writing the AuthDriver interface methods.

Phase 07.2 instance: AuthDriver gains `sendStepUpEmailOtp` + `verifyStepUpEmailOtp` + `verifyStepUpPasskey` (rename of `verifyStepUp` to disambiguate ceremonies); BetterAuthDriver wraps BA's `emailOTP.sendVerificationOTP` + `emailOTP.verifyEmailOTP` + `passkey.authenticate`. No new cve-auth tables; no custom OTP generation; no `StepUpCodesDbDriver` sub-interface on `AuthDbDriver`.
