---
name: project-phase18-ships-package-functionality-only
description: "Phase 18 (cve-studio-extension variant authoring depth) ships package functionality only — actual Studio UI/UX design is owned by the host application using cve-design-system tokens, and a Studio-specific UI-SPEC.md is deferred to a later usability pass after the program is proven correct."
metadata: 
  node_type: memory
  type: project
  originSessionId: dac01726-6d19-4b35-b6e9-b5d4f6bcc471
---

P18 deliberately skips the `/gsd-plan-phase` UI gate via `--skip-ui`. The phase is a functionality update to `@synapsys-integrated/cve-studio-extension`: shared `renderComponentNode` helper extraction, variant authoring on the existing `StudioPreviewPanel` (N+1 cells, CSS-grid column track), `StudioPageDocument` shape alignment to P10 Path C-Strict, preview-architecture ADR, GATE-01 readiness evidence. No new visual design surface is introduced by the package — host applications wire the actual Studio UI using cve-design-system.

**Why:** Studio is a package; design ownership stays in host apps per the long-standing CVE rule (mechanism-vs-policy ADR, `docs/patterns/mechanism-vs-policy.md`). Forcing a UI-SPEC at this point would bias implementations toward a specific look the host doesn't have to honor. The Studio's own usability pass is a separate effort scheduled after the program is proven correct end-to-end.

**How to apply:** Do not regenerate `/gsd-ui-phase 18`, do not demand a UI-SPEC.md for this phase, and do not let the planner write visual/interaction copy. The planner's UI-relevant work for P18 is the preview-architecture ADR (an engineering artifact, not a visual spec) and the GATE-01 capability matrix. Surface "Studio usability UI-SPEC" as deferred work when the user asks "what's left to improve?" Compose with [[project-phase18-deferred-workflow-indicator]] and [[project-studio-variant-authoring-is-generic]].
