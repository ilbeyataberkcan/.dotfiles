---
name: project_graphify_scope_code_and_docs
description: graphify for tmmaf is scoped to code+docs via .graphifyignore; never include .planning
metadata: 
  node_type: memory
  type: project
  originSessionId: 62c5b904-94b9-49ac-bcfe-596a8dd4de38
---

The tmmaf knowledge graph must cover only real source + product/design docs, NOT GSD orchestration docs. A repo-root `.graphifyignore` (gitignore allowlist: `*` then `!app/ !db/ !docs/ !lib/ !scripts/` + their `/**`) defines scope — graphify's `detect` honors it natively. Including `.planning/` (200+ phase/plan/summary docs) bloated and "corrupted" the graph: it dominated communities and god nodes with orchestration prose.

**Why:** the tool is for code, not for agent-guiding orchestration documentation; planning artifacts swamp the real architecture signal.

**USE the graph for exploration — in BOTH the main session AND workflow agents (operator directive 2026-06-08).** For codebase questions prefer `graphify query "<q>"` / `graphify explain "<concept>"` / `graphify path "A" "B"` over re-grepping/re-reading the same symbols every workflow — repeated raw searches burn context across parallel agents. Put an explicit "use graphify first" instruction in workflow agent prompts. Caveat: the graph covers **tmmaf only** (app/db/docs/lib/scripts); the sibling **`synapsys-cve`** packages are NOT in it, so cve exploration still uses Read/Grep. Read raw files only to modify/debug specifics or when the graph lacks detail.

**How to apply:** trust the `.graphifyignore` (don't re-add excluded dirs). On rebuild, clear `graphify-out/cache/semantic/` so docs re-extract under current guidance; keep the deterministic AST cache. Keep doc/image extraction conservative — AI-written self-comments in code and docs are NOT relationship evidence (prefer EXTRACTED, INFERRED only on concrete structural evidence).

`.graphifyignore` now also excludes `db/migrations/` (plain ignore lines AFTER `!db/**`, last-match-wins) — the 5 SQL + 6 snapshot files were ~66% of the graph (2263 of 3438 nodes: every `columns`/`name`/`notNull` DDL token). Real schema is the TS in `lib/db/schema/`, which stays. Final scoped graph: 253 files → **1175 nodes / 2088 edges / 91 communities**; god nodes are real (`tokenKinds`, `getDrizzle()`, `getSession()`, `auth()`, `DrizzlePaymentEventStore`).

**Gotcha:** `graphify --update` (build_merge) runs an aggressive dedup by default — on a pure migration-prune it collapsed 3438→1064, merging distinct same-named code nodes (`page.tsx`, `.constructor()`). For a prune-only update, do a surgical filter of the backup graph (`graphify-out/.graphify_old.json`) by `source_file` prefix and re-cluster instead, then `to_json(..., force=True)` past the shrink-guard. See [[feedback_concise_comments]].
