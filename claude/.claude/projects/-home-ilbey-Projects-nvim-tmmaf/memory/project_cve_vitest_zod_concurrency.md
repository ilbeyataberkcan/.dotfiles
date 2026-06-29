---
name: project_cve_vitest_zod_concurrency
description: "cve `bun run test` failures — zod must be inlined per vitest config, the full suite is CPU-oversubscribed under turbo, and cve-test-host tests are env-gated"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5ecfac0b-6f99-443d-89d2-02334b00d64e
---

Diagnosed 2026-06-21 while greening the cve suite to publish cve-components 10.5.0 (the flow-multi-select collector). Three distinct things, not one:

1. **zod externalization (the real blocker).** Under turbo's bun-node spawn, externalized **zod v4** resolves to a namespace where `z` is `undefined`, so any test that *runtime*-imports a `*.schemas.ts` dies with `TypeError: undefined is not an object (evaluating 'z.enum')`. FIX = every package's `vitest.config.ts` needs `server.deps.inline: ['zod']`. Added to **admin, auth, mail, multilingual-workflow, payment-processing, storage**; core/components/design-system/studio-extension/user-management already had it (their configs carry the explaining comment). Type-only `import type { z }` does NOT trip it — only runtime schema imports.

2. **CPU oversubscription → flaky suite.** Full `bun run test` (=`turbo test`) on 16 cores ran turbo concurrency 10 × each package's own vitest worker pool, so timing-sensitive jsdom tests crawled 5–18× slower and blew the 1s `waitFor` / 5s `testTimeout` — a **different package flaked each run** (components FilePreviewModal, design-system theme-switch). FIX = bounded `test` + `release:test` to `--concurrency=1` (serial packages, each with full cores): deterministic, ~73s wall. Don't chase per-test timeout bumps — bound concurrency. (Also raised components `asyncUtilTimeout` to 8000 as belt-and-suspenders for dynamic-import renderers.)

3. **cve-test-host is env-gated, not a regression.** `apps/cve-test-host` (NOT a published package, NOT in `release:test`'s 11-package filter) has integration tests that need `DATABASE_URL` + `RESEND_API_KEY` + `CVE_AUTH_DB_ROLE` + a real DB; without them 12 files fail to load (`Environment validation failed` / `ECONNREFUSED`). Expected without infra; passes with the dev env up. The cve analog of [[tmmaf-test-baseline-needs-docker]].

4. **CI verify.yml = matrix-per-package, but WITHIN a runner tasks MUST be serial.** `.github/workflows/verify.yml` was reworked (2026-06-21) to a per-published-package matrix running `bun x turbo run lint typecheck test --concurrency=1 --filter=<pkg>`; rsc-schemas is its own job; the private `cve-test-host` app is dropped from the gate; free `.turbo` GitHub-Actions cache kept (keyed per package); aggregate job id stays `verify` (branch-protection check name). TWO failure modes both seen (both fixed):
   (a) folding lint+typecheck+test into one `turbo run` WITHOUT `--concurrency=1` runs them concurrently per runner → multiple TS programs at once → OOM. FIX: `--concurrency=1` (also matches the operator's "cve-packages should be sequential for a reason").
   (b) the REAL dominant one: a SINGLE type-aware eslint process exceeds Node's **~2 GB default V8 heap** ("JavaScript heap out of memory", exit 137) on the heavy packages (payment-processing etc., big `recommended-requiring-type-checking` + `project`-glob program). FIX: `env: NODE_OPTIONS: --max-old-space-size=6144` on the checks job. The old single `shared` job never hit (b) because it was cancelled before payment's lint completed. Cross-package parallelism = the matrix; within-runner = `--concurrency=1` + 6 GB heap. (Future optimization: typescript-eslint v8 `parserOptions.projectService: true` is more memory-efficient than the project glob — untested, deferred.)

After 1+2: all 11 published packages green serially (auth 894, payment-processing 504, core 595, storage 334, components 273, studio 180, user-mgmt 178, multilingual 162, design-system 149, admin 130, mail 193). Committed on branch `feat/flow-multi-select-collector` (two commits: `fix(test): inline zod…`, `test: bound suite concurrency…`); operator pushes. See [[project_ci_db_tests_local_only]] [[project_cve_release_path]] [[project_phase71_plan]].
