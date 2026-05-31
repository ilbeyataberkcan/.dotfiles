---
name: Phase 13 cve-payment-processing has 4 manual verifications deferred to host integration
description: Re-surface these checks when the host app first wires PaymentService — not before. Mentioned 2026-05-11.
type: project
originSessionId: f749ab54-f263-4c64-9338-d3e898081b3e
---
Phase 13 (cve-payment-processing) shipped with `autonomous: false` plan 13-09 reaching its declared human-verify checkpoint. User approved verification but explicitly flagged: host-application-dependent checks must be re-surfaced when host integration begins, since no host exists at this point in the project timeline.

**Why:** The package is headless; the four deferred checks all require a running host app + outbound network + (for Stripe) test-mode credentials and a tunneling tool. They can't be exercised against the package alone.

**How to apply:** When a phase wires `PaymentService` into a host (e.g., synapsysintegrated, or any later CVE consumer-app phase), open `.planning/phases/13-cve-payment-processing/13-VALIDATION.md` → `## Manual-Only Verifications` and walk the 4 rows:

1. **Stripe test-mode end-to-end** (PAY-11) — create → 3DS challenge → webhook → settlement → refund against Stripe test mode. Needs `STRIPE_SECRET_KEY` + ngrok / cloudflared tunnel for webhook reception. Result documented in `packages/payment-processing/CAPABILITY-MATRIX.md`.
2. **Iyzico shape validation against live API** (PAY-12) — reviewer reads `13-RESEARCH.md` §6 and confirms each Iyzico lifecycle state maps to seam state without extension fields.
3. **Industry-neutrality reviewer pass** (GATE-06) — human judgment on archetype-distinctness of the three worked examples in DOCS-02.
4. **Admin capability checklist completeness** (PAY-13) — reviewer answers YES for every row in DOCS-02 admin checklist; no `// TODO add method for X`.

User signal phrase: "tests are not available at this point since there are no host application … keep the human tests up and remind me when the integration to the host application is up."
