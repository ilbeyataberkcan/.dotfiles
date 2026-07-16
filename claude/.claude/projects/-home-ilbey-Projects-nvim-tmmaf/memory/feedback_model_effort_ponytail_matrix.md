---
name: feedback-model-effort-ponytail-matrix
description: "Agent staffing rules — Opus 4.8 implements, Fable 5 specs/plans/reviews, effort medium/high scaling; ponytail plugin (full) goes into every executor prompt"
metadata:
  node_type: memory
  type: feedback
  originSessionId: c83e603f-421f-48dc-8484-dca66b34302f
---

User-set agent staffing for tmmaf/synapsys-cve work (2026-07-06):
- **Implementation executors: Opus 4.8. Spec/planning/review/verification agents: Fable 5.**
- Effort is my call: **medium** for low-complexity tasks, **high** for most complex ones ("high is probably more than sufficient for most complex tasks"); xhigh only for security audits.
- **Ponytail must be included in agent prompts.** It is an installed PLUGIN (v4.8.3, active `full`), NOT in ~/.claude/skills — found at `~/.claude/plugins/cache/ponytail/` (rules: `.agents/rules/ponytail.md`). It's the lazy-senior-dev ladder (YAGNI → reuse → stdlib → platform → dep → one line → minimum), root-cause fixes, deletion over addition, `ponytail:` comments marking intentional simplifications with ceiling + upgrade path.

**Why:** user rejected a plan that skipped ponytail (I had wrongly concluded it didn't exist by only checking ~/.claude/skills) and that put Opus 4.8 on spec work.

**How to apply:** check `~/.claude/plugins/cache/` before declaring a skill/plugin missing; carry the model/effort matrix into every execution-guide/agent-prompt I author; ponytail discipline paragraph goes in every executor prompt. Related: [[feedback-concise-comments]] (ponytail: comments ARE the sanctioned exception).

**Addendum (2026-07-08, federation-platform run):** every sub-agent prompt must ALSO carry, explicitly: (1) graphify-first — `graphify query "<question>"` BEFORE any grep/file-read for codebase questions, `explain`/`path` for relationships (agents lose too much time raw-browsing); (2) a hard ban on comments that narrate what the code obviously says — the ONLY sanctioned comment is a `ponytail:` ceiling note; obvious comments waste review time and token budget. User was explicit: "explicitly order them not to write comments that explain what is obviously there." This is PREVENTION-ONLY: never spend tokens reading/cleaning comments already written — "what has been written should be accepted as is"; no comment-cleanup passes, no review findings about existing comment style. Also learned: Workflow resume cache is PREFIX-based on exact prompt text — never edit a shared prompt block (RULES) mid-milestone; append surgical suffixes to not-yet-run calls instead.

**Playwright/UAT staffing (2026-07-08):** NEVER put Fable 5 on Playwright-driving agents — browser loops burn session limits "like crazy". UAT/screenshot/browser agents run on **Opus 4.8** (`model: 'opus'`), tying into [[tmmaf-playwright-dev-testing]] (already sub-agent-only per [[feedback-playwright-via-subagent]]).
