---
name: project_katalog_admin_redesign_deferred
description: "DEFERRED — admin \"Katalog\" page needs reusable catalog-table CRUD + attach-existing-weight-groups on class create + a better name; tied to event-creation renovation"
metadata: 
  node_type: memory
  type: project
  originSessionId: a661b985-7630-47d8-85af-18cda1d98564
---

Operator feedback (2026-06-22 UAT): the admin **Katalog** page as built in 7.2 "wasn't even close" to the vision. Deferred until the event-creation renovation is done; keep in mind:

- Needs proper pages to set up **reusable catalog tables** (weight groups, branches/Branş) as rows that can be reused across many events — not one-off per event.
- When creating a new **class**, it should offer to **attach already-existing weight groups** the same way you select a payment definition (pick-from-existing, not re-enter).
- The name **"Katalog" is OK but the operator doesn't love it** — find a better name when this is rebuilt.

Note: 7.2 left a NEW normalized `lib/admin/catalog-crud.ts` (12 use-server actions) AND a legacy `lib/admin/actions/catalog-crud.ts` (array-overlap in-use guard on retained legacy tables). The redesign should reconcile these. Relates to [[project_phase72_catalog_renormalization]].
