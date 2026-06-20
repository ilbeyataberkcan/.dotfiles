---
name: tmmaf-test-baseline-needs-docker
description: "tmmaf's 9-failure test baseline only holds when tmmaf_pg and tmmaf_mailpit docker containers are up"
metadata: 
  node_type: memory
  type: project
  originSessionId: 63ad1208-1544-4748-859e-8153a542466d
---

The tmmaf gate "bun run test must show exactly 9 pre-existing failures (bun-store ESM issues)" assumes the local docker services are running. With `tmmaf_pg` (postgres) and `tmmaf_mailpit` down, the suite shows ~25 failures, all `TypeError: fetch failed` / DB-connection shaped — environmental, not regressions. Start them with `bun run db:up && bun run mail:up` before judging the baseline (verified 2026-06-12).
