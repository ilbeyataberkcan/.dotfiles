---
name: project-bun-publish-leaks-workspace-star
description: "Canonical publish is `release:wave`, NEVER `release:publish` — bun publish ships workspace: deps verbatim; also covers the snapshot path's traps"
metadata: 
  node_type: memory
  type: project
  originSessionId: f13d6298-2df3-471a-93be-8c91cb396902
  modified: 2026-08-23T00:00:00.000Z
---

**For a normal release the canonical publish path is `bun run release:wave`, never
`bun run release:publish`.** The `release:publish` script (`changeset publish`) is a trap left in
`package.json`; it is not what the operator uses, and the reason is recorded in
`scripts/release-wave.ts:37-56`.

`bun publish` does **not** strip `workspace:*` / `workspace:^` / `workspace:~` dependency specs
(oven-sh/bun#24687), and changesets only rewrites the prefixed forms — and even then only when it is
bumping that dependency in the same run. So `changeset publish` ships the literal string to the
registry and consumers cannot resolve it. This bites real packages: `packages/auth/package.json`
carries `"@synapsys-integrated/cve-mail": "workspace:^"`.

`release:wave` (`scripts/release-wave.ts`) is the fix and the whole release mechanism: per package it
backs up `package.json`, rewrites every `workspace:` spec to a concrete caret range, runs
`bun publish`, and restores the source in a `finally`. It publishes in 4 dep-graph-ordered waves,
gates each wave on GHP HTTP propagation (180 s budget, ~7 s retry), cascade-skips versions already on
the registry (so re-running is idempotent), and resumes from `.release-wave-state.json`.

Two routes, same script: run it locally after `changeset version`, or push a `v*` tag and let
`.github/workflows/publish.yml` run it in CI (`secrets.GITHUB_TOKEN`, `packages: write`). It reads the
repo-local `.npmrc`, so token config must precede it.

**A release commit MUST carry `bun.lock`.** `changeset version` bumps `package.json` and never the
lockfile, and nothing in `release:*` or `release-wave` syncs it — `bun install --frozen-lockfile`
exists only in CI (`publish.yml` step 1, `verify.yml`), i.e. after the operator has already
committed, tagged and pushed. v1.4.6 died there in 14 s, four steps before `release:wave` ran.

**Root cause of that class of failure: `"latest"` on toolchain devDependencies.** `bun-types` (15
packages) and `typescript` (13, incl. the root) tracked `latest`, so the lockfile spontaneously
stopped matching an unedited tree the moment upstream published — `bun-types@1.4.0` on 2026-08-20
turned `main` red for three days and nobody had changed a line. `typescript` was worse: `latest` had
already pulled 7.0.2 (the native port) for eight packages, and `cve-scheduling` breaks under it
because `scripts/check-neutrality.ts` uses compiler-API members 7 does not expose — it only passed
because re-hoisting happened to leave scheduling on 6.0.3. Both pinned 2026-08-23 (`bun-types`
1.3.14 matching the CI `bun-version`; `typescript` 6.0.3 matching ruleset-engine + matchmaking).
If a lockfile ever drifts on an untouched tree again, look for a new `latest` first.

**It already shipped broken once.** The `cve-payment-processing` snapshot pinned in tmmaf
(`0.0.0-payment-20260728223822`) ships `"@synapsys-integrated/cve-admin": "workspace:*"`. It only works
because tmmaf's `overrides` block pins cve-admin independently and masks the unresolvable spec.

**Snapshot path only** (`bun changeset version --snapshot <tag>`) — different rules:
- `@changesets/apply-release-plan` gates its changeset-removal loop only on `releasePlan.preState`,
  never on the snapshot flag — so it **deletes every `.changeset/*.md`**, not just the one being
  released. `git restore .` after publishing is mandatory.
- `release:wave` spawns `bun publish` with **no `--tag`**, so a snapshot it shipped would take the
  `latest` dist-tag. Never use it for a snapshot.
- `changeset publish --tag` publishes every snapshot-versioned package. Use
  `bun publish --cwd packages/<name> --tag <tag>`.
- Snapshot version format is `0.0.0-<tag>-<YYYYMMDDHHMMSS>`.

Related: [[project_ghp_token_sourcing]], [[project_bun_dual_cve_core_store]],
[[project_tmmaf_release_versioning_convention]], [[feedback_bitwarden_ssh_agent]]
