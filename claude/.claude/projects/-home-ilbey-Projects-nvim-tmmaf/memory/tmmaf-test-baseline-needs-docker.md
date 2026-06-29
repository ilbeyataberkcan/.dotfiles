---
name: tmmaf-test-baseline-needs-docker
description: "tmmaf host `bun run test` baseline is 0 failures WITH docker up (was 9, now fixed); without docker ~25 env failures"
metadata:
  node_type: memory
  type: project
  originSessionId: 63ad1208-1544-4748-859e-8153a542466d
---

**UPDATE 2026-06-21 (phase 7.1):** the host `bunx vitest run` (= `bun run test`) baseline is now **0 failures** with docker up — empirically verified at pre-wave commit `92a6ec8` (45 files / 285 tests, 0 fail). The old "9-failure" number is OBSOLETE (those got fixed); and the "9 docker-up baseline" people sometimes cite actually belongs to the **cve-auth PGlite suites INSIDE the cve packages**, not this host repo's vitest scope. So for tmmaf host execution gates, treat baseline = 0 and any NEW failure = red.

Docker is still required: with `tmmaf_pg` (postgres) and `tmmaf_mailpit` DOWN, the suite shows ~25 failures, all `TypeError: fetch failed` / DB-connection shaped — environmental, not regressions. Start them with `bun run db:up` (+ mailpit) before judging the baseline.
