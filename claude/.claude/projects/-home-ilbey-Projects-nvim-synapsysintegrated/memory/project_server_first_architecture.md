---
name: Server-first architecture is a load-bearing project goal
description: The Synapsys + CVE stack is intentionally server-authoritative. Client bundles should carry only what the client genuinely needs to run — schemas, validation, and business logic stay on the server.
type: project
originSessionId: bb18f426-c473-4779-885a-f0d65cc744eb
---
The Synapsys host + CVE packages are designed server-first: render on the server, validate on the server, and ship only the minimum scripts and data needed for client interactivity. The user has stated this is a load-bearing intent, and acknowledged that some current code does not fully meet it ("we have some bullet holes in our armor").

**Why:** User stated 2026-04-30 during Phase 11 architecture discussion: "When I first started it I thought it would be the best to handle anything in the server side and only send the needed information and scripts to the client side. We mostly achieve it but right now I see that we have some bullet holes in our armor." Decisions like keeping CVE Zod schemas separate from `'use client'` modules are an expression of this principle.

**How to apply:**
- When introducing new code paths, prefer server-side execution by default and only opt into client-side when there is a real interaction need (state, effects, browser APIs).
- Be skeptical of `'use client'` co-locating non-React-runtime concerns (schemas, validation, business logic, route maps). Those belong in pure-server modules.
- When you spot a "bullet hole" — e.g., a CVA variant helper or render-time utility that today lives in a client module but is conceptually server-safe — flag it as a future cleanup rather than fixing it inline. The user said this is "not to be focused on at the moment" but "will definitely require attention in the future."
- This applies across the host (synapsysintegrated) AND CVE packages. Not just one repo.
- Bundle-size and trust-boundary arguments BOTH support this direction; cite them when proposing related work.
