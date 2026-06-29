---
name: project_phase72_catalog_renormalization
description: "Phase 7.2 re-normalizes the category catalog + re-models registration per a new operator backend spec; supersedes 7.1's denormalized model"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4e40c6f7-cb3b-40d5-bc3a-00039a199350
---

Phase 7.2 (INSERTED 2026-06-21) = **full re-normalization** of the event category system, from an operator-provided backend spec, replacing the denormalized model [[project_phase71_plan]] shipped. 7.1 was closed at its shipped/verified state (catalog CRUD, eligibility funnel, per-class payment, level-gated approval, category-edit all built); its unfinished **admin event-creation flow** was folded into 7.2 (it was blocked by the cve-core engine's lack of an object/json step-field — [[project_cve_core_flow_field_model]] — for per-class payment bindings).

**The re-model (operator-chosen, framed as new Phase 7.2):**
- Catalog: normalized `discipline` / `branch` (carries `min_level`) / `age_category` (per discipline, nullable max_age) / `weight_class` (FK→age_category, gender enum, **nullable `branch_id` override** = shared-vs-branch-specific) — replaces flat `class_definition`+`weight_division`.
- Event side: `event_discipline` (+`payment_definition_id`, per-discipline) / `event_branch` / `event_weight_class` join tables — replaces `event.applied_weight_division_ids` uuid[] array. **Payment moves class→discipline, which RESOLVES the object-step-field blocker** (≈3 disciplines, engine-safe per-discipline binding).
- Registration: **one row per category** (`athlete_id`,`event_id`,`branch_id`,`weight_class_id`,`status`,`payment_status`, DB `unique`) — retires the array-overlap event association (no eventId FK was the 7.1 hack). Biggest rewire: approval (per-WD jsonb → per-row), payment summing, category-edit.
- Eligibility: re-order the EXISTING pure `lib/eligibility/` funnel to **Discipline → Branch → Age → (Gender × Weight) → Level** (level stays approval-staged); reuse matchers; source `min_level` from `branch`.

**Authoritative spec + full reconciliation delta:** `.planning/phases/07.2-catalog-re-normalization-registration-re-model/07.2-SPEC-INPUT.md` (verbatim operator DDL + acceptance criteria + host-mapping notes).

**Sequencing (operator directive — "I design UIs, you prepare infra in the meanwhile"):** backend/infra is UI-independent → do it FIRST (schema + migrations + re-seed + funnel re-order + query/server-action layer); flow + UI wiring lands once operator UI designs arrive. Migration posture: pre-launch ([[tmmaf-prelaunch-live-db-readonly]]), clean re-seed via new migrations is fine (not a reset, [[feedback_never_reset_db]]); agents author migrations, operator runs db:migrate ([[project_tmmaf_drizzle_migration_ops]]); payment FK is cross-schema (uuid + raw ALTER). Honor host text-NOT-NULL enum convention over the spec's `create type gender` unless load-bearing. Host-only flow wiring (no cve-package edits).

**STATUS (2026-06-22): PLANNED & VERIFIED — ready to execute.** Ran the GSD pipeline (research → Nyquist VALIDATION → planner → plan-check → revision → re-check PASSED iter 2). **11 plans across 9 waves (0–8)**, all R72-01..R72-11 covered. NEXT: `/gsd:execute-phase 7.2` (fresh context). Wave map: W0 test stubs+migrate 6 array-model tests → W1 domain.ts schema → W2 migration SQL 0013/0014/0015 **+ manual `_journal.json` entries** (or `drizzle-kit migrate` skips them — the checker's "use drizzle-kit generate" hint was WRONG; tmmaf hand-authors, verified from 0011/0012) → **W3 ⛔ operator runs `bun run db:migrate`** → W4 seed + eligibility funnel re-order (incl. known-level application-stage pre-filter, R72-05) → W5 registration per-line write → W6 the 27-file event_id read-path rewire + approval/payment → W7 category-edit → **W8 event-creation flow (server actions done; step-UI gated on operator design)**. Two human checkpoints: W3 migration, W8 UI. Plans/artifacts in `.planning/phases/07.2-.../` (commits 066f888→1cc4198).
