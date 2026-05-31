---
name: cve-core-render-engine-themed-subtree-node
description: "Future cve-core work — RenderEngine node type that mounts a ThemeScope around a subtree for isolated theming. Killer use case: sponsored sections that carry their own brand without bleeding to the host page."
metadata: 
  node_type: memory
  type: project
  originSessionId: b1c4f5be-475f-4525-997c-dca65f400103
---

User locked-in idea (2026-05-16, surfaced during Phase 20.6 design-system architecture pivot): introduce a cve-core RenderEngine node type (or a node-level capability) that mounts a `<ThemeScope tokens={...}>` around its subtree. The subtree renders with its own design tokens — different from the surrounding page — without affecting any sibling content.

**Killer use case:** sponsored sections on a content page. A federation tournament page hosts a sponsor card mid-article; the sponsor brings their own brand colors. With this node, the sponsor's section gets its own theme without breaking the rest of the page or requiring the host to author a sponsor-specific layout. Other use cases: white-labeled embedded widgets, dark/light contrast islands, A/B brand variants.

**Why this is the right pairing for runtime ThemeScope:** Phase 20.6 makes compile-time CSS generation the default for whole-page theming. ThemeScope/ThemeInjector survive as the runtime mechanism — and a RenderEngine node type is the cleanest way to expose them through the CVE tree contract. The host doesn't write the `<ThemeScope>` JSX manually; the editor (Studio) drops a `themed-subtree` node and authors the seed/tokens declaratively as part of the page content tree.

**How to apply:** When cve-core work resumes (Plan 20-08 or later phases), surface this idea before designing other new node-shape RFCs. Sketch shape:
- Node type: `themed-subtree` (or `theme-island`) — a `StandardNode` discriminant
- Schema: tokens (PartialThemeTokens) | seed (ThemeSeed) | reference to a named tenant theme
- Render path: cve-core's `renderComponentNode` wraps children in `<ThemeScope tokens={tokens}>` when this node type appears
- Studio editing: a panel that lets editors paste tokens or pick a saved theme

Don't propose this proactively in unrelated phases — it's a v1.2-or-later RFC. Surface when the user asks "what other RenderEngine features are coming?" or when sponsored-section / multi-brand use cases get discussed.

Related: [[project_phase20_resume_context]] · [[feedback_client_context_only_for_client_consumers]] (the ThemeScope-as-runtime-island stays valid because it has REAL client consumers in this design — Studio editing chrome AND the themed-subtree render path).
