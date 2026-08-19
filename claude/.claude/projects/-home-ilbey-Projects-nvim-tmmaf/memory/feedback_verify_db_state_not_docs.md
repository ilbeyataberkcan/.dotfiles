---
name: feedback_verify_db_state_not_docs
description: Never report migration/environment state from a phase doc — query the database; the docs go stale silently and I repeated a wrong blocker for a whole session
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9cf9af0e-4032-474f-ba3d-ec6befc6b524
  modified: 2026-08-13T05:52:57.230Z
---

I told the operator for an entire session that migrations 0054+0055 were unapplied and that
"~114 DB-backed tests abort in beforeAll", carrying it into three workflow prompts and every
status report. **It was false.** The operator pushed back ("we have more than 60 migrations, yet
you say I didn't migrate 54 and 55 — is that the synapsys-cve repo?") and they were right.

Verified 2026-08-05 on the local DB: `drizzle.__drizzle_migrations` has **63 rows**;
`event.consent_deadline`, `registration.agreement_status`, `coaches.national_id`,
`audit_log.on_behalf_of_user_id` and table `parent_athlete` all exist; and
`lib/__tests__/applicant-grid-data.test.ts` — the exact suite `25.3-VERIFICATION.md` cited as
aborting on `column "consent_deadline" does not exist` — runs **6 passed**. The full suite's
"7 skipped files / 18 skipped tests" are ordinary `.skip`s, not beforeAll aborts.

**Why:** the claim came from `25.3-VERIFICATION.md` (written 2026-07-31) and `NOTES.md`, which
were true when authored and silently went stale when the operator migrated. A phase doc records
what was true on its write date; it is not a live state oracle. Repeating it understated the
verification actually achieved (the DB-backed suites *were* covering the work) and would have
sent a release checklist chasing a step already done.

**How to apply:** before reporting ANY environment state — migrations, seeds, published package
versions, granted permissions — query the thing itself, and cite the query in the report.

```bash
DBU=$(grep -m1 '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d ' ' | sed 's#localhost:5433#localhost:5432#')
docker exec tmmaf_pg sh -lc "psql '$DBU' -tAc \"select count(*) from drizzle.__drizzle_migrations;\""
# then probe the SPECIFIC columns the migration adds — a count alone proves nothing about which ran
docker exec tmmaf_pg sh -lc "psql '$DBU' -tAc \"select count(*) from information_schema.columns where table_name='event' and column_name='consent_deadline';\""
```

Note the port: `.env.local` uses the host mapping **5433**, but inside the container it is
**5432** — and `psql -U postgres` fails outright, the role does not exist. Both cost a round trip.

The same rule killed the `UPLOAD_ON_BEHALF` blocker in this repo once already: the doc said the
delegated-upload route did not exist, and it had shipped in commit `763e2f92`. Two stale-doc
blockers in one phase is a pattern, not bad luck — see [[project_phase253_athlete_consent_parental_authority]]
and [[project_tmmaf_drizzle_migration_ops]].

**2026-08-13 — it cuts the OTHER way too, and that direction is more dangerous.** `STATE.md`'s
`last_activity` line asserted "migrations 0065-0068 are APPLIED LOCALLY" and named five tables as
present. Queried: only `medical_clearance` (from 0064) existed. The suite reported **13 failures,
all `relation … does not exist`** — and a doc claiming the migrations were already applied invites
exactly the wrong reflex, "fix the failing tests". `drizzle.__drizzle_migrations` still read 67
rows while the highest applied was 0064, so **the row count is renumber residue and is never a
checkpoint — test for TABLE PRESENCE**.

Working command (the recipe above needs `-U tmmaf`; `-U postgres` fails, that role does not exist):

```bash
docker exec tmmaf_pg psql -U tmmaf -d tmmaf -tAc \
  "select tablename from pg_tables where tablename in ('schedule_block','bracket_placement')"
```

Prove a suite on a clone instead of migrating the operator's database — `CREATE DATABASE x TEMPLATE
tmmaf`, psql the pending migrations in, run against it, drop it, then re-verify the real database is
untouched. Same run: 13 failures on the real DB, **0 on the clone**. See
[[project_tmmaf_clone_dont_migrate]].
