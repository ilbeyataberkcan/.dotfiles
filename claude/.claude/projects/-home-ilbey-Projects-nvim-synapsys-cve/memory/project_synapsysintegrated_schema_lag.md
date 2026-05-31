---
name: project-synapsysintegrated-schema-lag
description: "synapsysintegrated's Drizzle pages schema is on v1.0 (content array), not v1.1 Path C-Strict (rootNode singular) — v1.2 test-host is the first Drizzle impl against v1.1 PageRow."
metadata: 
  node_type: memory
  type: project
  originSessionId: 28ad4c28-02ed-4bee-af56-e316377a726b
---

`/home/ilbey/Projects/nvim/synapsysintegrated/src/lib/db/schema/pages.ts` is **still on v1.0's Page shape** as of 2026-05-15:

- Uses `content: jsonb('content').$type<ComponentNode[]>()` — a content *array*, not v1.1 Path C-Strict's `rootNode: ComponentNode` singular
- Missing columns: `editorialState`, `publicMetadata`, `editorialMetadata`, `revisionHistoryRef`, `structuredData`
- Does NOT satisfy v1.1 `PageRow` contract exported from `@synapsys-integrated/cve-core` (`packages/core/src/services/database/driver-interface.ts`)

**Why:** Why this matters: cve-core establishes the pages-table contract via `PageRow` (TS interface) + `CreatePageInputSchema` / `UpdatePageInputSchema` (Zod). The host writes the `pgTable` such that `pages.$inferSelect` is structurally assignable to `PageRow`. synapsysintegrated hasn't run that upgrade — its host has been on a parallel-tree schema since v1.0.

**How to apply:**
- When discussing test-host integration or any v1.1 Drizzle work, treat synapsysintegrated as a NEGATIVE reference for the page schema shape and a POSITIVE reference for the modular layout (`src/lib/db/schema/{pages,collections,auth,newsletter}.ts` + `pgSchema('cve_content')` / `pgSchema('cve_auth')` namespaces) and `drizzle.config.ts` shape (modulo Supabase SSL block).
- v1.2 Phase 20 (`apps/cve-test-host/`) will be the **first** Drizzle impl built against v1.1 `PageRow`. Phase 20 `FINDINGS.md` should surface this as a top-tier upgrade-path pitfall.
- Related: [[project-phase10-design-lock]] locked Page-as-root-node (Path C-Strict) in v1.1; synapsysintegrated never migrated.
