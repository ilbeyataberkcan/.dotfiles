---
name: feedback-variant-url-path-segment-not-query
description: "Variants are selected by the first URL path segment (e.g. /tr-TR/home), NOT by a query parameter (?v=...). Direction comes from the variant's diff via cve-core's node-level `direction` field — there is no host-side direction wrapper."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: af583d0e-ad1a-4f36-8c60-b5cb6d638a92
---

The canonical CVE URL pattern for variant resolution is **path-prefix**: `/{variantKey}/{slug}`. The first path segment is the variant key (BCP-47 locale tag at Phase 25 — `tr-TR`, `en-US`, `ar-SA` — or a non-semantic dummy at Phase 20). The remainder is the page slug. Canonical render is the no-prefix case (`/home` → page `home`, no variant).

**Why:** This matches cve-multilingual-workflow's locked URL strategies (`'path-prefix'`, `'subdomain'`, `'query-param'`) — `path-prefix` is the most idiomatic and the one most multilingual hosts use. SEO canonicalization, hreflang, and bookmark-friendliness all work cleanly. Query-string variants (`?v=rtl`, `?lang=tr-TR`) are technically supported by the `query-param` strategy but are the fallback for CDN/framework-constrained hosts, not the canonical shape.

**Direction does NOT belong in the URL.** The HTML `dir="rtl"` attribute is emitted by cve-core's RenderEngine when a node in the resolved tree carries `direction: 'rtl'` at the node level (`StandardNode.direction` is part of the cve-core schema; Step 9 of `renderComponentNode.tsx` wraps the node in `<div dir="rtl">`). The variant's diff sets this field. There is no `?dir=rtl` query, no host-side direction wrapper, no helper function computing direction from variant keys.

**Three-layer separation:**

| Layer | Owns |
|---|---|
| cve-core | The HTML `dir=` emitter (StandardNode.direction + renderComponentNode Step 9) |
| cve-design-system | DirectionProvider — a React Context bridge for Radix primitives ONLY (Popover, Tooltip, Menu). NOT a direction-setting mechanism for the page. |
| cve-multilingual-workflow | `getLocaleDirection(tag)` policy — decides what direction SHOULD be for a given BCP-47 locale. cve-core ships zero policy. |

**How to apply at host page modules:**

- Route shape: `app/[[...slug]]/page.tsx` (optional catch-all). Parse `params.slug`:
  - If `slug[0]` is a known variant key for a page found at `slug[1:].join('/')`, render the variant.
  - Otherwise, treat the full `slug.join('/')` as the canonical page slug, no variant.
- Pass the resolved `variantKey` to `<RenderEngine variant={key}>`. The engine applies the variant's diff to the canonical tree. If the diff sets `direction: 'rtl'` on a node, the engine emits `<div dir="rtl">` around it. Tailwind logical utilities (`ms-*`, `me-*`, `text-start`/`text-end`) cascade from that wrapper.
- DirectionProvider from cve-design-system is NOT wired at the page level — wire it ONLY when the page uses Radix UI primitives that consume the direction Context.
- No host-side `directionForVariantKey()` helper. No `?v=` or `?dir=` query parameter. No `<DirectionProvider>` wrapper just for Tailwind logical utilities.

**For Phase 20 cold-start:**

- Dummy variant key (e.g. `'preview'`). One variant row whose diff includes `direction: 'rtl'` on a node — proves the cve-core direction emitter end-to-end.
- URL `/preview` (or `/preview/home`) → variant render with `dir="rtl"` wrapper.
- URL `/` (or `/home`) → canonical render, no `dir` attribute (cve-core emits the wrapper only when `direction` is set).
- Phase 25 swaps the dummy variant key for BCP-47 locale tags and wires cve-multilingual-workflow's `getLocaleDirection` to drive WHICH variant the diff uses (the diff content stays the host's policy; the locale → variant routing becomes mechanical).

**Counter-cases — when a host-page-level DirectionProvider IS justified:**

- The page renders Radix UI primitives that read direction from React Context.
- The host needs a single `dir` attribute on `<html>` or `<body>` for accessibility/i18n reasons that aren't covered by the cve-core node-level emission.

Neither applies at Phase 20.

**Related:** [[project-phase20-direction-deferred-to-p25]] (now superseded in part — the direction *render* is exercised at Phase 20 via the variant diff; the locale→direction *policy* is what gets deferred), [[feedback-direction-per-variant-not-route-group]] (route-group anti-pattern record), [[feedback-no-helper-for-static-placeholder]] (don't write helper modules for placeholder values).
