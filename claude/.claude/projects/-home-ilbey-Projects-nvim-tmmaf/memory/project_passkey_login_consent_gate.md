---
name: project_passkey_login_consent_gate
description: Direct email-step passkey login bypassed login-consent; fixed with a post-passkey consent dialog gate
metadata:
  node_type: memory
  type: project
  originSessionId: b3f857b6-50c3-4f2e-9904-34c23beda06f
---

**The hole:** on `/sign-in`, the identify (email) step arms conditional-mediation passkey
**autofill on mount** (`SignInForm.tsx` useEffect → `signIn.passkey({autoFill:true})`). A user who
taps their platform passkey from the browser autofill dropdown authenticates WITHOUT submitting the
consent-gated identify form → `recordLoginConsentClickAction` never fires → `bindLoginConsentNow`
finds no `login_consent_audit` row → they enter with **zero consent record** (KVKK gap). Password-step
passkey / password / magic-link are fine (identify submit is consent-gated first). `TmmafLogin.tsx`
(registration-login twin) has NO autofill, so it's unaffected. Google OAuth from identify has the
SAME bypass — left as a flagged out-of-scope sibling gap.

**The fix (host-only, no cve edit; IMPLEMENTED, UNCOMMITTED 2026-07-10):** intercept the autofill
`onSuccess` — if `agreementItems.length > 0`, open a blocking `Dialog` (cve-components) with the
reused `AgreementChecklist` instead of redirecting. Accept → `recordLoginConsentForUser('signin')`
(new server action in `lib/login-consent-actions.ts`, reuses `recordLoginConsentClick` +
`reconcileLoginConsentByUser`, email from `session.user.email`) → redirect. Cancel/escape/overlay →
`signOut()`, stay on /sign-in. **Federation rule: dialog shown on EVERY direct passkey login,
regardless of prior consent** (so no already-consented coverage check). typecheck+lint+build clean;
staging passkey test pending (can't drive platform passkeys headlessly).

**Where consents are audited:** `tmmaf_storage.login_consent_audit` (email-keyed, click-time) +
`signup_agreement_snapshots` (userId-bound) — both carry ip/user_agent/checksum(version)/accepted_at.
NO admin viewer (inspect via Drizzle Studio); user chose "just fix the gate". Related:
[[project_agreement_locations_and_ios_dob]], [[project_signup_agreements_and_seedkey]].

**Follow-up (userId-bound audit, IMPLEMENTED, UNCOMMITTED 2026-07-10):** federation wants EVERY
consent to record who (userId) consented. `login_consent_audit` was the only consent table with no
userId (email-keyed by design). Added nullable `user_id` (FK cve_auth.users, ON DELETE set null) +
index; `recordLoginConsentClick(...,userId?)` stamps it at write when authed (passkey gate passes
`session.session.userId`); `reconcileLoginConsentByUser` now also `UPDATE login_consent_audit SET
user_id WHERE email=… AND user_id IS NULL` at every identity boundary. Migration
**0043_login_consent_user_id** HAND-AUTHORED (sql + `_journal.json` entry, NO snapshot) — this repo
abandoned drizzle snapshots after 0010 (meta/ stops at 0010, journal has 43+), so `db:generate` is
unusable (bundles all post-0010 drift: clubs/reg_doc_review/matchday); hand-write .sql + journal is
the established pattern. 0043 also backfills existing rows by lower(email)→users. typecheck+lint+build
clean. **OPERATOR TODO: run `bun run db:migrate`** (agents author, operator applies; never db:push).
registration_agreement_snapshots (via registration_id) + legacy consent already userId-reachable — untouched.

**Deploy/debug learnings (2026-07-10):** login agreements (checklist + passkey dialog) only render when
`resolveAgreementsForLocation(loc)` finds a `files.status='ready'`, org-matched (`cve_auth.organization`
slug `tmmaf`), non-deleted PDF for a `federation-agreement` file type carrying that location. The deploy
**seeder creates file TYPES every deploy; PDF uploads are MANUAL and per-DB** — so an env can show the type
in admin (with signin location) yet render nothing because no PDF was uploaded there. Staging "dialog broken"
turned out to be exactly that: PDFs uploaded on live, not staging. Debug gotcha: operator's pgAdmin connects to
**live**, not staging — query staging via `docker exec -it $(docker ps -qf name=tmmaf-staging-db) sh -lc 'psql
-U "$POSTGRES_USER" -d "$POSTGRES_DB"'`. Deploy runs migrations automatically: `tmmaf-deploy <env>` →
`compose --profile tools run --rm migrate` (SHA-pinned `migrator-<tag>`) BEFORE rolling the app, under
err_return — so if the app rolled, the migrator succeeded. See [[project_tmmaf_drizzle_migration_ops]],
[[tmmaf-deploy-hostnames]].
