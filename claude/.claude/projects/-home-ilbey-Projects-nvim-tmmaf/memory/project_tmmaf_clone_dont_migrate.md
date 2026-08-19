---
name: project_tmmaf_clone_dont_migrate
description: "Prove a tmmaf test suite against unapplied migrations by cloning the DB with TEMPLATE, never by running db:migrate — and never trust a self-skipping suite as green"
metadata: 
  node_type: memory
  type: project
  originSessionId: 19d28b25-3265-464a-a020-5ac0463d7678
  modified: 2026-08-10T20:28:32.759Z
---

When tmmaf migrations are authored but the operator has not applied them, the suite is
unrunnable and agents are forbidden from `db:migrate`. The technique that works, used
independently by five agents across waves 3–4 with the real database verified untouched every
time:

```
psql -c 'CREATE DATABASE tmmaf_<purpose> TEMPLATE tmmaf'
# apply ONLY the pending migration SQL to the clone via psql
DATABASE_URL=<clone> bun run test
psql -c 'DROP DATABASE tmmaf_<purpose>'
```

Then verify the real `tmmaf` is untouched by TABLE PRESENCE (`to_regclass`), not by counting
`drizzle.__drizzle_migrations` — that table holds 67 rows while the highest applied migration is
0064 (two rows are residue from an old renumber, and three older migrations have hashes that no
longer match their edited files).

**Why it matters beyond convenience: a self-skipping suite is not a passing suite.** tmmaf's
DB-tier suites `describe.skipIf(!hasTable)`, so on an unmigrated database they report green while
testing nothing. Wave 3's gate nearly shipped **15 hidden referee failures** that way, and the only
reason they surfaced was an agent cloning instead of excusing the skips. Always enumerate the skips
and confirm none is migration-gated — the expected 15 in this repo are 8 live-Firefox Playwright,
3 `MAIL_SMTP_LIVE`, and 4 in the deprecated 7.2 registration-approval stub.

Related: [[project_tmmaf_drizzle_migration_ops]], [[feedback_verify_db_state_not_docs]],
[[project_tournament_day_operations_milestone]]
