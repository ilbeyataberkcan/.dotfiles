---
name: project-cve-release-publish-path
description: "synapsys-cve workspace uses Changesets for publishing — the canonical orchestrated path is `bun run release:wave` (with `bun changeset version` first). `bun run release:publish` is bare `changeset publish` and ships workspace:* literals — DO NOT USE IT."
metadata:
  node_type: memory
  type: project
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

The synapsys-cve workspace publishes to GitHub Packages via **Changesets**, NOT via `bun publish` directly. The repo is Bun-only per CLAUDE.md, but `bun publish` does NOT strip `workspace:*` literals at publish time (upstream bug `oven-sh/bun#24687`). Therefore the publish path MUST go through the wave orchestrator that does the workspace:* → caret rewrite per package.

## The canonical publish flow

```bash
# 1) Apply pending changesets — bumps package.json versions + cascades patches
bun changeset version

# 2) Inspect, commit the version-applied diff (REQUIRED — release-wave reads on-disk versions)
git add -A && git commit -m "chore(release): apply changesets for <wave>"

# 3) Orchestrated publish — workspace:* rewrite + dep-graph waves + GHP propagation gate
bun run release:wave
```

`release:wave` runs `scripts/release-wave.ts`, which:
- Publishes packages in 4 dep-graph waves (mail+design-system → core+auth → 5-package wave → studio-extension).
- For each package: backs up `package.json`, rewrites every `workspace:*` / `workspace:^` / `workspace:~` to a caret range pinned to the version map from on-disk package.jsons, runs `bun publish --cwd <pkgDir>`, then restores the source `package.json` from backup. Try/finally ensures source files are never left in caret-rewritten state.
- Polls GHP HTTP API for propagation (180s budget + ~7s retry) before advancing the next wave.
- Persists state to `.release-wave-state.json` so a re-invocation resumes from the first incomplete wave on partial-wave failure.

## DO NOT USE: `bun run release:publish`

`bun run release:publish` is literally `changeset publish` with no version-apply and no workspace:* rewrite. Running it ships **broken tarballs**: the published `package.json`'s `dependencies` field contains literal `workspace:*` strings, which fails `bun install` / `npm install` on any consumer. The script comment in `scripts/release-wave.ts` (lines 38-55) documents this trap explicitly.

**Observed failure mode (Phase 07.2-09, 2026-05-30):** Operator ran `bun run release:publish` per a stale memory + Plan 09 task wording. cve-auth@1.5.0 published with `'@synapsys-integrated/cve-mail': 'workspace:*'` in dependencies AND code importing new cve-mail factories that hadn't been published yet (cve-mail still at 0.3.1 because no `changeset version` step). Double-broken release; recovery required GHP version deletion + republish via `release:wave`.

## Other release scripts in root `package.json`

```bash
bun run release:build           # turbo build, filtered to 9 release packages
bun run release:typecheck       # turbo typecheck, same filter
bun run release:test            # turbo test:coverage, same filter
bun run release:integrity       # turbo integrity (publint + attw), same filter
bun run release:integrity:all   # = release:build && release:typecheck && release:integrity
bun run release:version         # = changeset version (use this in step 1 above)
bun run release:publish         # = bare changeset publish — DO NOT USE (no workspace:* rewrite)
bun run release:wave            # = scripts/release-wave.ts — CANONICAL publish path
bunx changeset                  # create a new changeset .md (interactive)
```

Per-package scripts like `bun run release:auth` / `release:studio-extension` exist for some packages — they run build + typecheck + test + integrity in sequence, no publish.

## Pre-publish gate (always run first)

```bash
bun run release:integrity:all
```

Build + typecheck + integrity (publint + attw) for the 9 release packages. Treats integrity as the publish gate.

## Auth required

- `NODE_AUTH_TOKEN` env var with `write:packages` scope (GitHub PAT). The root `.npmrc` routes `@synapsys-integrated` to `npm.pkg.github.com`.
- No SSH needed (publish uses HTTPS).

## Dry-run

```bash
bun changeset publish --dry-run    # show what would publish, no upload (does NOT show workspace:* rewrite though — release:wave is what actually does the rewrite)
```

Useful for previewing the version-bump → publish chain, but the dry-run only exercises bare Changesets, not the wave-orchestrated workspace:* rewrite. The first real `release:wave` run is the only thing that exercises the rewrite end-to-end.

## Gotchas observed 2026-06-04 (the "packages won't update" detour)

