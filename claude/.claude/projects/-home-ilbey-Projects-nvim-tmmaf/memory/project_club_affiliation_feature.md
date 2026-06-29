---
name: club-affiliation-feature
description: Club affiliation (athlete↔club) implemented 2026-06-24; migration 0021 + reseed (reg flow v18 / welcome v5) pending operator db:migrate; UNCOMMITTED
metadata: 
  node_type: memory
  type: project
  originSessionId: 777c6fd0-f737-4f94-82c4-b4fd46cc22c5
---

Athlete club affiliation, implemented 2026-06-24 (UNCOMMITTED). Single-select type-to-search-or-create combobox + a pinned "Ferdi" system option (= unaffiliated).

Design decisions (non-obvious):
- The unused `clubs` role-stub in `tmmaf_federation` (migration 0000: id/user_id/created_at, zero refs) was REPURPOSED into a central catalog: id, name, created_by (nullable FK→users set null), created_at, updated_at + unique index on lower(name). Migration `db/migrations/0021_clubs_and_affiliation.sql` (TRUNCATEs the empty stub, renames user_id→created_by, adds columns, creates `athlete_club_affiliation` join table with cross-schema FK to tmmaf_identity.athletes).
- Affiliation is a JOIN TABLE `athlete_club_affiliation` (not an array column on athletes) — operator's call ("cleaner"). Single-select = replace-on-save (0 or 1 row); Ferdi = no row. Multi-club ready.
- Name-based find-or-create resolved SERVER-SIDE (client sends the typed/picked name; server matches case-insensitively, creates only if new). Logic in `lib/clubs.ts` (findOrCreateClubByName / setAthleteClubAffiliation / getAthleteClubName / searchClubsByName); `lib/clubs-actions.ts` exposes `searchClubs` (auth-gated typeahead only — no client-side create).
- cve-components has NO combobox (v10.5.0 = static Select); forked `lib/admin/components/MultiSelectCombobox.tsx` → `lib/components/ClubCombobox.tsx` (single-select). Flow island `lib/host-blocks/TmmafClubAffiliation.tsx` binds via useFlowContext().setInProgressInput('clubName',…) + reads fieldErrors['clubName']; registered `tmmaf-club-affiliation` in lib/registry.ts.
- Surfaces: registration flow identity step (covers account-creation + per-event application) AND welcome flow identity step AND /app/profile editor. Each declares `clubName` as a step `fields` entry so the cve-core `.strict()` per-step submit schema admits it. Persistence rides `persistAthleteProfileStep` (registration-profile-persistence.ts, shared by both flows). Registration prefill via injectV7 step-identity (`V7.clubAffiliation` → defaultClubName, committed value or saved club). Welcome has no injection seam → back-nav prefill not wired (single-pass onboarding, accepted).

PENDING operator steps (agents lack DATABASE_URL): `bun run db:migrate`; reseed `bun run seed:registration-flow && bun run seed:welcome-flow` (versions bumped 17→18, welcome 4→5); then Playwright E2E (create new club, match existing = no dupe, Ferdi = no row, profile edit, per-event prefill). Verified so far: typecheck, eslint, registration/welcome fixture tests + profile-update unit test. See [[project_per_application_doc_review_redesign]], [[project_tmmaf_drizzle_migration_ops]], [[feedback_client_is_dumb_reflection]].
