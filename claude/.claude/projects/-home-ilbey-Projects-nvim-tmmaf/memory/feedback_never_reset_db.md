---
name: feedback_never_reset_db
description: "Never reset/clean/delete DB rows after a change — only seed (idempotent); cleaning is the user's authority"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0a786c21-2a6b-4a3c-87a7-31c9975610f7
---

Never DELETE/reset/clean database tables or rows as part of making a change — only seed (idempotently). Cleaning the database is the user's authority alone.

**Why:** The user loses important findings and testing progress when I (or subagents) wipe `cve_flows.flow_instances` / delete old flow-definition versions to "clear stale data" after a flow change. Their in-progress instances and live observations are valuable.

**How to apply:** When changing a flow definition, bump the version and run the idempotent seed (e.g. `bun scripts/seed-registration-flow.ts`) — the seed guards on the specific version, so a bump inserts the new version while older versions and all existing instances stay intact. Never run `DELETE FROM ...` on flow_instances/definitions or any table to tidy up. If stale data seems to be a problem, surface it and let the user decide whether to clean. Tell subagents the same. Relates to [[feedback_fix_properly_system_wide]].
