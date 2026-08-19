---
name: project_release_test_turbo_flake
description: bun run test / release:test fail non-deterministically under turbo across packages; each package passes alone — verify per-package before calling it a regression
metadata: 
  node_type: memory
  type: project
  originSessionId: ef38133e-b78e-412d-9107-de4b359eee32
  modified: 2026-08-05T16:39:38.187Z
---

`bun run test` and `bun run release:test` fail intermittently under turbo orchestration, and **the failing package moves between runs** — observed cve-components (`FilePreviewModal`, `ReferenceError: document is not defined` at jsdom teardown), then cve-core, then cve-design-system, on the same tree with no code change. It still happens at `--concurrency=1`, and system memory was not exhausted (10 GB free).

Every package passes its own `test` / `test:coverage` standalone with exit 0. Verified by running all 14 publishable packages sequentially — all green.

**Why:** vitest + v8 coverage under turbo's cross-package orchestration. `verify.yml` already documents the related hazard (concurrent type-aware eslint/tsc/vitest OOM-kill a ~7 GB runner, exit 137), which is why its matrix runs one package per runner.

**How to apply:** a red `release:test` is NOT by itself a regression signal. Before blaming a change: (1) re-run — see whether the failing package moves; (2) run the named package's suite standalone; (3) if it passes alone, it's the orchestration, not the code. To actually attribute a failure to a change, revert just the changed files and re-run the same suite — the honest comparison. See [[feedback_verify_code_not_just_tests]] and [[feedback_prove_the_proof_can_fail]]; narrower sibling: [[project_cve_auth_suite_order_flake]].
