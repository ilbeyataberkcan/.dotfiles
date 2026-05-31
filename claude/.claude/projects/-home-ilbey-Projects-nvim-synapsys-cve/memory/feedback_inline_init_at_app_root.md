---
name: feedback-inline-init-at-app-root
description: "Two-line app-init code (DB driver instantiation + initDatabase call) belongs inline at the application root, not behind a side-effect import or wrapper function."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: af583d0e-ad1a-4f36-8c60-b5cb6d638a92
---

App-init code with a small footprint (e.g. `new DrizzleDriver(...)` + `initDatabase({ driver })`) should live inline at module scope in the application root file (Next 16: `app/layout.tsx`), NOT wrapped in a `lib/db/init.ts` side-effect module or a `initializeDatabase()` exported function.

**Why:** Side-effect imports are hidden control flow — readers see a bare `import './lib/db/init'` with no obvious purpose, have to open the imported file to understand what it does, and can't see WHEN it runs relative to other module-scope code. A wrapper function like `initializeDatabase()` adds the same indirection cost while still pulling the actual logic out of view. The inline form makes the application integration transparent: anyone reading `layout.tsx` sees `initDatabase({ driver })` at the top of the file and knows immediately what bootstraps when the process starts. Encapsulation only pays off when the encapsulated code is large enough or repeated enough to justify the indirection — two lines is below that threshold.

**How to apply:** When wiring service-singletons / DB drivers / global state into a Next 16 (or similar) host app entry point, write the construction + init calls directly at module scope in the entry file. Only extract to a helper module when (a) the init grows past ~10 lines, (b) it's reused from a second consumer (tests, scripts, alternative entry points), or (c) the host wants conditional / lazy init. Until one of those triggers fires, inline wins on transparency. Relates to [[feedback-no-helper-for-static-placeholder]] — same principle one step up: don't hide tiny code behind module boundaries.
