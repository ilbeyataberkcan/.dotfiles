---
name: project_email_templates_redesign
description: TMMAF email clean-replacement (quick 260624-26u) — shared layout system + redesign all transactional + wire gaps incl. payment-timeout P3; E1/E4 admin-triggered; E2/E3 deferred to cron; D4/O1/O2 not designed
metadata: 
  node_type: memory
  type: project
  originSessionId: 6a66a901-81b8-43d7-b63c-f64ddc56a5f4
---

Clean replacement of the ad-hoc transactional emails with one design system, from the `TMMAF email templates-handoff.zip` Claude-Design bundle (21 designed templates in `TMMAF Email Templates.dc.html`; brief at `docs/email-templates/EMAIL-DESIGN-BRIEF.md`). Started as gsd quick task **260624-26u** on `staging` (no worktree — parallel payment fix already merged).

**Scope decided with operator (2026-06-24):**
- BUILD + WIRE this pass: A1-A6 auth, R1-R4 registration, D1-D3 documents, P1-P3 payments, E1 published + E4 cancelled (admin-triggered broadcasts), O3 level-changed.
- **E2 (deadline) + E3 (weigh-in reminder) DEFERRED** — operator will wire them when cron is built properly. Don't build dead template fns for them now.
- **D4 (docs complete), O1 (bulk), O2 (export) NOT designed** in the HTML (in brief only) → out of scope.
- **P3 payment-timeout is the operator's emphasis.** Gap = `lib/payment.ts` settlement hook sends mail only on `paid`/`refunded`; the `failed`/`canceled` branch (closed-tab/`checkout.session.expired`→canceled from cve-payment-processing 10.2.0, session TTL 3600s) calls `failRegistrationFromSettlement` but sends NO athlete mail. Add P3 "Ödemeniz tamamlanamadı" with a retry URL there, idempotency-keyed.

**Mail-send architecture (operator directive 2026-06-24): ALL sends go through the registry as proper templated sends — no ad-hoc direct sends, no hardcoded overwrites.** Register every template in `buildTemplateRegistry()` (lib/mail.ts) via `bindTemplate(factory)` (+ optional Zod context schema = boundary validation); convert every `getMailService().send({...createXEmail(opts), idempotencyKey})` → `sendTemplate({templateId, locale:'tr', context: opts, sendOptions:{idempotencyKey}})`. Namespace: `cve-auth/*` = cve-auth-resolved (OTP + the new `cve-auth/invite` seam), `tmmaf/*` = host-resolved (everything else). Validated: cve-mail `MailService.sendTemplate` honors the registry (service.ts:442 resolve → :465 render → :489 sendInternal). **Invite (A1) correction:** cve-auth OWNS auth mail but its invite-send seam is MISSING (only email-otp-handler.ts:169 calls sendTemplate; no invite handler). Proper fix = a cve-auth invite handler mirroring the OTP one; per operator REGISTER `cve-auth/invite` now, DEFER the cve-auth send (also needs a redeem route that doesn't exist). The earlier "cve-auth calls createInviteEmail directly" was a fabricated sub-agent claim — it sends nothing.

**Mobile fix (2026-06-24, commit fddbb90) — the shell didn't shrink.** The card used `width="600";max-width:100%`, which does NOT shrink on mobile: the fixed 600px propagates up the nested tables so `max-width:100%` resolves against the expanded parent → every template overflowed a 360px phone by +272px. THE FIX = fluid card `width:100%;max-width:600px` + an Outlook MSO ghost table (`<!--[if mso]><table width=600>…`) for the desktop cap, + `word-break:break-all` on long unbreakable values (UUID applicationReference, Stripe intentId, definitionName). **LESSON: a full-page screenshot HIDES this** (it captures the un-shrunk 600px email and looks fine) — must measure `document.scrollWidth` vs viewport. `scripts/email-preview/check-overflow.mjs` (VIEWPORT env, default 360) is the objective gate; all 31 variants pass at 320+360. Harness sample data must use a REAL long UUID (short codes hid the bug). [[feedback_visual_analyzers_weak]]

**Fidelity rework (2026-06-24):** first build matched design loosely. Real gaps: categoryList was a 5-col table (mobile-overflow) → must be dot-joined STACKED CARDS (R1 2-line, R2 single-line+status); R2 needs partial-approval (approved GREEN + rejected NEUTRAL+Gerekçe blocks); E2/E3 never built. Render harness `bash scripts/email-preview/run.sh` (Firefox/playwright-core, 640+360) → verify shots YOURSELF (don't trust agent PASS).

**Architecture:** templates are plain fns returning `EmailMessage` ({to,subject,text,html}) with inlined HTML (the ad-hoc state). New home `lib/email/` (layout.ts shared shell+components, templates/<group>.ts, index.ts barrel). Inline-CSS + table layout, ≤600px, web-safe fonts, bulletproof buttons, plain-text counterpart per template, TR locale. Sent via `getMailService().send({...msg, idempotencyKey})` (audited cve_mail.mail_audit + idempotent cve_mail.mail_events).

**Key content fix (brief #1):** R1/R2 must show real per-category rows (discipline·branch·age·gender·weight), not the count placeholder `"N kategori"` in `lib/registration-terminal.ts` — needs a DB join over branch/weightClass.

**A6 welcome home:** `app/welcome/actions.ts` post-commit `created` branch currently mis-sends the PACKAGE `createRegistrationConfirmationEmail` — that's the real account-created moment; swap to the new welcome template.

**Deferrals discovered during build (operator follow-ups):**
- **A1 invite redesign BLOCKED** — cve-auth calls `createInviteEmail` from cve-mail INTERNALLY; the host `initAuth`/`UnifiedInviteConfig` seam has no template-override injection. The redesigned host `inviteEmailTr` exists in lib/email but is unwirable until a cve-auth/cve-mail package change exposes the override. (A2 verify, A3 magic-link, A5 reset-link DID wire — active BA seams.)
- **E4 event-cancelled BLOCKED** — the `EventLifecycle` union (lib/event-lifecycle.ts) has NO cancelled state (ready→applications_open→applications_closed→weigh_in→event_started→event_ended + archived soft-delete). `archived` ≠ cancellation; wiring E4 to it would misfire on every soft-delete. Needs a real `cancelled` state added first, then wire in changeEventStatus/bulkChangeEventStatus. Template built, send deferred.
- **E1 broadcast is INLINE (no queue)** — synchronous best-effort loop in publishEvent over all athletes (no discipline filter; athlete.disciplines often empty). A queued/cron broadcaster is deferred with E2/E3.

Related: [[project_payment_redirect_closed_tab_fix]] [[project_cve_core_flow_terminal_rendering]] [[feedback_visual_analyzers_weak]] [[project_registration_flow_is_signup]]
