---
name: project_flow_definition_reseed_on_change
description: Flow definitions are version-pinned/immutable — changing a tree needs a version BUMP + reseed or the live DB tree goes stale and guards never run
metadata: 
  node_type: memory
  type: project
  originSessionId: 4d035440-9695-4bb7-bcc8-1c9c47946bdb
---

cve-core flow definitions persist immutably in `cve_flows.flows`, and instances pin to `(flow_id, version)`. Editing a definition's tree **in source does NOT update the running DB** — the seed helpers skip-if-exists. This bit hard in Phase 07.6: Plan 06 added the `um-permission` + `um-stepup-fresh` guard nodes to `createUserFlowDefinition` (v1) **in place**, but the DB still held the pre-guard v1 tree, so at runtime create-user was UNGUARDED — the guards existed only in source, never executed. Unit tests missed it (fixtures use the source definition); only live testing caught it.

**The rule:** when you change a flow definition's tree, BUMP its `version` (v1→v2) and reseed — never mutate an existing version in place. The seed helper must check `findDefinitionBySlugAndVersion(slug, CURRENT_VERSION)` (specific version), NOT `findDefinitionBySlug` (any version, which skips forever once v1 exists). `findDefinitionBySlug` returns the HIGHEST version (`orderBy(desc(version))`), so new instances pick up the bumped guarded version automatically. Verify guards are LIVE by introspecting the persisted tree (`tree::text LIKE '%um-permission%'`), not just the source. Relates to [[feedback_verify_code_not_just_tests]] — green unit tests ≠ guarded at runtime.
