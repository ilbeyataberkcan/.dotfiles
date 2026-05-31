---
name: Phase 10 design is locked as Variant System + Path C-Strict refactor + SEO cache discipline
description: cve-core Phase 10 ships generic variant primitives, refactors page-as-root-node, and restores the documented "SEO cache (computed on save, read on render)" pipeline.
type: project
originSessionId: 1afcd473-2047-41eb-a1cf-363b46216a35
---
Phase 10 of the CVE v1.1 milestone has been redesigned twice through extensive discussion. The current locked design lives in `/home/ilbey/.claude/plans/10-luminous-summit.md` and supersedes the existing (stale) `.planning/phases/10-cve-core-depth-additions/10-CONTEXT.md`.

**Three intertwined deliverables in Phase 10:**
1. **Generic variant management subsystem** — `PageVariant` is a single type (not a discriminated union), every variant has a `diff: VariantDiffOp[]` (5 tree-aware ops, can be empty) and `branchedFromHash`. Variants serve multilingual + A/B + regional + arbitrary audience-segmented content; cve-core stays agnostic of intended use; workflow packages (Phase 12 cve-multilingual-workflow first) supply the policy.
2. **Page-as-root-node refactor (Path C-Strict)** — `Page.content: ComponentNode[]` becomes `Page.rootNode: ComponentNode`. Page-level title/description/SEO move into the root node's props/seo. Row keeps id, slug, isPublished, publishedAt, editorialState, audit fields, plus SEO cache columns + new `structuredData jsonb` column.
3. **SEO cache discipline restored** — host's Drizzle schema documents row SEO fields as "cache (computed on save, read on render)" but cve-core's service never wired the projection. Fixed by adding write-time `extractSeoMetadata(rootNode)` projection in `DatabaseService.createPage`/`updatePage`. Per-variant SEO caches live on `page_variants` rows.

**Key locked decisions:**
- `PAGE_ROOT_ID` constant = nil UUID `00000000-0000-0000-0000-000000000000` exported from cve-core; every page's root node uses this ID
- Variant resolver context excludes `userAgent` and `ip` (cloaking firewall — Google manual-penalty offense)
- `variantFallback` is a callback handler, not a static chain
- Editorial cycle is mutual at the page level (`pages.editorialState`); publish cycle is independent per variant (`page_variants.publishedAt`)
- Storage: separate `page_variants` table, NOT JSONB on `pages`
- 5 waves; strict sequential dependencies; v0.1.10 → v0.2.0 with breaking changes
- cve-core ships ZERO locale-aware code — `getLocaleDirection`, RTL language list, `Intl.Locale` script-subtag check all live in Phase 12 cve-multilingual-workflow
- Direction + writingMode are generic optional fields on BaseNodeSchema, NO derivation policy in cve-core

**Why:** The user pivoted twice through deep design discussion (locale-specific → generic variants → page-as-root-node refactor + SEO cache discipline addition). The plan file captures the full lock with rationale; downstream agents must read it before any Phase 10 work.

**How to apply:** When asked about Phase 10, read the plan file first (`/home/ilbey/.claude/plans/10-luminous-summit.md`). The next workflow step is `/gsd-discuss-phase 10` in a fresh session with this plan as input — it rewrites `10-CONTEXT.md` to lock the new design's D-01..D-Nx decisions. Do not regress to the locale-specific framing the existing CONTEXT.md preserves.