1. **`release:wave` cascade-skips any version already on GHP** (`isVersionAlreadyOnGhp`). If the on-disk versions already exist on the registry, it publishes NOTHING and exits 0 with "ALL 4 WAVES COMPLETE". "Nothing published" is NOT a failure — it means the version numbers didn't change. To ship current code you MUST bump versions forward (you cannot republish over an existing version).
2. **[FIXED 2026-07-19]** ~~A stale `.release-wave-state.json` silently skips every wave.~~ The script now (a) deletes the journal after a fully-completed run and (b) fingerprints it against the workspace version map — a journal from a different release self-discards on load. No manual deletion needed. See [[project_release_wave_state_file_footgun]].
3. **A published version ≠ the `latest` dist-tag.** Two divergent publish lineages (the dropped `56ed286b` "republish" commit's versions vs. the reconciled breaking-wave versions) left GHP with both sets published but `latest` pointing at the wrong one — so `bun install` (which pulls `latest`) got old code. ALWAYS verify `dist-tags.latest` against intent, not just version existence: `curl -H "Authorization: Bearer <tok>" https://npm.pkg.github.com/<pkg%2Fenc>` and read `["dist-tags"].latest`. Don't trust a "published to GHP" commit message — check the registry.
4. **Auth is read from `~/.npmrc`, NOT an env var.** `readAuthToken()` requires a single `//npm.pkg.github.com/:_authToken=<PAT>` line in `~/.npmrc` (read+write:packages). The earlier "NODE_AUTH_TOKEN" note above is the CI-workflow path; the local script reads `.npmrc`.

   **The token expires, and `gh auth login` does NOT refresh it (observed 2026-08-25).** The two credential stores are unrelated: `bun publish` reads `_authToken` from `.npmrc` (repo-local first, then `~/.npmrc`); `gh` writes `~/.config/gh/hosts.yml` and is never consulted. An expired classic `ghp_` PAT returns **401 on reads as well as writes**, so a plain metadata `curl` distinguishes a dead token from a missing scope in one call. Note the repo-local `synapsys-cve/.npmrc` carries only the registry mapping and no auth line — CI appends its own — so locally the credential comes entirely from `~/.npmrc`. Fix in one command (a `gho_` OAuth token publishes to GHP fine; default `gh auth login` scopes do NOT include `write:packages`):

   ```bash
   gh auth refresh -h github.com -s write:packages -s read:packages && \
     sed -i "s|^//npm.pkg.github.com/:_authToken=.*|//npm.pkg.github.com/:_authToken=$(gh auth token)|" ~/.npmrc
   ```

5. **Single-package publish is legitimate when the package has no `workspace:*` literals.** `release:wave` exists for the caret rewrite and the dep-graph ordering; a package whose cve deps are all peer/caret ranges (verified for cve-components 2026-08-25 — `grep workspace: packages/<pkg>/package.json` returns nothing) can ship with `bun publish --cwd packages/<pkg>`, preceded by `--dry-run`. Same artifact, no workspace-wide blast radius. Use it when you want to publish exactly one package and leave every other on-disk version untouched.

6. **Never infer a package's publish status from a consumer's lockfile.** Burned by this 2026-08-25: tmmaf declared `^0.2.0` for cve-dynamic-links while its lockfile and `node_modules` held `0.1.0`, which read as "0.2.0 is unpublished." It was published — the lockfile was simply stale and had never re-resolved. A stale lockfile and an unpublished version are indistinguishable from the consumer side. Ask the registry (gotcha 3's `curl`), never the lockfile.
7. **Manual version edit + `release:wave` works** — `changeset version` is not strictly required (the script reads on-disk versions). When lineages are tangled, a uniform forward bump is the clean escape hatch.
8. **`release:wave` publishes from the WORKING TREE, not git** — it reads on-disk package.json + builds each pkg, so it will happily publish from uncommitted changes. Running it before committing/pushing is a valid order: the publish is real, but git won't reflect it until you commit. Recovery from "published but uncommitted" is forward — commit the working tree (feat commit + `chore(release): version packages` commit) and push; do NOT re-publish. (Observed 2026-06-28: cve-mail 10.1.0 + 6-pkg cascade published this way; committed after the fact.)

**2026-06-04 resolution (superseded):** all 10 packages were reset to a uniform `10.0.0` baseline and republished via `release:wave`.

**GHP baseline as of 2026-08-25 (16 packages):** components **11.3.0** (`ConfirmDialog.layer` elevated rung), auth 14.1.0, admin 11.0.0, core 10.2.0, design-system 11.0.0, payment-processing 11.0.0, user-management 12.0.2, studio-extension 11.0.0, multilingual-workflow 10.0.3, mail 10.1.0, matchmaking 1.0.0, scheduling 0.5.0, storage 0.4.1, ruleset-engine 0.2.0, dynamic-links 0.2.0, articles 0.1.1. The 2026-07-19 `--color-fg-*` major wave and the payment `decorateReturnUrl` major both shipped; `.changeset/` is empty on main. Two packages exist that predate this memory's older lists: **cve-articles** and **cve-dynamic-links**. Since PR #24, tag-triggered `publish.yml` runs gates + `release:wave` (one canonical path) and fires only on `v*` tags — a plain branch push publishes nothing. `scripts/publish-if-unpublished.ts` (a fail-closed per-package guard) exists but is **not yet wired into** `publish.yml`.

## Trigger phase

Any phase that produces a new package version. Phase 19 (v1.1 release wave) did 9 packages coordinated. Plan 07.2-09 attempted Phase 07.2 release but used the wrong script; canonical path going forward is the 3-step `version → commit → release:wave` flow above.
