---
name: project-national-id-is-the-athlete-identifier
description: "Names are never identifiers in tmmaf — national ID is; nobody types their name twice, and two paths can still mint an athlete with no national ID"
metadata: 
  node_type: memory
  type: project
  originSessionId: 6b92de7a-b465-4df9-8bb0-a894b36cdb15
  modified: 2026-07-31T12:55:49.221Z
---

**Operator ruling, 2026-07-31:** names are never an identifier in tmmaf. A typo breaks them, and no
user should ever enter their name twice. **The national ID is the athlete identifier** — it is unique
in real life, which is exactly what an identifier needs to be.

Consequences found while verifying this:

- **`athletes.national_id` is nullable**, with a *partial* unique expression index
  (`regexp_replace("national_id", '\D','','g')` WHERE not null and not empty). `digitsOnly`
  (`lib/national-id.ts`) and `NATIONAL_ID_NORMALIZED_SQL` (`lib/db/schema/domain.ts`) already match
  exactly — `String.raw` is load-bearing there, a plain template literal would strip the letter D.
- **Two paths can still create an athlete with NO national ID.** The import engine hard-codes
  `nationalId: null` because the .xlsx contract has no TCKN column at all. And
  `lib/registration-profile-persistence.ts` inserts on `step-identity` gated only on
  `['legalName','dateOfBirth','gender']` — flow `requireFields` is **client chrome, not authority**.
- **`legalName` is load-bearing today**: persisted verbatim, it names the minted auth user, *and* it
  is the join key for the association fallback probe (`lower(legalName)` + club). It must be derived
  **server-side** by one rule shared with the probe, or whitespace drift from the import engine's
  normalization silently stops matching and coaches duplicate people already on file.
- **The name+club fallback probe cannot retire yet.** It exists precisely because import-created
  athletes carry NULL national IDs, so it is the only way to reach them. Retiring it requires a TCKN
  column in the federation's spreadsheet contract plus an operator backfill.

Operator pre-check before any NOT NULL move:
`SELECT count(*) FROM tmmaf_identity.athletes WHERE national_id IS NULL OR btrim(national_id) = ''`,
split by whether the row carries a registration. `db/operations/verify-coach-identity.psql` is the
precedent for that kind of script.

Note `isValidNationalId` bounds at `/^\d{9,12}$/`, so an alphanumeric passport cannot be entered —
flagged in-file as needing a federation answer.

Related: [[project_national_id_duplicates_are_test_residue]],
[[project_phase253_athlete_consent_parental_authority]], [[project_registrant_import_admin]]
</content>
