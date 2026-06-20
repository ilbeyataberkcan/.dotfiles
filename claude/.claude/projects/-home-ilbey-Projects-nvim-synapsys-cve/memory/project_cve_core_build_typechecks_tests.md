---
name: project_cve_core_build_typechecks_tests
description: "cve-core build (tsconfig.build.json) type-checks test files but `bun run typecheck` (tsconfig.json) excludes them — widening a shared type can pass typecheck yet break the build via stale test fixtures, and break downstream consumers a phase scope-guard won't catch."
metadata: 
  node_type: memory
  type: reference
  originSessionId: b53c0e63-4f2a-4457-8bbf-6a5cbc652f37
---

In `packages/core`, `tsconfig.json` (used by `bun run typecheck` = `tsc --noEmit`) **excludes** test files (`src/**/*.test.*`, `src/**/__tests__/**`), but `tsconfig.build.json` (used by `bun run build`) does **not** — it compiles test files too. So a green `bun run typecheck` does NOT guarantee a green `bun run build`: a widened/narrowed shared type (e.g. adding required fields to `FlowInstanceState`/`FlowInstanceRow`) passes typecheck while stale test fixtures that construct the old shape break the build. Vitest also passes them (it strips types), so only `bun run build` catches it. (cve-user-management's tsconfig.build.json, by contrast, DOES exclude tests — the convention is not uniform across packages.)

**Why:** Phase 07.5 widened `FlowInstanceState`/`Row` with required `ownerId`/`status`; typecheck + 456 vitest tests passed, but `build:core` failed on 3 stale Phase-07.3 fixtures (`client-store`, `persistence-modes`, `driver` test files).

**How to apply:** After ANY change to a shared cve-core type or a `FlowsRuntime`/exported signature, run the FULL gate — `bun run build` (not just `typecheck`) AND a workspace-wide `bun run typecheck` (`turbo typecheck`). The latter catches downstream consumers broken by a required-param widening (07.5's required `actorId` broke cve-user-management's `UsersListRoute`, which a phase scope-guard checking "did we edit it" never catches — only "did we break it" via cross-package typecheck does). Relates to [[feedback_never_work_around_root_cause]] and [[feedback_grep_utility_classes_workspace_wide]].
