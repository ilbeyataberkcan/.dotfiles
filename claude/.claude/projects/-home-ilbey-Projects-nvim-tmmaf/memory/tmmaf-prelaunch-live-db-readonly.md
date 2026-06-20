---
name: tmmaf-prelaunch-live-db-readonly
description: PRE-LAUNCH TODO — lock the live DB GUI access back to read-only before real athlete data lands
metadata: 
  node_type: memory
  type: project
  originSessionId: 6d06fccb-a423-4886-9a5e-365fcbda8a4a
---

During setup (pre-launch, 2026-06) the live DB GUI access was deliberately left
**read-write**. Two RW login roles exist on live `tmmaf-live-db-1`, both with
`pg_read_all_data` + `pg_write_all_data`:
- `ilbey` — operator role (the read-only `ilbey_ro` was dropped and this created in its place).
- `orkun` — main server-admin role, created on BOTH `tmmaf-staging-db-1` and
  `tmmaf-live-db-1` with the SAME password (one shared admin credential).

**Why:** read-only on live prevents accidental edits to real production/KVKK data —
a launch-time concern, intentionally deferred while there's no real data yet.
**How to apply (before going live with real athlete data):** CREATE a read-only role
on live (`CREATE ROLE live_ro LOGIN PASSWORD '…'; GRANT CONNECT ON DATABASE tmmaf;
GRANT pg_read_all_data; ALTER ROLE live_ro BYPASSRLS;`) and point the live pgAdmin
connection at it instead of the RW roles; revoke write (`pg_write_all_data`) from BOTH
`ilbey` AND `orkun` on live.

**RLS gotcha (critical):** most schemas (cve_auth, cve_flows, etc.) have ROW LEVEL
SECURITY enabled with a single permissive policy scoped `TO "tmmaf"` (the app/superuser
role). `pg_read_all_data` does NOT bypass RLS, so any GUI role (`orkun`, `ilbey`, a
future `live_ro`) sees ZERO rows until it gets the `BYPASSRLS` role attribute. `orkun`
and `ilbey` were granted `BYPASSRLS` on both dbs so pgAdmin can see/edit data. A
read-only role MUST also have `BYPASSRLS` (else it's blind, not just non-writing);
read-only is enforced by withholding `pg_write_all_data`, not by RLS. DB access is via SSH tunnel to the db **container IP**
(no published port; db stays internal/no-egress). Related: [[tmmaf-deploy-hostnames]].
