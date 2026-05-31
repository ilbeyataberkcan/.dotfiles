---
name: research-industry-pattern-before-inventing
description: "When the user pushes back on a hand-rolled solution in a well-known problem domain (theme switching, auth flows, form handling, etc.), assume there's an established library/pattern and research it before iterating on the custom design."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b1c4f5be-475f-4525-997c-dca65f400103
---

When designing for a problem domain that has well-established libraries / community patterns, default to researching the canonical pattern BEFORE proposing custom code. The user pushed back three times on a custom theme-switching implementation (`dangerouslySetInnerHTML`, then external `theme-init.js` file, then external script with codegen emission) before saying outright: "Please research in a clean sub-agent how the Next.js React with Tailwind project usually handles it professionally." The right pattern was `next-themes` — used by shadcn/ui, every Vercel template, all production-grade Next.js dark mode setups — and it had been the right answer from the first proposal.

**Why:** Custom code in a solved problem domain is almost always worse than the established library: less battle-tested, missing edge cases (FOUC, multi-tab sync, system-preference fallback, SSR), and creates maintenance burden the user has to absorb. The user's frustration ("Apparently your context is bloated") was directly about my refusing to acknowledge the existence of the canonical pattern. The cost of NOT researching is exactly this kind of multi-round-trip pushback.

**How to apply:**
1. When a user asks for a solution in a domain like theme switching / auth / forms / i18n / animations / state management / etc., FIRST run an Explore agent (or quick WebSearch + WebFetch in main) to find the de facto standard.
2. Propose the standard pattern as option 1 in the questionnaire, with a clear "this is what production projects do" framing.
3. Only propose a custom solution if (a) the standard genuinely doesn't fit, (b) the user explicitly rejects the standard, OR (c) it's a domain so niche or specific to the project that no standard exists.
4. If the user objects to elements of the standard (e.g., `next-themes` uses `dangerouslySetInnerHTML` internally), name the trade-off honestly: "library boundary abstracts the smell; the alternative is rolling your own with the same internal mechanism, or accepting FOUC."

Related: [[feedback_honest_recommendations]] · [[feedback_check_priors_terse_output]] · [[feedback_never_work_around_root_cause]]
