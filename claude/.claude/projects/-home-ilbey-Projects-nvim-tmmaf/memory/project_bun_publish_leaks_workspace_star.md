---
name: project-bun-publish-leaks-workspace-star
description: "bun publish ships bare `workspace:*` deps verbatim; changesets only rewrites workspace:^ and ~ — the live cve-payment-processing snapshot carries one, masked by tmmaf's overrides"
metadata: 
  node_type: memory
  type: project
  originSessionId: f13d6298-2df3-471a-93be-8c91cb396902
  modified: 2026-07-31T16:48:03.648Z
---

`bun publish` does **not** strip a bare `workspace:*` dependency spec, and changesets only rewrites
`workspace:^` and `workspace:~`. A package whose `package.json` says `"dep": "workspace:*"` therefore
ships that literal string to the registry.

**This already happened.** The `cve-payment-processing` snapshot currently pinned in tmmaf
(`0.0.0-payment-20260728223822`) ships `"@synapsys-integrated/cve-admin": "workspace:*"` in its
installed tarball. It only works because tmmaf's `package.json` `overrides` block pins cve-admin
independently and masks the unresolvable spec. A consumer without that override would fail to install.
Upstream: oven-sh/bun#24687.

**How to apply:** before publishing any `cve-*` package, hand-rewrite every `workspace:*` dependency to
a real caret range (e.g. `^13.0.0`) and verify the published tarball, not just the source tree. This is
a mandatory step in the snapshot path recorded in phase 25.3's plan 04 —
`bun changeset version --snapshot <tag>` does not do it for you.

**Related snapshot mechanics, verified in the installed tooling (2026-07-31):**
- `@changesets/apply-release-plan` gates its changeset-removal loop only on `releasePlan.preState`,
  never on the snapshot flag — so `changeset version --snapshot` **deletes every `.changeset/*.md`**,
  not just the one being released. `git restore .` after publishing is mandatory to discard the version
  writes *and* bring the still-owed pending changesets back.
- `release:wave` (`scripts/release-wave.ts`) spawns `bun publish` with **no `--tag`**, so a snapshot it
  shipped would take the `latest` dist-tag. Never use it for a snapshot.
- `changeset publish --tag` publishes every snapshot-versioned package, not the one you want alone. Use
  `bun publish --cwd packages/<name> --tag <tag>`.
- Snapshot version format is `0.0.0-<tag>-<YYYYMMDDHHMMSS>`.

Related: [[project_ghp_token_sourcing]], [[project_bun_dual_cve_core_store]],
[[project_phase253_athlete_consent_parental_authority]]
