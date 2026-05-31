---
name: project-cve-per-package-db-driver-pattern
description: Canonical pattern for CVE packages that need DB access — per-package DbDriver contract + opt-in /drizzle subpath; cve-core is the reference; do NOT centralize DB in cve-core.
metadata: 
  node_type: memory
  type: project
  originSessionId: 635a8e5e-a5af-4992-ba4e-3373fa2e054f
---

Every cve-* package that needs database access defines its OWN domain-specific DbDriver contract and ships its OWN opt-in `./drizzle` adapter as a subpath. cve-core is the reference implementation. The host wires one Drizzle connection and passes it to each per-package adapter. **Do NOT centralize a generic DbDriver inside cve-core or expose a "common ORM API" — that path was explicitly considered and rejected.**

**Why:**

- cve-core's `CoreDriver` is intentionally domain-specific (`selectPageBySlug(slug)`, not `select(table, where)`). The pattern works precisely BECAUSE the methods serve known intents. Generic ORM abstractions either reimplement Drizzle (worse than the library itself), passthrough Drizzle (no value over the host installing it once), or grow into a schema-aware DB layer that knows about every cve-* package's tables (massive scope creep, makes cve-core a bottleneck platform).
- cve-auth verified 2026-05-28: ZERO source imports of cve-core. Coupling would be net-new cost — every cve-core version bump would cascade. The peer-package architecture is deliberate; no central DB platform.
- "Narrow debugging surface" intuition cuts the OPPOSITE way for centralization: a bug in a shared generic DB layer affects ALL packages at once. Per-package adapters confine blast radius to that package. The hierarchy IS the package boundary.
- ORM type leakage into a package's PUBLIC interface files (e.g. `AnyPgTable`, `PostgresJsDatabase`) is the worst form of coupling — worse than baked-in adapter Drizzle usage. The contract must be ORM-free for the seam to be real.

**How to apply:**

**When introducing a new CVE package that needs DB access:**
1. Define the contract at `packages/<pkg>/src/services/db/<pkg>-db-driver-interface.ts` — compose from small sub-interfaces (one per logical table cluster), intersect into `<Pkg>DbDriver`. Methods are domain-specific (`selectFooById`, NOT `select(table, where)`). Driver speaks `*Row` types (raw DB shape); never domain types.
2. Build the validated facade at `packages/<pkg>/src/services/db/service.ts` — bidirectional Zod (input AND output), business rules + sanitization + cross-table gates live here. NOT replaceable by hosts.
3. Idempotent singleton config at `packages/<pkg>/src/services/db/config.ts` — `init<Pkg>Database` is a silent no-op on second call (HMR safety). Inline init at app root, no wrapper module.
4. Ship the Drizzle adapter at `packages/<pkg>/src/db/drizzle/{driver.ts,tables-factory.ts,index.ts}` — implements `<Pkg>DbDriver`. Drizzle imports allowed HERE ONLY.
5. `package.json` exports: ORM-free root (`.`), opt-in `./db/drizzle` subpath. `drizzle-orm` declared as `peerDependencies` + `peerDependenciesMeta: { drizzle-orm: { optional: true } }`.
6. Host wiring: import one Drizzle `db` connection at the app root, instantiate `Drizzle<Pkg>DbDriver(db, connection, <pkg>Tables)`, call `init<Pkg>Database({ driver })`. Multiple per-package adapters share the same Drizzle connection.

**When refactoring an existing CVE package to be ORM-agnostic:**
1. First audit `*-driver-interface.ts` files for ORM type imports (`AnyPgTable`, `PostgresJsDatabase`, etc.). Close ALL surface leaks before anything else — the contract must be ORM-free for the rest of the refactor to be meaningful.
2. Introduce `<Pkg>DbDriver` as a new peer interface; functional drivers (e.g. AuthDriver / RbacDriver / AuditDriver) consume it via constructor injection. They lose all `drizzle-orm` imports.
3. Move all existing Drizzle call-sites to `packages/<pkg>/src/db/drizzle/driver.ts`. The functional drivers translate flow-level operations into DbDriver method calls.
4. Add the `./db/drizzle` subpath export.
5. Host wiring becomes: one Drizzle `db` shared by all packages, one `Drizzle<Pkg>DbDriver` per package, constructor-injected into each functional driver.

**The reference (worked example):**
- Contract: `packages/core/src/services/database/driver-interface.ts:168-271`
- Service: `packages/core/src/services/database/service.ts:142`
- Config: `packages/core/src/services/database/config.ts:67-122`
- Drizzle adapter: `packages/core/src/drizzle/driver.ts:73-350`
- Host wiring: `apps/cve-test-host/app/layout.tsx:4-13`
- Full template + skeleton code: `.planning/phases/07-cve-user-management-integration/07-FINDINGS.md` § Architectural reference: per-package DB driver pattern.

**Cross-package rules of the road:**
1. Each cve-* package owns its own DbDriver contract — no shared abstraction in cve-core.
2. Each cve-* package ships its own `./db/drizzle` subpath; root barrel is ORM-free.
3. Functional drivers consume the package's DbDriver as a peer; they never import `drizzle-orm` directly.
4. Public interface files (`*-driver-interface.ts`) must not import ORM types. If `AnyPgTable` or `PostgresJsDatabase` appears in an interface file, the seam is broken.
5. The host owns the Drizzle connection. One `db` instance, constructor-injected into every per-package adapter.
6. Bidirectional Zod is non-negotiable — service validates input AND driver-returned rows.
7. `init<Pkg>Database` is idempotent (HMR-safe).
8. No wrapper modules around init — inline at the app root.

**Related memories:**
- [[feedback_inline_init_at_app_root]] — two-line app-init at app root, not behind side-effect modules.
- [[project_cve_core_drizzle_subpath_gap]] — historical context for cve-core's own `./drizzle` subpath landing.
- [[project_cve_auth_redesign_locked_arch]] — cve-auth's three-driver functional architecture; AuthDbDriver added in Phase 07.1 as a peer that all three consume.
- [[feedback_auth_driver_first_design]] — design the contract from cve-auth's needs first; ORMs and BA shape come second.
- [[feedback_no_provider_type_reexports]] — public types belong to cve-* packages; no provider re-exports. The DbDriver corollary is: no ORM type re-exports either.
