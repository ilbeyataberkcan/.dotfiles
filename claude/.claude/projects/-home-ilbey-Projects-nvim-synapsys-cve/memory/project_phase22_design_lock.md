---
name: project-phase22-design-lock
description: "Phase 22 cve-mail Cold-Start Layer SPEC.md locked 2026-05-20 — 14 requirements, ambiguity 0.08, mid-phase cve-mail@0.3.0 detour planned."
metadata: 
  node_type: memory
  type: project
  originSessionId: 68dade9f-cf86-4f34-9fdb-1d7c457fc893
---

Phase 22 SPEC.md is locked at `.planning/phases/22-cve-mail-cold-start-layer/22-SPEC.md` (committed `eea4012`).

**Adapter + persistence + locale:** Resend sandbox via `./providers/resend` subpath; Drizzle-backed `mail_events` / `mail_audit` / `mail_queue` / `webhook_events` tables; en + tr-TR localized templates.

**cve-mail@0.3.0 mid-phase detour publishes:**
- `MailService.ingestProviderWebhook(rawBody, signatureHeader)` safe default — delegates to driver-side `verifyWebhookSignature` (new optional method on `MailProviderDriver`)
- `MailService.ingestProviderWebhook_Unsafe(messageId, status)` escape hatch — caller-verified path
- Existing `ingestProviderStatus(messageId, status)` retained as `@deprecated since 0.3.0`
- `./providers/resend` re-exports `verifyResendWebhook` (svix peer-optional)
- `./providers/ses` re-exports `verifySnsMessage` (SNS-validator peer-optional)
- `./providers/smtp` docs note: N/A — SMTP has no webhook protocol (DSN bounce-back via IMAP)

**cve-payment-processing@0.1.0 baseline finding:** Already correctly architected — `PaymentService.ingestProviderEvent` mandates `driver.verifyWebhookSignature` internally with no bypass path (line 558 of `packages/payment-processing/src/service.ts`; line 165-177 of `packages/payment-processing/src/providers/stripe/driver.ts`). No symmetry-fix needed in Phase 22 or Phase 28; cve-mail is bringing itself UP to cve-payment-processing's standard, not the other way around.

**Webhook security (6 layers):** Cloudflare IP allowlist (production primary, documented as carry-forward only — not test-host code); Next application middleware (dev/test/portable fallback + reference pattern, IS wired in test-host); cryptographic Svix verify (via cve-mail@0.3.0 driver method); svix-id idempotency dedup at host; audit-on-reject; generic 401 error opacity; raw-body discipline via `await request.text()`.

**Why:** User signed off through 5 Socratic interview rounds. Ambiguity 0.08; all four dimensions cleared minimums.

**How to apply:** During Phase 22 discuss-phase / plan-phase / execute-phase, treat SPEC.md requirements 1–14 + boundaries + constraints + acceptance criteria as LOCKED decisions. Implementation HOW choices (wave ordering, migration timing, route structure, fault-driver authoring, locale content) are open. The per-detour publish cadence + branch discipline + bundle-isolation contract are non-negotiable.
