---
name: local-env-pg16-and-ghp-token
description: Local tmmaf dev env quirks — the docker volume is PostgreSQL 16 while compose says 17-alpine, and cve package installs need NODE_AUTH_TOKEN=$(gh auth token)
metadata:
  type: project
---

Two facts about the local machine, true as of 2026-09-04:

1. `docker-compose.yml` pins `postgres:17-alpine` (changed 2026-08-25 in phase 46) but the real local volume `tmmaf_tmmaf_pg` was initialised by **PostgreSQL 16**, so `bun run db:up` dies with "database files are incompatible with server". Bring it up with the override kept outside the repo:
   `docker compose -p tmmaf -f docker-compose.yml -f ~/.local/share/tmmaf/pg16.override.yml up -d --wait postgres`
   Upgrading the volume (pg_upgrade or dump/restore) is the operator's call — never reset it.
2. `bun install` 401s on `@synapsys-integrated/cve-*` unless `NODE_AUTH_TOKEN` is set. The gh CLI token carries `write:packages`, so `NODE_AUTH_TOKEN=$(gh auth token) bun install --frozen-lockfile` works. `gh auth setup-git` makes https pushes work too (the remote is https now).

**Why:** both failures look like a broken tree after a fast-forward; neither is.
**How to apply:** run those two commands before typecheck/tests on this machine. See [[tmmaf-test-baseline-needs-docker]] and [[project-worktree-docker-compose-volume-trap]].
