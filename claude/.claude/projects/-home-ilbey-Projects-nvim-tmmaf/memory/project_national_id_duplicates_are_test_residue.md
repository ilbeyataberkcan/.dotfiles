---
name: project-national-id-duplicates-are-test-residue
description: "The duplicate athlete national_ids on the local tmmaf DB are Playwright test residue, and the root cause is that identity is resolved by userId, never by national ID"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4090539e-7acd-45ef-8678-2fd8eced67a5
  modified: 2026-07-30T15:43:56.592Z
---

Investigated 2026-07-30 (read-only) because the operator asked why the database held duplicate
national IDs when it must be a life-unique identifier.

**Root cause (source, not data):** nothing has ever treated `athletes.national_id` as an identity key.
Plain nullable text, **zero indexes**, and all three live write paths answer "does this athlete
already exist?" by looking up the **user** — never the national ID. So a second account always mints a
second athlete row and the repeated national ID is simply never checked. Not a bug in one writer: an
absent constraint. Two aggravating facts — the admin .xlsx import has **no national-ID column** at all
(it matches on name + club), and import-created athletes carry `national_id = NULL`, so a partial
unique index will not constrain them and a national-ID probe can never match one.

**What the local rows actually were** (measured 2026-07-30 by `db/operations/verify-coach-identity.psql`,
which supersedes the earlier research probe): 2 groups, 11 rows (7 and 4), **byte-identical true
collisions, not format variance**, and synthetic — one group all `example.com`, one all
`qa-tmmaf.test`, each group one name initial + one birth year, every row created within minutes of
its siblings. Zero weigh-ins on all 11.

**Correction to the earlier probe:** they are NOT history-free. **9 of the 11 carry a registration,
and the 4-row group also carries a document snapshot each.** The nulling recommendation still holds,
but for the right reason: setting `national_id = NULL` touches no registration, snapshot or payment
row, so it is lossless *regardless* of attached history — whereas deleting a row would destroy a
competition record. Never justify a cleanup with "there's no history"; check, and prefer the option
that cannot lose data either way.

**Why it matters operationally:** migration `0054`'s unique index aborts `bun run db:migrate` on any
environment still holding duplicates — including the developer's own machine. Cleanup is the
operator's exclusive authority ([[feedback_never_reset_db]]); the safest provable option is nulling
the national ID on all but one row per group. Do NOT auto-merge as a general rule — it was only
harmless here because there was no history attached.

The normalizing alphabet is **digits-only (`\D`)**, and the pre-check query, the shared normalizer and
the unique index must all use the same expression or the pre-check returns clean while the migration
still aborts. That fork was caught during planning and is worth re-checking on any future change.

Related: [[project_phase252_coach_accounts]], [[project_tmmaf_drizzle_migration_ops]]
