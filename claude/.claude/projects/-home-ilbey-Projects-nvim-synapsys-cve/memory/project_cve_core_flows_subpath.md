---
name: project-cve-core-flows-subpath
description: "Phase 07.3 cve-core flows is a sub-path export of cve-core (@synapsys-integrated/cve-core/flows), NOT a separate cve-flows package. Lives in packages/core/src/flows/. Locked 2026-05-30."
metadata: 
  node_type: memory
  type: project
  originSessionId: 9f5ea022-deed-45e9-8359-6bfe2c1495d0
---

The flows primitive feature (Phase 07.3 in v1.3) is a **sub-path export of cve-core**, not a standalone `cve-flows` package.

- Source location: `packages/core/src/flows/`
- Public export path: `@synapsys-integrated/cve-core/flows`
- Pattern parity: consistent with cve-core's existing `./drizzle` sub-path export ([[project_cve_core_drizzle_subpath_gap]]).

**Why:** Operator clarified 2026-05-30 — calling it "cve-flows" implies a standalone package, which it is NOT. It's a core foundation feature riding inside cve-core, surfaced as a sub-path so consumers can opt into the flows surface without pulling in the entire core barrel.

**How to apply:**
- When the user says "flows", "cve-flows", or "flows primitive" in this codebase, default to the cve-core sub-path. Don't propose new `packages/cve-flows/` directories or new workspace package entries.
- When planning Phase 07.3 (or any future flows work), the package boundary IS cve-core. Plans land in `.planning/phases/07.3-cve-core-flows-primitive/`. Source lands under `packages/core/src/flows/`.
- The flows phase needs its own spec → discuss → plan → execute cycle. NOT a quick task. NOT eligible for inline implementation without spec resolution first.
- Phase 07.4 (Create User Modal) consumes this; it depends on Phase 07.3 landing first.

**Related decisions:**
- Phase numbering: original 07.3 (Create User Modal) bumped to 07.4 on 2026-05-30 to make room for 07.3 cve-core flows as the prerequisite.
- Requirement ID: `CORE-FLOWS-PRIMITIVE` in REQUIREMENTS.md (tentative; spec-phase may refine).

**Status:** Phase row inserted in ROADMAP.md, REQUIREMENTS.md, STATE.md; phase directory created at `.planning/phases/07.3-cve-core-flows-primitive/`. Awaiting `/gsd:spec-phase 07.3` in a fresh session.
