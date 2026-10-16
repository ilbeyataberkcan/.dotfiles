---
name: project_worktree_docker_compose_volume_trap
description: A git worktree makes `docker compose up` create a NEW empty postgres volume — the DB looks wiped but the original volume is untouched
metadata:
  type: project
---

Docker Compose derives its project name from the **directory name**, and `docker-compose.yml`
has no `name:` key. So running `bun run db:up` from a worktree at `~/Projects/nvim/tmmaf-tsu`
creates project `tmmaf-tsu` → volume **`tmmaf-tsu_tmmaf_pg`**, while the real data lives in
**`tmmaf_tmmaf_pg`**. `container_name: tmmaf_pg` is hardcoded, so the container is silently
*recreated* against the empty volume and everything still looks normal.

**Symptom:** `drizzle.__drizzle_migrations` reads 0 rows, every app schema
(`tmmaf_identity`, `tmmaf_competition`, …) is missing, only `drizzle` + `public` remain, and
`db:migrate` fails with a bare `exited with code 1` — because it replays from `0000`, whose
first `CREATE TABLE "cve_auth"."accounts"` has no `cve_auth` schema to land in.

**It reads exactly like a wiped database. It is not.** Nothing is deleted; the container is
pointed at a different disk. Confirm before panicking:

```
docker inspect tmmaf_pg --format '{{range .Mounts}}{{.Name}}{{end}}'   # which volume?
docker volume ls | grep tmmaf                                          # both will be listed
```

**Fix — write `.env` in the worktree** (compose reads `.env`, not `.env.local`):

```
echo "COMPOSE_PROJECT_NAME=tmmaf" > .env
docker compose down          # NEVER -v; that would delete a volume for real
docker compose up -d postgres
```

**Do this before the first `db:up` in any new worktree.** Both checkouts share ONE database,
so whichever directory runs `db:migrate` decides what lands — see
[[project_tmmaf_drizzle_migration_ops]] and [[feedback_verify_db_state_not_docs]].

Related: [[project_workflow_worktree_forks_origin_main]] (worktrees fork from `origin/main`, so
fork from `staging` explicitly — it was 254 commits ahead).
