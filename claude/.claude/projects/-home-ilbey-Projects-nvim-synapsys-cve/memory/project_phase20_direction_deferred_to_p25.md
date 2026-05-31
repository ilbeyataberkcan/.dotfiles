---
name: project-phase20-direction-deferred-to-p25
description: "Phase 20 foundation does NOT wire variant-key → direction binding; that's cve-multilingual-workflow's job at Phase 25. Variant primitive is exercised in Phase 20 with a dummy variant key; DirectionProvider always emits 'ltr'."
metadata: 
  node_type: memory
  type: project
  originSessionId: af583d0e-ad1a-4f36-8c60-b5cb6d638a92
---

The variant system and the DirectionProvider are **orthogonal axes**, not a coupled binding.

- **Variant primitive** = content policy. A `page_variants` row carries a `variantKey` + a `diff: VariantDiffOp[]` that overrides nodes/props in the canonical tree. The variant key is opaque to cve-core (just `z.string().min(1)`).
- **Direction primitive** = locale-derived. `cve-multilingual-workflow` (already published @0.2.0) owns `getLocaleDirection(tag: LocaleTag): 'ltr' | 'rtl'` — checks the BCP-47 tag's script subtag against `RTL_SCRIPTS`, then the base language against `RTL_LANGUAGES`. The variant key, when interpreted as a locale tag, drives this lookup at Phase 25.

**Why:** Earlier framing ("direction is a variant axis" — see [[feedback-direction-per-variant-not-route-group]]) was a correction against route-group bifurcation, NOT a license to invent a direction-encoding convention at the variant-key level. The variant key is meaningful only insofar as it identifies content; it is `cve-multilingual-workflow` that gives some variant keys (BCP-47 tags) a derived direction. Inventing direction-literal keys like `'rtl'` or compound keys like `'lang:ar.dir:rtl'` is a foundation-phase anti-pattern — it bypasses the workflow package and embeds a private convention that Phase 25 must then un-do.

**How to apply at Phase 20 (foundation):**

1. Variant primitive exercised end-to-end with a **dummy variant key** (e.g. `'preview'`, `'test-variant'`, or similar non-semantic literal). The variant row carries a small content diff (e.g. `override_props` on the heading text) to prove URL-keyed resolution flips the rendered output.
2. `lib/variant-direction.ts` exports `directionForVariantKey(): 'ltr'` — static, takes no input or accepts and ignores it. JSDoc clearly states: "Phase 25 swaps this with `getLocaleDirection` from `cve-multilingual-workflow` once locale-tagged variant keys exist."
3. `DirectionProvider` in the page module wraps `<RenderEngine>` with `dir="ltr"` always at Phase 20. The wiring proves P-02 (subpath import load-bearing) and the architectural shape, but no RTL render is demonstrated yet.
4. HOST-01 SC#3 (RTL+LTR both renderable) **shifts to Phase 25** when locale variants and `getLocaleDirection` are wired together. Phase 20's success criterion narrows to "DirectionProvider wired at the correct abstraction layer (host page, not route group); static `'ltr'` until cve-multilingual-workflow integration."

**Phase 25 closure obligations (do not lose these at the handoff):**

- Bump test-host deps to add `@synapsys-integrated/cve-multilingual-workflow@^0.2.0`.
- Rewrite `lib/variant-direction.ts` to import `getLocaleDirection` + `LocaleTagSchema` and return the locale-derived direction (with `'ltr'` fallback for invalid/missing tags).
- Replace the dummy Phase-20 variant with one or more locale variants (`'tr-TR'` canonical via the page, `'en-US'` + `'ar-SA'` as variant rows).
- Update `seedHomePage` to seed locale variants instead of the dummy.
- Re-verify the round-trip: `/?v=ar-SA` produces `dir="rtl"` on the DirectionProvider boundary; `/?v=en-US` and the canonical render produce `dir="ltr"`.
- Update FINDINGS to record that Phase 20's deferred direction-flip is now closed; the dummy variant is retired.
- Phase 27 (Studio) will then build per-locale workflow indicators on top of this — see [[project-phase18-deferred-workflow-indicator]] and [[project-studio-variant-authoring-is-generic]].

**Related:** [[feedback-direction-per-variant-not-route-group]] (the prior memory motivating this — kept as the route-group anti-pattern record; refined here for the foundation-phase scope), [[project-phase20-resume-context]].
