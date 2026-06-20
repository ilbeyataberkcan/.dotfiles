# Memory Index

- [tmmaf test baseline needs docker](tmmaf-test-baseline-needs-docker.md) — 9-failure baseline only valid with tmmaf_pg + tmmaf_mailpit up; otherwise ~25 env failures
- [tmmaf deploy hostnames](tmmaf-deploy-hostnames.md) — live=fighterscore.com, staging=staging.fighterscore.com; shared-parent-domain → keep auth cookies host-scoped, WEBAUTHN_RP_ID exact-host per env
- [tmmaf TODO: docker cred helper](tmmaf-todo-docker-cred-helper.md) — DEFERRED: encrypt VPS GHCR token via pass credential helper; baseline chmod already done, remind later
- [tmmaf prelaunch live db read-only](tmmaf-prelaunch-live-db-readonly.md) — before real data: switch live DB GUI to ilbey_ro (read-only); live ilbey is RW + shares staging password for now
