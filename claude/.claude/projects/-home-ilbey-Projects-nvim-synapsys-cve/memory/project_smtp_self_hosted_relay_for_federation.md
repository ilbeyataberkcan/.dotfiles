---
name: project_smtp_self_hosted_relay_for_federation
description: "A federation project needs data-residency compliance, so cve-mail's SMTP driver (self-hosted relay) is the chosen path over Resend; driver now verified."
metadata: 
  node_type: memory
  type: project
  originSessionId: 1c1aec47-d60c-4f0c-8108-30e0bbbedf47
---

User has a federation project with **data-residency compliance** requirements: mail must traverse infrastructure they control, so the **cve-mail `./providers/smtp` driver against a self-hosted relay** (Postfix-style) is the chosen path, NOT Resend/SES API. User already has Resend wired separately for other contexts.

As of 2026-06-01, on branch `test/cve-mail-smtp-integration` (worktree `../synapsys-cve-smtp-test`), the SMTP driver was verified at wire-level parity with Resend:
- **Automated:** `packages/mail/src/providers/smtp/driver.integration.test.ts` — live in-process `smtp-server` + `nodemailer` + `mailparser`, runs in the default vitest suite, no Docker/network. The mocked `driver.test.ts` never opened a socket; this closes that gap. No driver bugs found (driver is correct; live test documented RFC 5322 display-name quoting the mock hid).
- **Visual:** `apps/cve-test-host` Mailpit sink (`mail:up`/`mail:preview` scripts, `axllent/mailpit:v1.30.1`, SMTP :1025 / UI :8025) renders all 8 templates for aesthetic review.
- **Better Auth integration PROVEN over SMTP:** the test-host now has a `MAIL_TRANSPORT=resend|smtp` seam — `lib/mail.ts` `getMailService()` → `buildMailDriver()` swaps Resend↔SMTP in ONE place; everything below `MailService` (incl. all BA callbacks: magic-link, emailOTP via `createCveAuthEmailOtpHandler`, verification, reset, invite) is driver-agnostic. `lib/env.ts` adds MAIL_TRANSPORT/SMTP_* (additive; RESEND_* still required to boot). `scripts/auth-mail-smoke.ts` drives `betterAuth.api.sendVerificationOTP` + `signInMagicLink` → confirmed both land in Mailpit (OTP w/ 6-digit code, magic-link w/ URL).
- **Production guide:** `packages/mail/docs/self-hosted-smtp-relay.md`.

**Still TODO for that federation project (separate repo, not the test-host):** (1) port the MAIL_TRANSPORT seam but make RESEND_* env vars CONDITIONAL (federation prod has no Resend account — test-host keeps them required only for boot symmetry), (2) wire the real relay transport with port 587 + requireTLS + secrets, (3) DKIM/SPF/DMARC/PTR at the sending domain, (4) build the host-side **DSN/IMAP bounce listener** that calls `MailService.ingestProviderWebhook_Unsafe(messageId, 'bounced', …)` — SMTP has no webhook channel, the single asymmetry vs Resend. See [[project_phase22_design_lock]] for cve-mail's webhook-ingest design.
