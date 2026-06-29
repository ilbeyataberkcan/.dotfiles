---
name: project_catalog_clean_slate_reseed
description: "Catalog seed: v4 stripped to MMA Amatör ONLY (2026-06-25, federation dropped UWW+Pro); reusable idempotent seedCatalog() now runs on EVERY deploy via scripts/seed-catalog.ts in the Dockerfile seeder; one-time purge via scripts/purge-catalog.ts"
metadata: 
  node_type: memory
  type: project
  originSessionId: 117c7a18-eb97-4723-9e60-205fa52ecdce
---

As of 2026-06-22 the operator chose a **clean-slate reseed** of the catalog. State:

- `lib/catalog/catalog-normalized.seed.ts` was emptied (v2) then **filled v3 (2026-06-22)** with the operator's federation list: **3 disciplines** (MMA Amatör, MMA Profesyonel, UWW Pankrasyon), **15 branches** (uniform Grappling/Light/Full/Elit/Profesyonel × 3, levels 1/2/3/4/4), **13 age categories**, **218 weight classes** (`branchKey: null`, see [[project_catalog_weight_scoping_model]]). Built from compact ladder strings + a pure `expandLadder` helper; validated strictly-ascending, one open class each, no dup boundaries.
- `scripts/seed-competition.ts` `seedDisciplines` now guards `if (DISCIPLINES.length > 0)` so an empty seed doesn't crash `.values([])` (branches/ages loop per-row; weights + event-joins already guarded).
- **One-time purge:** `scripts/purge-catalog.ts` — operator-run, **dry-run by default**, `--confirm` (or `PURGE_CATALOG_CONFIRM=1`) to execute. Deletes FK-safe: event_weight_class→event_branch→event_discipline→weight_class→age_category→branch→discipline (in one tx). **Aborts** if any `registration` references the catalog (branch_id/weight_class_id not null). Does NOT touch events/payments/athletes/registrations.
- **Runbook** (per env, dev→staging→live): dry-run → `--confirm` → verify in Drizzle Studio → `bun scripts/seed-payment-fixture.ts && bun scripts/seed-competition.ts`. Live is RW (shares staging pw); confirm no real registrations before --confirm (pre-launch). Cleaning rows is the operator's authority ([[feedback_never_reset_db]]); agent Bash has no DATABASE_URL ([[project_tmmaf_drizzle_migration_ops]]).

Not committed yet (operator workflow: inspect→commit). The catalog admin UI (plans 11–18) + the visual-fidelity restyle are also uncommitted in the working tree.

**Update 2026-06-25 — MMA Amatör only + deploy-wired seed.** Federation does NOT want UWW (or Pro) yet, wants MMA Amatör seeded idempotently on every deploy. Changes:
- `lib/catalog/catalog-normalized.seed.ts` **stripped to MMA Amatör ONLY (now v5)**: 1 discipline, 5 branches, **5 age categories** (alt-minik 7-9 / minik 10-12 / yildiz 13-15 / genc 16-18 / **buyukler 18-44, added v5 2026-06-25**), weights for those. MMA Pro + UWW Pankrasyon **physically removed** (operator chose strip over allowlist) — re-add + bump version when federation publishes them. genc + buyukler share the adult ladder (ADULT_MALE/ADULT_FEMALE consts; male 52.2…+93, female 47.6…+72.6 — same as old Pro Büyükler); buyukler overlaps genc at age 18 by federation choice.
- Catalog seeding **extracted** to reusable `lib/catalog/seed-catalog.ts` → `seedCatalog(db): CatalogSeedIds`. Both `scripts/seed-catalog.ts` (NEW, prod) and `scripts/seed-competition.ts` (dev fixture, refactored to call it then add event+joins) consume it.
- **weight_class idempotency bug fixed**: table has NO unique index, so the old `onConflictDoNothing()` (PK target) duplicated every weight class on each re-run. Now app-level heal: read existing rows for seeded age categories, insert only those missing by (ageCategoryId, gender, branchId, label). No migration needed. discipline/branch/age_category already self-heal via onConflictDoUpdate (natural unique keys).
- **Wired into deploy**: `bun scripts/seed-catalog.ts` added to Dockerfile `seeder` stage CMD (after seed-rejection-reasons). `tmmaf-deploy.zsh` already runs `compose run --rm seed` every deploy → catalog now seeds/heals automatically. No event, no payment fixture (prod-safe). package.json `seed:catalog` alias added; local `bun run seed` covers catalog via seed-competition.
- Verified: `bun run typecheck` + eslint clean. Idempotency not runtime-verified (agent has no DATABASE_URL). UNCOMMITTED.

**Update 2026-06-26 — heal was OVERWRITING operator weight edits + duplicating (staging only, by deploy frequency).** The v5 label-keyed heal (line 22) fought the catalog UI: `saveWeightSet` (lib/admin/catalog-crud.ts) reconciles by **bounds signature** (lower,upper) not label, so an operator rename updated the row in place → next deploy's seeder saw the seeded LABEL missing → **re-inserted** it → duplicate (weight_class had NO unique idx). `saveWeightSet`'s `existingBySig` kept only the first row per sig, so the dupes were invisible to it and the UI could never clear them (persisted across restarts; restart ≠ reseed). Live unaffected only because it redeploys rarely. Fix (operator chose "keep heal but make it safe"):
- **Partial unique index** `weight_class_active_scope_idx` on active rows: `(age_category_id, gender, COALESCE(branch_id,'000…'::uuid), COALESCE(lower_kg,-1), COALESCE(upper_kg,9999)) WHERE is_active` (no `nullsNotDistinct()` on index builder in drizzle 0.45 → COALESCE sentinels). Partial so soft-deletes keep bounds.
- **Migration 0024_weight_class_active_unique** (non-destructive): deactivate extra ACTIVE dupes (keep one per group by sort_order/created_at/id) → create the index. NO row delete, NO FK repoint (matches soft-delete + [[feedback_never_reset_db]]). Operator runs db:migrate ([[project_tmmaf_drizzle_migration_ops]]).
- **Seeder now INSERT-ONLY, keyed on BOUNDS** (active OR inactive): never updates existing rows, never resurrects operator-removed (inactive) divisions; `.onConflictDoNothing()` backstop. Helper renamed `weightClassKey`→`weightClassBoundsKey`.
- **saveWeightSet**: `existingBySig` now prefers the ACTIVE row per sig so a reactivate can't make a 2nd active row (index would reject).
- typecheck clean; 6 catalog-crud lint errors are PRE-EXISTING (no-unnecessary-type-assertion). UNCOMMITTED; staging needs db:migrate + redeploy to take effect.
