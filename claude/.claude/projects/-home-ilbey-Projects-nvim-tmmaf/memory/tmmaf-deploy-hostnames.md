---
name: tmmaf-deploy-hostnames
description: tmmaf prod/staging hostnames (fighterscore.com) and the shared-parent-domain auth-cookie constraint
metadata: 
  node_type: memory
  type: project
  originSessionId: 6d06fccb-a423-4886-9a5e-365fcbda8a4a
---

The two-environment VPS deploy uses these hostnames (replacing the old
`mmaevent.blcdns.net` placeholder, which is retired):

- **live** = `fighterscore.com` (apex) → `/srv/tmmaf-live`, project `tmmaf-live`, image channel `:live`
- **staging** = `staging.fighterscore.com` → `/srv/tmmaf-staging`, project `tmmaf-staging`, image channel `:staging`
- proxy → `/srv/proxy`, project `tmmaf-proxy`. Greenfield setup (fresh VPS, no legacy `/srv/tmmaf`, no cutover).

Set on-server in `/srv/proxy/.env` (`STAGING_DOMAIN`, `LIVE_DOMAIN`, `ACME_EMAIL`)
and as GitHub Actions Variables (`LIVE_SITE_URL=https://fighterscore.com`,
`STAGING_SITE_URL=https://staging.fighterscore.com`). Nothing is hardcoded in the
repo — Caddy reads `{$VAR}`; CI bakes `NEXT_PUBLIC_SITE_URL` per branch.

**Why it matters (security):** both hosts share the parent domain `fighterscore.com`.
**How to apply:** keep auth cookies **host-scoped** — never set `Domain=.fighterscore.com`
(would leak sessions between staging and live). Keep `WEBAUTHN_RP_ID` the **exact host**
per env (`staging.fighterscore.com` vs `fighterscore.com`); passkeys must not cross hosts.
Better Auth defaults to host-only cookies + each env bakes its own `BETTER_AUTH_URL`, so
it's safe by default — just don't widen the cookie domain. Certs are per-hostname
(HTTP-01, no wildcard). Caddy sets `X-Robots-Tag: noindex` on staging. No catch-all
Caddy block. Branch model: work on `staging`, PR → protected `main` = promote to live.
See `deploy/RUNBOOK.md`.

**GHCR deploy-token expiry (seen 2026-08-19):** `tmmaf-deploy staging` dying with
`Error response from daemon: error from registry: denied` *before* the `==> Deploying`
line is the VPS's read-only GHCR PAT, not the images — that first failure is the
`docker pull :<channel>` inside `_tmmaf_resolve_tag`. Prove it is server-side by fetching
the manifest with your own token (`gh auth token` → `ghcr.io/token?scope=repository:synapsys-integrated/tmmaf:pull`
→ `GET /v2/synapsys-integrated/tmmaf/manifests/staging`); a 200 means re-login on the VPS:
`read -rs GHCR_PAT && print -r -- "$GHCR_PAT" | docker login ghcr.io -u <user> --password-stdin`
(`read -rs` keeps it out of history). Fine-grained PATs expire by design — see [[tmmaf-todo-docker-cred-helper]].
