---
name: feedback-host-app-imports-no-js-extension
description: "synapsys-cve host apps (apps/cve-test-host) use bundler imports without `.js` extensions; the `.js` convention is for publishable packages only"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0645c899-476a-4e96-b88b-f310afefd7d1
---

Host apps under `apps/` in `synapsys-cve` (e.g. `apps/cve-test-host/`) use relative imports WITHOUT `.js` extensions: `import { env } from './env'`, `import { getDrizzle } from './db/client'`. Workspace packages under `packages/` use `.js` extensions per CLAUDE.md general project convention.

**Why:** The CLAUDE.md rule ("Use explicit `.js` extensions for internal relative imports") applies to publishable packages because they emit `dist/` JavaScript that must be importable from npm with explicit-extension ESM resolution. Host apps are consumed via Next/Turbopack's bundler resolver, which does NOT need extensions and in fact fails on `.js` extensions for files like `app/api/auth/[...all]/route.ts` → `lib/auth.ts`.

**How to apply:**
- When writing files inside `apps/<app>/`, use `import { x } from './foo'` (no extension), matching Phase 22's `lib/mail.ts` baseline.
- When writing files inside `packages/<pkg>/src/`, keep using `import { x } from './foo.js'` per CLAUDE.md.
- Cross-package imports (`@synapsys-integrated/cve-mail` etc.) always omit the extension (npm module resolution).

Related: directory paths containing dynamic segments like `[...all]` confuse Turbopack's relative-path resolver even when TS typechecks. The `@/*` alias is the canonical workaround for `apps/*/tsconfig.json`. See [[feedback-turbopack-dynamic-segment-resolver]] (if/when created).
