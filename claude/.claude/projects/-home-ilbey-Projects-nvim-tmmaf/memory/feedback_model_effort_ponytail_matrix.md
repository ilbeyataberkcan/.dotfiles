---
name: feedback-model-effort-ponytail-matrix
description: HARD RULE — never use Fable 5 unless explicitly asked; Opus 5 at high effort for every agent. Ponytail (full) + graphify-first go in every agent prompt.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 18545b96-0e33-4ba8-8bae-3ee93f39f2f3
  modified: 2026-07-29T06:18:37.611Z
---

**HARD RULE (set 2026-07-29, supersedes everything below): NEVER use Fable 5 for any agent unless
the user explicitly asks for it by name. Use Opus 5 at high effort instead — for ALL agent roles,
including spec, planning, research, review, and verification agents.**

**Why:** the user stated it as a standing hard rule and told me to memorize it. It overrides the
earlier staffing matrix, which had assigned Fable 5 to spec/planning/review work — I was actively
staffing GSD planning agents on Fable when the correction came.

**How to apply:** pass `model: 'opus'` on every `Agent(...)` call and every workflow `agent()`
call. Never pass `model: 'fable'`. When a GSD config (`resolve-model`, `planner_model`,
`researcher_model`, `checker_model`) resolves to sonnet, fable, or empty, **override it to opus** —
config does not outrank this rule. Effort: **high** as the default; `medium` only for genuinely
low-complexity mechanical tasks; `xhigh` reserved for security audits.

**Still true from the original matrix (2026-07-06), and unaffected by the model change:**

- **Ponytail must be in every agent prompt.** It is an installed PLUGIN (v4.8.3, active `full`),
  NOT in `~/.claude/skills` — it lives at `~/.claude/plugins/cache/ponytail/`
  (rules: `.agents/rules/ponytail.md`). Lazy-senior-dev ladder (YAGNI → reuse → stdlib → native
  platform → existing dep → one line → minimum), root-cause fixes over symptom patches, deletion
  over addition, `ponytail:` comments marking intentional simplifications with ceiling + upgrade
  path. Check `~/.claude/plugins/cache/` before ever declaring a skill/plugin missing.
- **graphify-first in every sub-agent prompt** — `graphify query "<question>"` BEFORE any
  grep/file-read for codebase questions, `explain`/`path` for relationships. Agents lose a lot of
  time raw-browsing this repo.
- **Hard ban on comments that narrate what the code obviously says.** The only sanctioned comment
  is a `ponytail:` ceiling note. PREVENTION-ONLY: never spend tokens reading or cleaning comments
  already written — "what has been written should be accepted as is." No comment-cleanup passes,
  no review findings about existing comment style.
- **Playwright/UAT agents** were already carved out to Opus and stay there — browser loops burn
  session limits fast. Ties into [[tmmaf-playwright-dev-testing]] and
  [[feedback-playwright-via-subagent]].
- **Workflow resume cache is PREFIX-based on exact prompt text** — never edit a shared prompt
  block mid-milestone; append surgical suffixes to not-yet-run calls instead.

Related: [[feedback-concise-comments]] (ponytail: comments ARE the sanctioned exception),
[[feedback-fix-all-severity-findings]].
