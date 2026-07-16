---
name: reference-decision-coverage-gate-matcher
description: How the GSD plan-phase decision-coverage gate matches D-NN citations (scans ONLY designated sections — must_haves/truths/objective — NOT the whole plan)
metadata: 
  node_type: memory
  type: reference
  originSessionId: 2199f21f-2bcd-44b9-a46a-45aa6115a805
---

The GSD `check.decision-coverage-plan` gate (plan-phase Step 13a, BLOCKING) does **NOT** scan the whole PLAN.md. It extracts ONLY "designated sections" and matches each `\bD-NN\b` from CONTEXT.md's `<decisions>` block (or a 6+-word normalized phrase of the decision text) against just those. Designated = (1) frontmatter YAML keys `must_haves`, `truths`, `objective`; (2) body lines under a **markdown heading** matching `/^#{1,6}\s+(must[_ ]haves?|truths?|tasks?|objective)\b/i`. It first **strips HTML comments and fenced code blocks**. `objective` IS included.

**The trap (corrects the old "scans everything except objective" note — that was backwards):** modern GSD plans put tasks in XML `<tasks>`/`<task>` blocks, the threat register in `<threat_model>`, and the objective in an XML `<objective>` block — NONE of these are markdown headings, so the gate reads NONE of them. A `D-NN` cited only in a task `<name>`/`<action>`, a `<threat_model>` table, an XML `<objective>` block, or prose under a `### Foo` heading scores UNCOVERED. Bare `D-04` works (no colon needed); the message's "cite `D-NN:`" hint is misleading.

**Why:** confirmed by reading the compiled handler `sdk/dist/query/check-decision-coverage.js` (`extractPlanSections` / `DESIGNATED_HEADINGS_RE`) AND empirically this session — 4 Phase-1 plans cited all 9 decisions in XML task names, threat tables, and `### ` prose → gate reported **0/9**; appending `(D-NN)` to the matching item inside each plan's frontmatter `must_haves.truths` → **9/9**. Handler lives in the compiled SDK (`~/.npm/_npx/.../get-shit-done-cc/sdk/dist/`, resolved via the `gsd-sdk` shim), NOT in `~/.claude/get-shit-done/bin/gsd-tools.cjs` — don't waste steps grepping the bin tree.

**How to apply:** to satisfy the gate, cite `D-NN` inside frontmatter `must_haves.truths` (or anywhere in the `must_haves` YAML block) — tag each owned decision onto the truth that is its verifiable form; one token per decision suffices. If the gate fails on decisions you know are implemented, the fix is citation-placement, not re-planning (the plan-checker passing confirms substance). The verify-phase counterpart (`check.decision-coverage-verify`) is the inverse: broad haystack (whole plan text + SUMMARY.md + files_modified + last 200 commit messages) and NON-blocking. The separate Step 13e `gsd-tools.cjs gap-analysis` is a third, different tool. See [[feedback_verify_code_not_just_tests]] and [[feedback_never_work_around_root_cause]].
