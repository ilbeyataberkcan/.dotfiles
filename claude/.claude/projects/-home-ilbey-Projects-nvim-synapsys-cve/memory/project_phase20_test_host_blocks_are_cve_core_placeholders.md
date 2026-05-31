---
name: phase20-test-host-blocks-are-cve-core-placeholders
description: "apps/cve-test-host/lib/blocks/* (Section/Heading/RichText) are cve-core test fixtures — they intentionally do NOT consume cve-design-system tokens. Don't treat their lack of theme colors as a regression."
metadata: 
  node_type: memory
  type: project
  originSessionId: b1c4f5be-475f-4525-997c-dca65f400103
---

apps/cve-test-host/lib/blocks/{Section,Heading,RichText}.tsx use only generic utility classes (`p-lg`, `ms-md`, `text-2xl`, `font-semibold`, `text-start`). They are placeholders authored to validate cve-core: variant routing, sanitization round-trip, RTL/logical-property emission. They were never wearing cve-design-system semantic tokens (`bg-canvas`, `text-text-primary`, named accents, status ramps, etc.).

**Why:** User clarified at v1.2 P20 resume: "I checked the placeholder blocks. They are not suitable to be used with cve-design-system. Since they are just placeholders to test the cve-core implementation. However, since we have already implemented the cve-design-system, we should have been validated it." The Phase 20 Wave-7 "design-system regression" framing in `.planning/HANDOFF.json` (suspects: globals.css imports, transpilePackages, ThemeInjector flow) was misdirected — there is no regression because these blocks never consumed design-system tokens to begin with.

**How to apply:** Before debugging "design-system isn't showing through the host," check whether the test surface actually consumes design-system classes. The Phase 20 path forward is NOT to patch globals.css / transpilePackages / ThemeInjector — those wirings may all be correct. Instead, add a real validation surface (either: enrich the existing blocks with semantic token classes, OR ship a dedicated cve-design-system validation page consuming named accents + status ramps + typography tokens). Either way the test passes only when a page renders with visible design-system semantic styling, not when generic utility classes happen to resolve through Tailwind.

Related: [[project_phase20_resume_context]] · [[project_cve_design_system_0_5_0_shape]] · [[feedback_research_use_case_before_demolition]]
