---
name: project-website-layering-architecture
description: "Future website layering model — 4 z-axis layers (bottom→top) — main page content, second-layer page content (cve-studio panels), dialogs, notifications. Captured 2026-05-30, not yet implemented."
metadata: 
  node_type: memory
  type: project
  originSessionId: 9f5ea022-deed-45e9-8359-6bfe2c1495d0
---

The host website will be architected around four explicit z-axis layers. Order from bottom to top:

1. **Main Page Content** — the rendered page tree (RenderEngine output, route-level content).
2. **Second-Layer Page Content** — content that sits visually on top of the main page but is still "page-like" (NOT modal). Canonical example: cve-studio panels. Workbench, inspector, side-pane editors.
3. **Dialogs** — modal surfaces that block the page below. Step-up dialog, approval dialog, confirmation dialogs, full-page modals.
4. **Notifications** — toasts, banners, transient overlays. Always on top so a toast can surface over a dialog.

**Why:** Today the stacking discipline is ad-hoc — every package picks its own z-index in isolation and they compete. cve-studio panels, step-up/approval dialogs, and any future notification system need a documented contract so a dialog never lands under a studio panel, a toast never lands under a dialog, etc. This is the system-wide z-axis grammar that future package designs slot into.

**How to apply:**
- When introducing a new surface in a cve-* package, classify it into one of the four layers and use the layer's reserved z-index range (TBD when implementing).
- Studio-extension panels go in layer 2, not layer 1, not layer 3 — even though they often look like "second pages", they're not modal dialogs.
- Step-up dialog primitive (currently shipped in cve-auth/react) already behaves as layer 3; future dialog primitives should declare their layer the same way.
- A notifications/toast system (not yet built — likely a future cve-* package) sits at layer 4.
- Page-content from RenderEngine never reaches above layer 1 by itself; if a node needs to "pop above" (e.g. a sticky CTA), it's still layer 1 unless explicitly classified.

**Status:** Not yet implemented. Operator captured the intent on 2026-05-30 mid-Phase 07.2; future planning (likely a v1.4+ phase) will formalize the z-index reservation table and the per-package classification convention. Reference this memory when planning cve-studio Phase 8, notification primitives, or any new dialog/overlay surface.

Related: [[project_phase07_2_approval_stepup_primitives]] — current dialog primitives (ApprovalDialog + StepUpDialog) already behave as layer 3 implicitly; the explicit contract has not been written yet.
