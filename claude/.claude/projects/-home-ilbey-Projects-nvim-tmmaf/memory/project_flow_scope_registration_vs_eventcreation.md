---
name: project_flow_scope_registration_vs_eventcreation
description: "Registration flow has a design & must be fixed; event-creation flow is being rebuilt by the operator — don't polish its UI"
metadata: 
  node_type: memory
  type: project
  originSessionId: a661b985-7630-47d8-85af-18cda1d98564
---

During 7.2 UAT (2026-06-22) the operator clarified flow-UI ownership:

- **Athlete registration flow** ALREADY has an approved design. When it regresses, FIX it back to how it should be (e.g. the 07.2-06 double category-step chrome: duplicate header/description + duplicate Geri/DEVAM buttons). Do not treat registration-flow UI as "don't touch."
- **Admin event-creation flow** is being REBUILT by the operator with new UI designs. Do NOT spend effort polishing its UI/rendering — only its server-side functionality (server actions, terminal fold, normalized queries). This is the flow that was at the 07.2-10 checkpoint.

"Don't waste time on the flow" from the operator referred to the event-creation flow, NOT registration.

Relates to [[project_registration_flow_is_signup]], [[project_client_bundle_server_import_poison]].
