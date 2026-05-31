---
name: project-cve-payment-safe-default-reference
description: cve-payment-processing@0.1.0 is the workspace reference implementation of the safe-default webhook-ingestion architecture; no bypass path exists.
metadata: 
  node_type: memory
  type: project
  originSessionId: 68dade9f-cf86-4f34-9fdb-1d7c457fc893
---

`@synapsys-integrated/cve-payment-processing@0.1.0` is the canonical reference shape for safe-default webhook ingestion across the CVE workspace.

**The architecture:**
- `MailProviderDriver` analog: `PaymentProviderDriver` has mandatory `verifyWebhookSignature(rawBody, signatureHeader): { eventId, rawEvent }` + `normalizeProviderEvent(verified): NormalizedPaymentEvent`.
- Stripe driver at `packages/payment-processing/src/providers/stripe/driver.ts:165-177` implements `verifyWebhookSignature` by delegating to internal `verifyStripeSignature` helper (uses `stripe.webhooks.constructEvent`; throws typed `PaymentSignatureError` on failure).
- `PaymentService.ingestProviderEvent` (line 558 of `packages/payment-processing/src/service.ts`) calls `driver.verifyWebhookSignature` INTERNALLY before any normalization or audit/state mutation. **No bypass path exists.** The only public entry to ingest a webhook is through the verify-checkpoint above.
- `verifyStripeSignature` is internal-only (not re-exported from the `./providers/stripe` subpath). External consumers don't need it because the driver path IS the public surface.

**Why:** Discovered during Phase 22 SPEC scoping when user asked whether the Stripe provider bypasses the webhook check. Inspection confirmed no bypass.

**How to apply:**
- When designing webhook-ingestion APIs in new CVE packages (or refactoring existing ones), follow this shape: `Service.ingestProviderEvent(rawBody, signatureHeader)` is the public surface; mandates `driver.verifyWebhookSignature` internally; no `ingestVerifiedEvent`-shape bypass unless the package explicitly needs a tests/edge-flow escape hatch (and even then, use the `_Unsafe` suffix convention per [[feedback-unsafe-suffix-for-escape-hatch]]).
- cve-mail's Phase 22 work is bringing cve-mail UP to this standard, not the other way around. Do NOT propose changes to cve-payment-processing's webhook surface as part of the cve-mail work.
- For Phase 28 (cve-payment Cold-Start), the existing `ingestProviderEvent` path is the surface to exercise — no architectural fix needed.
