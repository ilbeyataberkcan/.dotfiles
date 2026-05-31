---
name: project-phase20-resume-context
description: "When Phase 20 resumes — what's done, what's blocked on user input, what to replan, and which commits/branches are where"
metadata: 
  node_type: memory
  type: project
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

Phase 20 (v1.2 Foundation) is paused after Plan 20-01. Both prerequisites are SHIPPED + PUBLISHED to GHP (verified 2026-05-15 via `bun pm view`):
- `@synapsys-integrated/cve-core@0.5.1` ✓ live
- `@synapsys-integrated/cve-design-system@0.5.0` ✓ live

Main branch pushed to origin. Tags `cve-core@0.5.1` and `cve-design-system@0.5.0` pushed.

Resume is now gated only on the user providing their Claude Design (or equivalent) design-system export for the Plan 20-01 task 1.5 redo (questionnaire). After that, the rest of Phase 20 (Plans 20-02 through 20-10) executes — with corrections per the discovered pitfalls.

**Branch state:**

- `main` — has the merged 20.1 + 20.2 patches (`ade8b20` + `26b8aaf`). ~17 commits ahead of `origin/main`. Workspace verified green workspace-wide (18/18 typecheck, 18/18 tests, 16/16 lint).
- `gsd/v1.2-smoke-app-tests` — paused at Plan 20-01 complete (commit `fb23d58`). 7 Plan-20-01 commits + 10 cherry-picked planning commits + a placeholder hardcoded theme-seed at `88ef41c` that needs questionnaire-driven overwrite when Plan 20-01 task 1.5 redoes.
- `gsd/20.1-cve-core-drizzle-subpath` — merged, can be deleted after publish lands.
- `gsd/20.2-cve-design-system-accents-v2` — merged, can be deleted after publish lands.

**What the user owes us at resume:**

1. ~~Publish~~ DONE 2026-05-15 (`cve-core@0.5.1` + `cve-design-system@0.5.0` live on GHP).
2. ~~Push main + tags~~ DONE 2026-05-15.
3. Their **Claude Design** (or equivalent) **design-system export** for the Plan 20-01 task 1.5 redo questionnaire. The placeholder seed at commit `88ef41c` was auto-selected option-a during the original run; needs replacement with the user's real design-system extracted via the questionnaire defined in [[feedback-design-system-import-questionnaire]]. THIS IS THE ONLY REMAINING USER INPUT GATING RESUME.

**Resume sequence (in order):**

1. ~~Verify GHP resolution~~ — already verified live: `cve-core@0.5.1` and `cve-design-system@0.5.0`.
2. `git switch gsd/v1.2-smoke-app-tests`.
3. Bump `apps/cve-test-host/package.json`: `@synapsys-integrated/cve-core` `^0.5.0` → `^0.5.1`, `@synapsys-integrated/cve-design-system` `^0.4.0` → `^0.5.0`.
4. `bun install` (fetches new versions). Commit the dep bump.
5. Plan 20-01 task 1.5 redo:
   - Run the design-system-import questionnaire over the user's Claude Design export.
   - Extract ONLY the cve-design-system surface fields: `primary`, `accents.{primary, secondary?, tertiary?}`, `status.{success?, warning?, error?, info?}`, `fonts.{sans?, mono?, display?}`.
   - DEFER component examples to Phase 21 (cve-components). Marketing assets / illustrations / page templates: discard or note as out-of-scope.
   - Overwrite `apps/cve-test-host/lib/theme-seed.ts` with the extracted ThemeSeed. Commit as a separate atomic step on the milestone branch.
   - Update FINDINGS.md to record the questionnaire decisions.
6. Replan 20-02 (was: route-group split; now: single route + per-variant DirectionProvider via RenderEngine). See [[feedback-direction-per-variant-not-route-group]].
7. Replan 20-04 (was: hand-author 4 Drizzle schemas; now: thin re-export from `@synapsys-integrated/cve-core/drizzle` + `drizzle.config.ts` wiring). The cve-core@0.5.1 subpath does the heavy lifting.
8. Replan 20-07 (was: parallel `app/(ltr)/<route>/page.tsx` + `app/(rtl)/<route>/page.tsx`; now: single `app/[...slug]/page.tsx` consuming a URL-keyed `VariantResolver`).
9. Resume `/gsd-execute-phase 20` from Wave 2 onward. PROC-01 discipline: pause between waves for user verification per [[feedback-pause-between-waves-proc01]].

**Workspace-internal status colors / accent classes:** all consumers across `packages/*` + `apps/cve-host-smoke` were rewritten to the 0.5.0 namespace in the merge (`bg-accent-primary`, `bg-status-success`, etc.). `apps/cve-test-host` was scaffolded after the migration — its source files (`lib/theme-seed.ts`, `app/layout.tsx`, `app/globals.css`) are already on the new namespace.

**External-consumer cascade (out of immediate scope but track it):** publishing `cve-design-system@0.5.0` to GHP means anyone outside this monorepo who upgrades cve-design-system without also upgrading sibling packages (cve-admin, cve-components, cve-extensions/*) gets silent utility-class breakage. The CHANGELOG documents this; if you want a coordinated multi-package release wave (Phase 19-style), it would bump those siblings to a patch + republish. NOT blocking Phase 20 since cve-test-host only consumes cve-core + cve-design-system at this stage.

**In-flight `.planning/` edits:** `STATE.md` / `ROADMAP.md` / `REQUIREMENTS.md` carry uncommitted edits the user authored mid-session (Phase 20.1 + 20.2 roadmap entries, PKG-PATCH-01/02 requirements). Untouched throughout this session. The user will commit them at their own cadence — do NOT auto-commit on next session pickup.

**Phase number scheme reminder:** Phase 20.1 and 20.2 were inserted as decimal phases (Phase 20 prereqs) per the user's roadmap reshape. The milestone STATE.md counts them as part of `total_phases: 12`.
