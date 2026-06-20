---
name: project_phase07_6_flow_uat_remaining
description: "Phase 07.6 flow-engine live-UAT fix queue — A/B done, C/D/E remaining; release paused until flow walking + gating are solid"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4d035440-9695-4bb7-bcc8-1c9c47946bdb
---

Phase 07.6 (server-authoritative flow engine) is implementation+security+code-review+verifier complete and committed on `gsd/v1.3-cve-auth-completion`, BUT live UAT in apps/cve-test-host surfaced a cluster of integration bugs. The MAJOR `release:wave` (cve-core+cve-components+cve-user-management) is PAUSED until these are fixed AND verified live. Release blocker also: 11 stale 07.4/07.5 changesets + version drift (see [[project_cve_release_publish_path]]) still need untangling before publish.

**DONE this session (committed):** ownership wiring, startInstance '' reject, create-user@2 guarded reseed (live), public demo guest-cookie (middleware), bug-2 forward-reset, bug-3 demo flow-input, queue parseToField schema, guard-on-seed opacity + fail-closed, unguarded full-map perf, @types/react+zod dedup (zod→peer; react override → fixed dual-React tests), and **A/B server-authoritative back-navigation** (transition() implements intent='back' via the `history` column → prior step + re-resolve guard + `fieldValues` from accumulated_state; client back() is now a server round-trip). See [[project_flow_definition_reseed_on_change]] and [[project_public_guest_actor_flows]].

**REMAINING (designed-fix pass, drive+verify with the running server — user grants server lifetime per-session, the auto-mode classifier blocks me from `bun run dev` until they say so):**
- VERIFY A/B live: walk demo name→Next→Back → name step shows committed value + advancing gives NO "Unrecognized key".
- C: `/flows/create-user` takeover route does NOT guard-gate its seed (Fix C only covered the admin modal) — a guest reaches the mode selector. Make the takeover route guard-gate via `resolveInitialStep`; unauthorized guarded-flow access → 404 (notFoundFallback) + NO instance created + unauthorized log.
- D: privileged-action gating is stale/client-side — delete button visible without `user:delete` + hydration error on UserDetailRoute (`{canDelete && <DeleteUserDialog>}`). Gate delete (and peers) SERVER-side + fresh per request (see [[feedback_ui_gates_server_side_only]]); investigate permission freshness (canCreate gated correctly, canDelete didn't).
- E (user-refined): invalid inputs must render INLINE at the field (red border + field message), NOT a thrown error in a box / 500. Client-side field validation on flow-input nodes + map server ZodError back to the specific field (advanceAction must catch ZodError → controlled per-field message, not 500).
- F: bulk-mode first-click-no-advance / double-POST — likely same body/position update lag; reproduce live under A.
