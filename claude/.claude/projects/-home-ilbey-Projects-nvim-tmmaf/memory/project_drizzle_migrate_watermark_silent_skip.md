---
name: project_drizzle_migrate_watermark_silent_skip
description: drizzle-kit migrate skips any migration whose journal `when` is below max(created_at) in the ledger — and still prints "migrations applied successfully"
metadata:
  type: project
---

`drizzle-kit migrate` decides what to apply by a WATERMARK: it applies only journal entries whose
`when` is greater than `max(created_at)` in `drizzle.__drizzle_migrations`. It does **not** diff by
hash. A migration below the watermark is skipped **silently and still reports
`[✓] migrations applied successfully!`**.

Discovered 2026-08-20 in `tmmaf-tsu` while applying `0074` + `0075`. Two ledger rows (ids 77, 78,
hashes `e11b7684…` / `799ec630…`) matched **no migration file in the repo** and were dated Aug 22–23,
ahead of every journal entry. They poisoned the watermark, so `0074` had been un-appliable since it
was authored — the operator's standing "run `bun run db:migrate` for 0074" instruction would have
no-op'd for them too, with a success message. Fixed by backing the two rows up and deleting them;
both migrations then applied for real.

**Never trust the success line — verify by schema query.** `select column_default …` /
`information_schema.tables`, not the ledger row count. Row count is useless here: this DB has 78
ledger rows against 76 journal entries, so counting "proves" nothing. See
[[feedback_verify_db_state_not_docs]] and [[project_tmmaf_drizzle_migration_ops]].

**LIVE TRAP for the next migration.** This repo hand-authors `when` (CLAUDE.md: the agent writes the
SQL *and* the `_journal.json` entry) and the values are synthetic forward-dated stamps, not real
clock. Real `Date.now()` in Aug 2026 is ~1787.2e9, BELOW every recent stamp, so a
`drizzle-kit generate`-produced migration is **silently skipped**. Any new migration must carry a
`when` above the ledger max, continuing the +1000ms-per-migration pattern.

**Watermark as of 2026-08-21 (local `tmmaf`): 1787474299111.** 82 ledger rows against 74 journal
entries — 8 rows whose hashes match no file, all distinct, two of them (`…298111`, `…299111`) sitting
ABOVE `0073` (`1787474297111`). So `0074` needs `when` > **1787474299111**. Read the live watermark
before authoring, never this number: each environment carries its own phantom rows.

Diagnose which files are actually applied by hash, never by count:
`sha256sum db/migrations/00NN_*.sql` and match the first 16 chars against
`select left(hash,16), created_at from drizzle.__drizzle_migrations order by created_at desc`.
