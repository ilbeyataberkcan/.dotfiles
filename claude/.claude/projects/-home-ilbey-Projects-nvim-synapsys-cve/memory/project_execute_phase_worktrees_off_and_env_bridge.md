---
name: project_execute_phase_worktrees_off_and_env_bridge
description: "synapsys-cve execute-phase must run worktrees OFF when touching apps/cve-test-host; host vitest loads .env (absent — only .env.local), bridge for DB tests"
metadata: 
  node_type: memory
  type: project
  originSessionId: 695085cf-e527-4b6c-a57a-354aec5f3e36
---

Running `/gsd:execute-phase` (or any worktree-isolated agent work) on **synapsys-cve** for phases that touch `apps/cve-test-host` must use **worktree isolation OFF** (sequential on main tree).

**Why:** `node_modules/`, `.env`, `.env.local`, `.next/`, `dist/`, `.turbo/` are all gitignored. A fresh `git worktree add` checkout contains NONE of them. `apps/cve-test-host` is a Bun **workspace member** (`workspaces: ["packages/**","apps/*"]`) resolving 8 `@synapsys-integrated/cve-*` deps via node_modules symlinks → a worktree can't resolve imports. Worse, `apps/cve-test-host/vitest.config.ts` loads `.env` (NOT `.env.local`) at config-load time, and `lib/env.ts` validates `DATABASE_URL`/`CVE_AUTH_DB_ROLE` at module scope → every host test crashes on import in a worktree. Config has `workflow.use_worktrees: true` but the per-run dispatch must override to sequential; do NOT flip the persistent setting. Only spin up isolation when sibling plans are genuinely concurrent (see [[feedback_workspaces_only_when_parallel]]).

**How to apply:**
- Execute waves sequentially on the main tree (each executor agent without `isolation="worktree"`). Multi-plan waves with disjoint `files_modified` serialize safely.
- Post-merge gate: the GSD sniff falls to `npm run build`/`npm test` (wrong — Bun-only). `gsd-sdk config-set workflow.build_command/test_command` is REJECTED (unknown keys), so run the Bun commands yourself at the gate: `bun run build:core` + targeted `bunx vitest run <files>`.
- **.env channel mismatch:** Next.js + seed scripts read `.env.local`; vitest reads `.env` (absent). To run DB-backed host tests (incl. the security/e2e suites), bridge first: `cp apps/cve-test-host/.env.local apps/cve-test-host/.env`, run, then `rm .env`. `.env` is gitignored — never commit it; confirm `git ls-files apps/cve-test-host/.env` stays empty.
- Postgres runs in docker (`cve_test_host_pg` on :5432) + Mailpit (:1025/:8025); usually already up. Sandbox reaches :5432 but not the host's :3000 (see [[project_test_host_live_e2e_harness]]).
