---
name: Don't unilaterally pin zod in one CVE package while others use "latest"
description: Pinning zod in a single workspace package while others track "latest" creates parallel zod trees that fail prototype checks at runtime; coordinate workspace-wide
type: feedback
originSessionId: 8b1038d6-2d80-4d76-b438-8dca91f87124
---
Don't pin `zod` (or any peer-shared deep dependency) in a single CVE workspace package while other packages declare it as `"latest"`. Bun installs separate copies for the different ranges, and schemas from one zod tree fail `_parse` checks when wrapped by `z.object`/`z.record` from another tree (`TypeError: keyValidator._parse is not a function`).

**Why:** Phase 12 commit `38104d2` (WR-05) pinned `cve-multilingual-workflow` to `"zod": "^3.23.0"` while cve-core, cve-components, and others kept `"zod": "latest"` (resolving to zod@4 today). `MultilingualVariantKeySchema` (a v3 `z.object` wrapping cve-core's v4 `VariantKeySchema`) crashed at runtime. Reverted in commit `b8faa61`.

**How to apply:** When a code reviewer flags a `"zod": "latest"` declaration in a published CVE package, validate the fix workspace-wide before applying it. The right place to coordinate the pin is the Phase 19 release wave (or whichever release-coordination phase is active). Until then, leave the package at `"latest"` and record the concern as deferred in REVIEW.md `unresolved:` and the phase's `deferred-items.md`.

This generalizes to any peer-shared identity-sensitive library where two copies = silent prototype-chain breakage (other examples: zustand stores, custom Symbol-based registries, Drizzle ORM client instances).
