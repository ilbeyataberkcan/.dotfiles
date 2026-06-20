---
name: tmmaf-todo-docker-cred-helper
description: DEFERRED — encrypt the VPS GHCR token with a Docker credential helper (pass); baseline chmod done
metadata: 
  node_type: memory
  type: project
  originSessionId: 6d06fccb-a423-4886-9a5e-365fcbda8a4a
---

On the tmmaf VPS, the GHCR pull token (`read:packages` PAT) is stored **base64,
not encrypted**, in `~/.docker/config.json` (Docker's "credentials stored
unencrypted" warning). The user **did the baseline hardening** (`chmod 700
~/.docker`, `chmod 600 ~/.docker/config.json`; token is read-only + short-lived)
and **deferred** the credential-helper step — asked to be reminded later.

**Why:** base64 ≠ encryption, so anyone who can read the file gets the token.
Blast radius is limited (read-only, packages-only), but encrypt-at-rest + silencing
the warning is still wanted eventually.
**How to apply:** install `pass gnupg golang-docker-credential-helpers`, create a
**passphraseless** GPG key (needed so non-interactive/systemd pulls work), `pass init
<keyid>`, add `"credsStore":"pass"` to `~/.docker/config.json`, then
`docker logout ghcr.io` + re-`docker login`. Surface this when we're next on the
deploy/server/security track. Related: [[tmmaf-deploy-hostnames]].
