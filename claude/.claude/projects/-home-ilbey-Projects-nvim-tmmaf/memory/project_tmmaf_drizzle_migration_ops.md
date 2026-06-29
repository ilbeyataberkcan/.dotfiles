---
name: project_tmmaf_drizzle_migration_ops
description: "How DB migrations actually work in tmmaf — Drizzle Studio (no psql), agent env lacks DATABASE_URL, cross-schema FK + custom-migration authoring gotchas"
metadata:
  node_type: memory
  type: project
  originSessionId: 2dfac3df-0d7a-40b1-a3ad-facc98452c69
---

Operating facts for tmmaf Drizzle migrations (learned executing Phase 7 gap plans, 2026-06-14):

- **Verify the DB via Drizzle Studio, not psql.** The user has NO `psql`. For DB verification give Studio SQL-console queries against `information_schema` (e.g. `table_constraints`, `columns.is_nullable`), NOT `\dt`/`\d`. `bun run db:studio` opens https://local.drizzle.studio; `tmmaf_storage` etc. are in the config `schemaFilter`.
- **Agent/orchestrator Bash env has no `DATABASE_URL`.** drizzle.config.ts throws "DATABASE_URL environment variable is required" at load, so `drizzle-kit generate/migrate/studio` can't be run by me or executors — bun only loads it from the user's `.env` in their own shell. So: agents AUTHOR migration files; the OPERATOR runs `bun run db:migrate`. Migrations are operator-gated (consistent with "never reset the DB").
- **Cross-schema FK (tmmaf_storage → tmmaf_competition) can't use Drizzle `.references()`** — it would cycle (`domain.ts` already imports `files` from `storage.ts`). Pattern: type the FK column as `uuid` (MUST match the referenced uuid PK — Postgres rejects a `text→uuid` FK), declare it plain (no `.references()`), and add the `ON DELETE CASCADE` constraint as a raw-SQL `ALTER TABLE … ADD CONSTRAINT` in the migration.
- **Hand-author the migration; `db:generate` is unusable here.** Snapshot files (`meta/NNNN_snapshot.json`) FREEZE at `0010` — every migration `0011`→`0023+` is hand-authored as `NNNN_name.sql` + a `meta/_journal.json` entry ONLY (`idx`+1, `when` strictly greater than the last, `version:"7"`, `breakpoints:true`), with NO snapshot. Because the snapshot chain is stuck at 0010, `bun --bun drizzle-kit generate` diffs the whole schema against 0010 and drowns in interactive create/rename prompts — which throw "Interactive prompts require a TTY" in a non-TTY agent shell (a placeholder DATABASE_URL satisfies the config guard but doesn't help; generate never connects). So don't try to generate — write the SQL by hand (`ALTER TABLE "schema"."table" ADD COLUMN …;--> statement-breakpoint`) and add the journal entry. `db:migrate` only reads journal+sql, so a missing snapshot is fine. Verified again 2026-06-26 adding `registration.club_name` (migration 0023).
- **An applied migration is immutable.** Once a migration is journal-recorded, editing its `.sql` and re-running `db:migrate` is a NO-OP (drizzle skips applied migrations by `when` timestamp). To add a forgotten constraint, make a NEW migration — don't append to the applied one, and remove any stray append from it (a fresh DB would double-apply). This is exactly how 0007 (tables) + 0008 (cross-schema FK cascades) got split.

Related: [[project_storage_document_model_redesign]], [[feedback_never_reset_db]], [[project_db_driver_abstraction_debt]].
