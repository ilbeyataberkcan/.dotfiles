---
name: project_date_format_lock
description: Turkish dd.mm.yyyy locked across all date inputs + display; new DateField/DateTimeField + tmmaf-date-of-birth flow island; reseed pending
metadata: 
  node_type: memory
  type: project
  originSessionId: 7b078b67-fbf9-4d57-9ef5-aafe2dbd4279
---

Locked every date to Turkish `dd.mm.yyyy` (datetime `dd.mm.yyyy HH:mm`), browser-locale-independent (2026-06-26).

**Display** — new central `lib/format-date.ts` (`formatDate`/`formatDateTime`, Intl tr-TR + Europe/Istanbul, naive `yyyy-mm-dd`/`yyyy-mm-ddTHH:mm` formatted from parts to avoid TZ day-shift). `lib/email/layout.ts` `formatDateTR`/`formatDateTimeTR` now delegate (was long-form "22 Haziran 2026"). Routed ~10 inline sites through it (registration-step-data, PasskeyManager, InProgressTable, RegistrationListCard, ApplicationReviewDialog, EventsListClient, EventDraftsClient, get-event-creation-flow, doc-display.formatValidUntil, UserDocumentsPanel.formatValidity). KEPT per user: month-tile badges (HAZ/26) + `EventSelectionGrid:54` full-date (already dd.mm.yyyy, UTC-consistent w/ its badge) + CSV/JSON export ISO (xlsx already dd.mm.yyyy via numFmt).

**Inputs** — native `<input type=date|datetime-local>` can't be locale-forced, so replaced with new `lib/components/DateField.tsx` + `DateTimeField.tsx` = Radix Popover (already installed) + react-day-picker@10 (NEW dep; Turkish via `tr` locale + Intl, NO date-fns). Masked gg.aa.yyyy typing + calendar; emits ISO; `name` prop renders a hidden input for native FormData. Swapped in TmmafEventBasics (datetime), TmmafDocuments/DocumentManager/RegistrationDocumentUpdate/UserDocumentsPanel/TmmafAthleteOnboarding/TmmafIdentity (date). Calendar CSS via `@import 'react-day-picker/style.css'` in app/globals.css.

**Flow DOB** — the LIVE "Doğum tarihi" was a cve-components `flow-input` `type:'date'` node (package-rendered native, locale-dependent). Replaced with new `tmmaf-date-of-birth` island (registered in lib/registry.ts) reading the engine-seeded `inProgressInput.dateOfBirth` (FlowOrchestratorNode seeds declared fields → no injector/V7 change needed) and republishing via setInProgressInput; the step's declared `dateOfBirth` text field is unchanged. Fixtures: **registrationFlow v20→21, welcomeFlow v7→8** → SEEDED via `bun run seed` (registration|21 + welcome|8 inserted, 2026-06-26; idempotent, version-bumped, never reset [[feedback_never_reset_db]]). Seeder script is `bun run seed`, NOT `db:seed`.

Verified: typecheck + lint (clean) + targeted fixture tests pass (bumped version assertions to 21/8) + graphify update + dev server HTTP 200. PENDING: full `next build` (dev server was up — [[feedback_no_build_while_dev_running]]) + visual locale-lock check (set browser en-US). UNCOMMITTED. Overrode [[feedback_minimal_change_native_inputs]] per explicit user request to lock the format.
