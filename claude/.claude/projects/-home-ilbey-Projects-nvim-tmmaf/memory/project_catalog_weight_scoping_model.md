---
name: project_catalog_weight_scoping_model
description: "Catalog weights are scoped per (discipline→age-category→gender), branchId stays null — branches are level gates, not a weight dimension; reuse by copy"
metadata: 
  node_type: memory
  type: project
  originSessionId: 117c7a18-eb97-4723-9e60-205fa52ecdce
---

The normalized catalog's weight classes are authored **per (discipline → age category → gender)**. `weightClass.branchId` exists (nullable) but is left **null** — there is NO relational branch scoping of weights. Reuse across scopes is achieved by **copying** a weight set into a target (the Set Editor "Kopyala" + `saveWeightSet` reconciler), not by linking branches.

**Branches** are **level-clearance / fight-intensity gates** (`branch.minLevel`, "Seviye Eşiği") — an athlete needs sufficient level to enter a branch. They feed the registration funnel (Discipline → Branch → Weight, age auto-derived) for level clearance, NOT weight authoring. Reconfirmed 2026-06-22: branches differentiate intensity/level and do **NOT** affect the weight groups. Branches are **uniform across all disciplines** — the same 5 seeded under every discipline (Grappling 1 · Light 2 · Full 3 · Elit 4 · Profesyonel 4); the federation refines which apply where later. Any per-branch weight *selection* (the operator's "select branch weights for an event" screen) is an **EVENT-level** concern, not catalog.

The Set Editor scope is therefore **Disiplin + Yaş Kategorisi + Kadın/Erkek columns** — deliberately **no branch selector** (operator confirmed 2026-06-22; I twice proposed one and was corrected — same "modeled wrong" trap as [[trainingsince_is_experience_bracket]]).

**Why:** matches the schema (branchId nullable, kept null) and the federation's real model (one weight ladder per age+discipline+gender; branches differ by required level, not by weights).

**How to apply:** When building event-creation weight selection or any catalog/weight work, scope weights by (discipline, age-category, gender) only. Do NOT reintroduce branch as a weight dimension. For "share a ladder" use copy, never a relational link. Catalog admin module = `lib/admin/get-catalog-module.tsx` (nested-nav: Disiplinler/Branşlar/Yaş Kategorileri/Kilo Sınıfları); backend in `lib/admin/catalog-crud.ts` (CRUD + in-use guards + `saveWeightSet` + `reactivate*`) and read layer `lib/admin/catalog-queries.ts`; UI in `lib/admin/components/catalog/`. See [[project_phase72_catalog_renormalization]].
