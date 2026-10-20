---
name: tmmaf-npmrc-token-override
description: "tmmaf's committed .npmrc uses ${NODE_AUTH_TOKEN}, which overrides ~/.npmrc's GitHub token with empty when unset — 401 on all @synapsys-integrated packages"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2631afd8-1925-4e1f-b05a-5c81d3ec8dbc
  modified: 2026-08-07T16:05:55.869Z
---

tmmaf's committed `.npmrc` sets `//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}`. When
`NODE_AUTH_TOKEN` is unset, that interpolates to **empty and overrides** the working token in
`~/.npmrc` — so `bun install` 401s on all 13 private `@synapsys-integrated/cve-*` packages even
though a global token exists.

**Why:** the project file wins over the user file for the same registry key, so a present-but-unset
env var is worse than no project entry at all. The failure looks like a revoked token but isn't
necessarily one.

**How to apply:** on a fresh clone or worktree, `export NODE_AUTH_TOKEN=<PAT with read:packages>`
before `bun install`. To tell an unset-env failure from a genuinely dead token, test the PAT
directly — `curl -sI -H "Authorization: Bearer $T" https://api.github.com/user` — 401 there means
the token itself is expired/revoked (classic `ghp_` PATs expire). On 2026-08-07 the token in
`~/.npmrc` was in fact dead and needed reissuing.

A partial failure is destructive: bun still rewrites `node_modules/@synapsys-integrated/*` symlinks
to the new pinned versions, leaving them **dangling** — worse than the stale-but-working tree it
replaced. Re-run the install with auth to recover; the local `../synapsys-cve` source is not a
fallback since its versions sit below the `overrides` pins. See [[tmmaf-test-baseline-needs-docker]].
