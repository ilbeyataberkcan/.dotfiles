---
name: feedback-direction-per-variant-not-route-group
description: DirectionProvider mounts per-variant via RenderEngine — never split routes into (ltr)/(rtl) route groups
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

DirectionProvider mounts **inside the host page** wrapping RenderEngine output, **not** at the route-group layer (`app/(ltr)/` + `app/(rtl)/`). A single page route — `app/[...slug]/page.tsx` or equivalent — renders the persisted tree once and wraps the engine in `<DirectionProvider dir={...}>`.

**Why:** Route-group bifurcation duplicates every page (canonical + RTL twin) for the lifetime of the app — a maintenance death-spiral, breaks SEO canonicalization, and locks the workflow package out of the locale→direction binding it already owns. The correct abstraction layer is the host page module, not the Next.js segment tree.

**How to apply:**
- Reject any plan that mounts DirectionProvider at the route-group layer.
- A single `app/page.tsx` (or `app/[...slug]/page.tsx`) is the canonical DirectionProvider consumer. The `dir` prop is computed in the page module and passed to DirectionProvider as a prop.
- Import path is the `/direction` subpath of `@synapsys-integrated/cve-design-system` — not the root barrel (P-02 — load-bearing requirement).

**On where `dir` comes from — refinement (see [[project-phase20-direction-deferred-to-p25]]):**
- This memory's earlier framing "direction is a variant axis" was imprecise. Variants are content policy; the variant key is opaque to cve-core. It is `cve-multilingual-workflow` that gives some variant keys (BCP-47 locale tags like `'tr-TR'`, `'ar-SA'`) a derived direction via `getLocaleDirection(tag)`.
- Foundation phases (Phase 20) should NOT invent a direction-encoding convention at the variant-key level (no `'rtl'` literal, no `'lang:ar.dir:rtl'` compound). Default to static `'ltr'`; defer the real binding to Phase 25 when `cve-multilingual-workflow` is integrated.
- Phase 25 then rewrites the host's direction helper to call `getLocaleDirection` against locale-tagged variants.
