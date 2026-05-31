---
name: synapsysintegrated-deprecated
description: "synapsysintegrated is deprecated as of 2026-05-21 — archive-only; NEVER migrate it to new package versions; its current state is the negative reference, not a migration target"
metadata: 
  node_type: memory
  type: project
  originSessionId: c71b8f93-4f73-4f51-911a-8222346f6dc5
---

User locked 2026-05-21 (during Phase 22.5 spec-phase): `synapsysintegrated` is **deprecated as of 2026-05-21**. It is kept for archive purposes only. **It is NOT migrated to new cve-* package versions.**

**What this changes:**
- Future cve-* package bumps DO NOT include a synapsysintegrated migration step.
- Phase 22.5 (cve-auth@0.5.0 redesign) does NOT migrate synapsysintegrated; the deliverable list shrinks by ~1 day of work.
- `apps/cve-test-host/` is now the **only** consumer that follows new releases.
- Existing memory `project_synapsysintegrated_schema_lag.md` ("synapsysintegrated's pages schema is v1.0-shape") was correct at the time but is now superseded — synapsysintegrated will not catch up.

**Still valid uses of synapsysintegrated:**
- Negative reference for "what NOT to do" (e.g., 5 UI sites bind directly to BA's React client — that pattern is now an architectural learning, not a constraint to satisfy)
- Historical artifact for prior decisions (Better Auth driver pattern, dual singleton)
- Code patterns that PREDATE the deprecation can still be cited

**Invalid uses going forward:**
- Do NOT propose migrating synapsysintegrated in any phase plan.
- Do NOT use synapsysintegrated as a "must support" target for new package APIs.
- Do NOT cite synapsysintegrated's current call patterns as constraints on the new design (e.g., "we can't remove `requestMagicLink` because synapsysintegrated calls it" — irrelevant, synapsysintegrated is frozen).

**How to apply:**
- When scoping any new cve-* release, the consumer set is `apps/cve-test-host/` only.
- When recommending breaking changes, the only "migration target" is cve-test-host.
- The architectural critiques surfaced during Phase 23 (parallel-API rot, dual writes) need fixing for FUTURE consumers, not because synapsysintegrated demands it.
