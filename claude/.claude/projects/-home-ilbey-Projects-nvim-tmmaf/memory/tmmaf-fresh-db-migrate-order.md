---
name: tmmaf-fresh-db-migrate-order
description: Bringing up a fresh tmmaf postgres needs migrate-bootstrap first and a seed order the seed chain does not encode
metadata: 
  node_type: memory
  type: project
  originSessionId: 2f6cdb3d-8843-4bae-b8b8-9603b9c4c341
  modified: 2026-08-25T14:21:34.928Z
---

A genuinely fresh tmmaf database (recreated volume) needs three things the obvious commands do not
give you.

**1. Schemas the migrations never create.** Migration `0000` creates six schemas then immediately
`CREATE TABLE "cve_auth"."accounts"`. Nothing in the 84-migration set ever creates `cve_auth`,
`cve_flows`, `cve_mail` or `cve_pages` — they are package-owned and provisioned by
`scripts/migrate-bootstrap.ts`. `Dockerfile:97` runs it; `package.json`'s `db:migrate` historically
did not, so migrate died with `3F000 schema "cve_auth" does not exist`. It had never surfaced
because `drizzle-kit push` silently creates schemas in dev — the script's own docblock says so.
Fixed 2026-08-25 by making `db:migrate` mirror the Dockerfile: bootstrap && migrate && verify.

**2. drizzle-kit hides the real error.** It prints the failing `CREATE TABLE` as the message and
exits 1; the actual `PostgresError` is one level down in `.cause`. Unwrap it or you learn nothing.

**3. Seed order the `seed` script does not encode.** `BOOTSTRAP_ADMIN_EMAIL` is absent from
`.env.local` (its value is hardcoded as the default in `scripts/seed-payment-roles.ts:21`), and
`seed-competition` aborts unless the payment fixture exists. Working order:
`seed:admin` → `seed:payment-fixture` → `seed`.

**Why:** the deploy path was always correct; only the local path was broken, and only on a database
fresh enough to lack what `push` had created years earlier.

**How to apply:** never conclude "migrations are broken" from drizzle-kit's own output — unwrap
`.cause` first. Recreating the local volume is the operator's call; `docker compose down -v` is
never the way. See [[tmmaf-test-baseline-needs-docker]] for what a healthy suite looks like after.
