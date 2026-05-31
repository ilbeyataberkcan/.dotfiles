---
name: project-cve-core-drizzle-subpath-gap
description: "cve-core ./drizzle subpath gap — CLOSED by 0.5.1 on main (not yet published to GHP); kept for historical context"
metadata: 
  node_type: memory
  type: project
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

**STATUS — CLOSED 2026-05-15 by Phase 20.1.** Shipped in `cve-core@0.5.1` (merged into main as `ade8b20`; not yet published to GHP at memory write time — pending user publish step). See [[project-phase20-resume-context]] for what's gated on the GHP upload. Pre-fix state preserved below for the historical record.

---

cve-core today (verified 2026-05-15) exports ORM-agnostic schema metadata but **no Drizzle subpath**. The full state:

- ✅ ORM-agnostic abstract row types: `PageRow`, `PageVariantRow`, `SubscriberRow` at `packages/core/src/services/database/driver-interface.ts` (lines 37-88), exported via root barrel and `./schemas` subpath.
- ✅ Zod row schemas: `PageRowSchema`, `PageVariantSchema`, `SubscriberRowSchema` at `packages/core/src/services/database/schemas.ts`.
- ❌ No `./drizzle` (or equivalent) subpath in `packages/core/package.json` exports map. The map has only 8 subpaths: `.`, `./schemas`, `./engine`, `./registries`, `./types`, `./seo`, `./builders`, `./sanitization`.
- ❌ No pre-built Drizzle pgTable definitions in cve-core source. Only a documentation comment at `packages/core/src/services/database/schemas.ts` lines 180-196 describing the expected host Drizzle shape.
- 📋 Plan 20-04 currently requires the host to hand-author 4 Drizzle schemas with `$type<>()` annotations to prove structural assignability to cve-core abstract interfaces — boilerplate every consumer would repeat.

**Why:** Real consumers will repeat the same Drizzle table definitions verbatim because the abstract interfaces dictate exact column shapes (jsonb types, nullability, names). A pre-built cve-core `./drizzle` subpath would eliminate that boilerplate while keeping the ORM-agnostic root export intact for Prisma/raw-SQL consumers.

**How to apply:**
- Phase 20 Plan 20-04 is currently mis-scoped: it asks the host to author Drizzle table definitions from scratch. Address the cve-core gap FIRST (add `./drizzle` subpath that exports pre-built pgTable definitions), THEN reduce Plan 20-04 to a thin re-export + drizzle.config.ts wiring.
- The cve-core `./drizzle` subpath must remain an optional adapter — root export stays ORM-agnostic (mirrors the DOCS-03 third-party-integration ADR pattern: provider-agnostic seam + optional subpath adapter).
- Coordinate version bump: cve-core@0.5.0 doesn't have this subpath; if we add it, host pins `^0.5.x` will only resolve once a 0.5.1 (or 0.6.0) is published. Phase 20 will need to re-install once cve-core ships the subpath.
