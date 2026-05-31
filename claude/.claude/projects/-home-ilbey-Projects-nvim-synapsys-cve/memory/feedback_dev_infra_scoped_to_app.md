---
name: feedback-dev-infra-scoped-to-app
description: "Dev infrastructure files (docker-compose, db setup scripts, sample seeds) live inside the consuming app's directory, not at the repo root. They're deleted alongside the app, not \"shared across future hosts\"."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: af583d0e-ad1a-4f36-8c60-b5cb6d638a92
---

App-level dev infrastructure (`docker-compose.yml`, lifecycle scripts like `db:up`/`db:down`, sample fixtures, mock service configs) **lives inside the consuming app's directory**, not at the repo root. The scope of these files is the app's scope; when the app is removed, they go with it.

**Why:** The "future test-hosts will share the same DB" justification is overengineering — it pre-supposes coupling between hypothetical future apps and the current one. Standard monorepo practice is per-app dev infra: each app's `docker-compose.yml` declares only what that app needs, with its own credentials, ports (when conflicts matter), and named volumes. New apps bring their own setups; they don't inherit. This matches how `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts` are already scoped per-app — dev infra is no different.

The cost of misplacing dev infra at the repo root:
- Forces "shared resource" coordination across apps that don't exist yet
- Couples cleanup: removing the test app leaves orphaned compose files at the root
- Makes per-app credential / port / volume isolation harder
- Violates the file-lifecycle co-location principle that already governs every other config

**How to apply:**
- New `docker-compose.yml` files: place in the consuming app's root (e.g. `apps/cve-test-host/docker-compose.yml`), not at the workspace root.
- New `db:up` / `db:down` / `db:logs` (or equivalent infra) scripts: add to the app's `package.json`, not the root. Invoke as `bun --cwd apps/<app> run db:up`.
- Named volumes: prefix with the app name to avoid collision when multiple apps coexist (e.g. `cve_test_host_pg`, not just `postgres_data`).
- Compose project name: defaults to the parent directory name — adequate isolation in most cases.
- Exception: only promote to repo-root when there is actual demonstrated cross-app coupling that can't be satisfied by per-app files (rare).

**For the v1.2 cold-start phase:**
- Plan 20-03's original "compose file at repo root" lock (D-06) was overengineered. Corrected at user request: file lives at `apps/cve-test-host/docker-compose.yml`; scripts live in `apps/cve-test-host/package.json`. When the test-host is removed at v1.2 conclusion, the dev infra goes with it cleanly.
- D-06 override recorded in FINDINGS Section 3; Phase 29 GUIDE-01 documents the per-app scoping rule as a load-bearing convention.

**Counter-cases — when repo-root IS justified:**
- Cross-cutting infra that genuinely spans multiple apps (e.g. a shared local NATS broker that 3 apps already integrate with).
- Workspace-level tooling (linting, formatting, release automation) — but that's not "dev infra for the app", that's "workspace tooling".

Neither applies at Phase 20.

**Related:** [[feedback-no-helper-for-static-placeholder]] (same family — don't add scaffolding for hypothetical second consumers).
