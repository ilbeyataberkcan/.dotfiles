---
name: project_cve_auth_v14_publish_chain_held
description: "cve-auth has a 3-major publish chain HELD (12.0.0→13.0.0→14.0.0); v1.4 Phase 04 teams code-complete+verified, only publish pending."
metadata:
  node_type: memory
  type: project
  originSessionId: 9afbe01a-cd20-4a6b-9400-50fbe48c60e3
---

As of 2026-07-03, three cve-auth MAJOR changesets coexist un-published in `.changeset/`, each a blocking-human release gate, and they MUST publish in strict order — never batch two majors into one `release:version`:

1. **12.0.0** — Phase 02 (Plan 02-07). `packages/auth/package.json` already at 12.0.0; just `release:wave`.
2. **13.0.0** — Phase 03 (Plan 03-05). Only after 12.0.0 lands.
3. **14.0.0** — v1.4 Phase 04 teams (Plan 04-05). `.changeset/cve-auth-teams-14-0-0.md`; package.json deliberately still 12.0.0. Only after 13.0.0 lands.

Per-wave canonical path: consume changeset → `bunx changeset version` → `git checkout`-revert any non-cve-auth cascade bump (the release:version over-cascade footgun — see [[project_cve_release_publish_path]] / [[project_release_wave_state_file_footgun]]) → commit → `bun run release:wave` (NEVER `release:publish`) → delete `.release-wave-state.json`. Then mark the plan complete + `bun run reconcile` on main after merge.

**v1.4 Phase 04 (teams-thin-passthrough, ORG-06) status:** code-complete + verified (28/28 must-haves, all 7 auth invariants hold — D-02 zero-authority, D-10 least-privilege split, D-06 entry-gate, headerless 1:1 BA delegation, V5 validation boundary, thin-passthrough, AC13 d.ts zero-BA-types). Deep code review found 0 blocker / 2 warning (both fixed: `.trim()` on team schemas + idempotent `addTeamMember` on unique violation, commit 01bf60cf) / 3 info (deferred). Phase NOT marked complete — held at the 14.0.0 publish. `/gsd:secure-phase 4` not yet run. Full v1.4 is cve-auth-only; Phase 04 is the last v1.4 phase.

Executed on branch `quick/cve-storage-filetype-scoping` (branching_strategy=none), worktrees OFF (see [[project_execute_phase_worktrees_off_and_env_bridge]]). The archived-milestone `04-04/05/06/07 complete` commits are a plan-ID collision false-positive (see [[project_milestone_planid_collision_safe_resume]]).
