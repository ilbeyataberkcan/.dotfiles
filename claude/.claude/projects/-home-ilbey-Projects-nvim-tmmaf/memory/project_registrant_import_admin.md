---
name: project_registrant_import_admin
description: "Admin participation-sheet import UI (in applications board) — engine extracted from CLI; IMPLEMENTED, uncommitted, unverified-live"
metadata:
  node_type: memory
  type: project
  originSessionId: 542d3403-8cfa-4577-8d82-b1153d0541a9
  modified: 2026-07-26T15:12:51.064Z
---

Bulk "registrant import" for admins — digest a federation participation .xlsx (LİSTE + "kulüp sayısı") into PENDING registrations for an event. Built 2026-07-09, UNCOMMITTED, typecheck-clean, engine validated on the real file, NOT yet live-driven.

**Lives INSIDE the event-management applications (pending-approvals) board**, NOT a separate page (user directive) — "Katılımcı İçe Aktar" button next to `ExportButton` in `get-staff-confirmation-module.tsx renderStaffConfirmationBoard`. Event already in context (eventId).

**Engine** `lib/registrant-import/engine.ts` — extracted from `scripts/import-participation-sheet.ts` (which is now a thin CLI wrapper over it; kategori-parser MOVED there from scripts/lib): `parseListeWorkbook(buffer)` → `resolveCatalog(eventId, disciplineKey, rows)` → `commitImport({eventId,groups,clubCities,actor,actions,authService,createInvites})`. Structured returns (errors/warnings arrays, no globals/console). commitImport is DI (actor/actions/authService params) — CLI injects bootstrap-admin + step-up-off; admin action injects `resolveCurrentActor()`/`getUserManagementActions()`.

**Two engine improvements over the CLI original:** (1) `-`/`–`/`—` = "not provided" for AKART/LEVEL/LİSANS (real file uses `-` pervasively → dropped errors 220→~10 genuine); (2) `ensureBaselineStorageRole(userId)` per created user (imported athletes can upload docs). Registrations minted `status:'pending'`, `paymentStatus:'unpaid'`, AWAITING_APPROVAL, assignmentState NULL (athlete-applied), so they land in the normal review queue.

**Model facts:** identity = (name, club), NO email/TC/phone match (user said skip). Name-only row → athlete needs gender+DOB (else skeleton user only). gender derived from KATEGORİ ("BÜYÜK ERKEK ELİT"=age+gender+tier); DOB sentinel '1900-01-01'; nationality 'TR'. Multi-discipline event needs a discipline pick (KATEGORİ has no discipline token).

**Files:** engine + kategori-parser (`lib/registrant-import/`), actions `lib/admin/actions/registrant-import-actions.ts` (preview + confirm; gate user:create + 'admin' step-up via `checkStepUp`; mirrors `confirm-event-registrations.ts`), dialog `lib/admin/components/RegistrantImportDialog.tsx` (template download → upload → dry-run preview → confirm → summary w/ copyable invite links; step-up retry mirrors ExportButton), template gen `toRegistrantImportTemplateXlsx()` in `lib/admin/export/spreadsheet.ts` + route `/api/admin/registrant-import/template`.

**Invites:** this format has no email column → all placeholder emails → manual /setup links (copy-all in summary). Auto-send toggle deferred until a sheet with emails exists.

**CRITICAL fix — admin session hijack:** admin `createUser` routes through Better Auth `signUpEmail`, and the host runs `emailAndPassword.autoSignIn:true` + `nextCookies()` (lib/auth.ts:204/336) → it OVERWRITES the admin's session cookie with the new user's session (bulk import left the admin logged in as the LAST athlete). Fixed with `lib/admin/preserve-admin-session.ts withPreservedSession()` (snapshot `.session_token`/`.session_data` cookies, restore after) wrapping commit in BOTH registrant-import actions AND `dispatchCreateUserTerminal` (host-flow-actions) — the regular create-user flow had the same latent bug. CLI never hits it (no request cookies).

**Crash fix — "Cannot read properties of null (toString)":** exceljs `.text` getter throws on merged/empty cells whose value is null (my template's title band). Guarded via `cellText()` in engine; validated on a merged-band file.

**Single-add:** `parseSingleRow` + `addSingleRegistrant` action + "Tek Sporcu" dialog tab (default mode) — 3 dropdowns compose KATEGORİ, reuses resolveCatalog+commitImport. Shared `buildSheetRow` now backs both bulk + single.

**Other:** LEVEL cap 1–4 REMOVED (any positive int; real file now 355 rows/7 genuine errors); AÇIKLAMA header kept (the "1" was a typo in the user's file); club region country defaults 'TR' (TmmafClubAffiliation, matching personal region); summary invite links now full/selectable + per-link & copy-all with feedback.

**PROMOTED TO ROADMAP PHASE 22 (2026-07-26):** the identity-hardening follow-up (quick task `260716-nvd`, plan committed `22e94f7`, 0/3 tasks executed) is no longer an orphaned quick task — the operator confirmed it is still wanted, so it is now **phase 22 — Identity-Safe Registrant Import** in `.planning/ROADMAP.md`, context at `.planning/phases/22-identity-safe-registrant-import/22-CONTEXT.md`. It **replaces the (name, club) identity model above** with a mandatory normalized 9–12 digit national ID as the sole grouping/lookup key. Two integration deltas: the plan's migration must be renumbered **0046 → 0047** (0046 went to matchday's `draw_setup_and_seeding`), and the unique index must not run until duplicate national IDs + duplicate running owner/event flows are resolved manually (fail-loud preflight, never auto-merge). External blocker on tasks 2–3: the non-atomic `cve-auth` invite-claim sequence must be fixed upstream first — a host-side workaround is forbidden by the plan.

**OPEN:** invite controls on the user DETAILS page — package `UserDetailRoute` has NO host slot (invite links render only in UsersTable), so needs a host-wrapped detail page or a cve-user-management update; users table already has per-row copy/reissue. Live end-to-end drive still pending. Phase 4 (manual single athlete→event assignment) queued. See [[project_weigh_in_referee_portal]], [[project_registration_category_model]], [[project_create_user_cve_core_split]].
