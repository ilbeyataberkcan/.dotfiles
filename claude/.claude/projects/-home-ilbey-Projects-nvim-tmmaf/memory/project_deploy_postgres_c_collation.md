---
name: project_deploy_postgres_c_collation
description: Deployed Postgres sorts by BYTES (alpine/musl) while local sorts linguistically — text ORDER BY needs an explicit tr-TR-x-icu collation
metadata: 
  node_type: memory
  type: project
  originSessionId: 7666ff48-49ce-4982-8686-f2784e70ab12
  modified: 2026-08-14T12:08:18.062Z
---

**Local and deployed Postgres do not sort the same way, and dev can never reproduce it.**

- Local: `postgres:16` (Debian/glibc), `datcollate = en_US.utf8` → `ahmet < Bora < çınar < İlbey < Zeynep`. Correct.
- Deploy (`deploy/compose.base.yml`): `postgres:17-alpine`, no `LANG`, no `POSTGRES_INITDB_ARGS`. It *reports* `datcollate = en_US.utf8` — **and still sorts by bytes**, because musl implements only C collation whatever the locale is named. Verified on a throwaway container: `Bora < Zeynep < ahmet < çınar < İlbey`.

Symptom the operator sees on staging/live: **every capital letter sorts ahead of every lowercase one**, and ç/ğ/ı/ö/ş/ü land after z. Reported 2026-08-14.

Both images are built `--with-icu`, so `collate "tr-TR-x-icu"` resolves everywhere and restores correct Turkish order on alpine. `lib/db/collation.ts` exports `trCollate(col)` for this; applied so far to **`lib/user-query-driver.ts`** (users table name/email) and the pending-applications sorts in **`lib/admin/get-staff-confirmation-module.tsx`**.

**~32 other text ORDER BYs in `lib/`+`app/` are still exposed** (catalog labels, clubs, event names — many are `sortOrder` first with a label tiebreaker, so the damage is limited to ties). Two durable fixes, neither applied:

1. `ALTER TABLE … ALTER COLUMN … TYPE text COLLATE "tr-TR-x-icu"` on the user-visible text columns — one migration, fixes every query touching them with no per-query change. Rewrites the affected indexes.
2. Recreate the deployed databases with `initdb --locale-provider=icu --icu-locale=tr-TR`. Needs dump/restore at a maintenance window.

Note the environments also differ by MAJOR VERSION (local 16 vs deployed 17) — worth closing separately.

Search predicates do NOT need this: `foldSearchText`'s SQL mirror (`lower(translate(col,'İIı','iii'))`) is collation-independent by construction. See [[project_registration_category_model]], [[tmmaf-deploy-hostnames]].
