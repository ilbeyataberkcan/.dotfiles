---
name: project_event_permissions_hardening
description: Two deferred event-permission hardenings (route event gates through StrictPermissionResolver; upstream server-authoritative permission registry the role dialog reads) + wildcard-deprecation constraint
metadata: 
  node_type: memory
  type: project
  originSessionId: 588b29ea-5025-4924-9988-5d73df26ca3d
---

Granular `event:*` permission model shipped 2026-06-23 (quick task 260623-ke4): keys in `lib/admin/event-permissions.ts`, server gates in `lib/admin/event-authz.ts` (requireEventPermission / callerHasEventPermission / callerCanAuthorEvent / resolveEventGrants), registered into bootstrap `ALL_PERMISSIONS` + an `event-manager` role, enforced on routes/nav/actions + RSC-omit, client catalog mirror in `lib/admin/event-permission-catalog.ts`. See [[reference_cve_auth_authz_model]].

**Two deferred hardenings (operator-approved 2026-06-23):**

1. **Route event gates through `StrictPermissionResolver` (like user-management's USERMGMT_PERMISSION_RESOLVER), not plain `authService.hasPermission`.** Today event gates use plain `hasPermission`, where a wildcard grant would satisfy any event key. With wildcards deprecated this is moot in practice, but the strict resolver (gateHighRiskByDefault) makes high-risk event actions (publish/delete/status — registered `riskLevel:'high'`) satisfiable ONLY by an exact literal grant. Defense-in-depth.

2. **Upstream (cve-auth / cve-user-management): role dialog should read a SERVER-authoritative permission registry (via RSC/API), not a per-bundle CLIENT singleton the host must hand-mirror.** Eliminates the mirror-drift class of bug (host forgets to register a client catalog → keys invisible/unmanageable in the role editor, orphan grants). Not a security fix — authz is already server-authoritative — a robustness/maintainability fix. Cross-repo (synapsys-cve).

**Bulk ops + archive (shipped 260623-ke4, 2026-06-23):** bulk event actions are a DISTINCT elevated capability — keys `event:delete:bulk` + `event:status:bulk`, each requiring a FRESH step-up (mirrors storage:purge: STEP_UP_MAP + exported levels in lib/step-up-policy.ts; `requireBulkEventAuthority` server gate → discriminated `step-up-required`; client `openStepUp` re-submit). Levels: bulk delete = high-impact (60s, irreversible), bulk status = admin (3600s). **Archive = soft-delete (operator decision over destructive cascade — preserves auditability):** lifecycleState `'archived'` (text col, NO migration; only `'open'` is registrable so archived auto-excluded). Archive works for events WITH applications (no cascade); hard delete stays cleanup-only and REFUSES events with applications (guards BOTH registration.eventId AND legacy registration→division→event). Arşiv table/pages DEFERRED.

**Event lifecycle model (operator, 2026-06-23):** single source of truth `lib/event-lifecycle.ts` — ordered stages `ready` (was 'draft') → `applications_open` (was 'open', = EVENT_REGISTRABLE_STATE, the ONLY registrable state) → `applications_closed` (was 'closed') → `weigh_in` → `event_started` → `event_ended`; `archived` off the linear flow. `event.lifecycle_state` is free text (no enum). Admin Events page lists the 6 linear stages (archived excluded; in-progress creation flows live on Taslaklar as flow instances, NOT event rows). Migration 0018 renamed existing rows (event table ONLY — division.lifecycle_state 'open' is a DIFFERENT table, untouched). Per-row status dropdown = full stage control; bulk bar curated (open/close/archive + delete). These states will drive per-stage event-flow behavior LATER (auto-transitions, gating) — defined now, behavior later.

**Constraint — wildcard grants are DEPRECATED (operator, 2026-06-23):** no longer accepted; operator will clean up remaining `*`/`resource:*` traces in the codebase. New code must never grant or depend on wildcard cover.

**Why:** the operator flagged that authz honoring keys absent from the PermissionRegistry felt like a gap; investigation confirmed authz is correctly grant-based + server-authoritative (no gap), but surfaced these two real robustness/defense improvements.
**How to apply:** when resuming, remind the operator before staging push if not yet done; (1) is host-side, (2) is upstream synapsys-cve.
