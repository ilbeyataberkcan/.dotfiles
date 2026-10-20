---
name: tmmaf-national-id-backfill-guards
description: "national_id backfill guards are load-bearing — operator ruled backfill believing \"athletes always have a TCKN\", but the column is nullable and most rows are null"
metadata: 
  node_type: memory
  type: project
  originSessionId: ca6647e7-2149-4ad0-8fb2-08718d197a6c
  modified: 2026-09-02T16:15:12.003Z
---

On 02.09.2026 the operator ruled that a matched athlete's NULL columns should be
backfilled from the typed row, `national_id` included, reasoning that "athletes without
national_id is not possible in the system."

That premise is false. `athletes.national_id` is nullable (`lib/db/schema/domain.ts`,
migration 0000), its unique index is PARTIAL (`WHERE national_id IS NOT NULL AND <> ''`)
precisely because blank rows are expected, and the bulk sheet import deliberately creates
them (operator ruling 1, 02.09.2026 — a missing TCKN flags the row but still imports).
Measured in the local dev DB: **509 of 698 athletes (73%) have no national_id.**

So the two guards on the backfill are load-bearing, not defensive padding — without them
a stranger's TCKN can be permanently stamped onto a real athlete via a weaker-anchored
(e-mail / name) match:
1. only fill a column that is genuinely NULL, and
2. run `probeNationalIdConflict` before writing `national_id` — refuse if any other
   athlete/coach/parent row holds it — plus an audit row for every identifier write.

**Why:** a future reader told "athletes always have a TCKN" would see the conflict probe
as redundant and delete it. It is the only thing standing between a mistyped identifier
and silent corruption of a federation identity record.

**How to apply:** do not simplify the guards in `backfillAthleteIdentity`
(`lib/registrant-import/engine.ts`) away. If the invariant is ever genuinely wanted,
it needs a migration adding NOT NULL plus a backfill of the 500+ existing null rows —
that is a federation records decision, not a refactor.

Related: [[tmmaf-flow-guards-come-from-packages]]
