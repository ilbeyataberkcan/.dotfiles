---
name: feedback-comment-hygiene
description: "Comments describe intent that isn't inferrable from code. Never log history, never accumulate change-narration; rewrite to reflect current state."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 535d597b-2671-4822-8bfc-9bdd50e09e20
---

**Rule:** Comments exist only to explain WHY for things that aren't obvious from reading the code. They are not a changelog.

Hard rules:
1. Don't write comments that restate what the code does ("// loop over children").
2. Don't accumulate history in a comment ("// previously we did X, now we do Y because Z"). When code changes, REWRITE the comment to describe the current state in one short sentence — or delete it.
3. Don't reference past fixes, PR numbers, or task IDs inline ("// fix for CR-01", "// WR-02 mitigation"). That belongs in commits and PR descriptions, not in the file.
4. Don't over-explain — a single non-obvious constraint, invariant, or surprising behavior gets at most one short line.
5. If a comment block exceeds a few lines, it's almost certainly clutter — collapse or remove.

**Why:** The user has been explicit: over-populated comments clutter files and make it harder to get accurate results from context-bound work. Comments that log their own lifetime ("originally we tried X — then switched to Y — then settled on Z") are pure noise. They double the lines an LLM has to read without adding new information about the *current* state of the code.

**How to apply:**
- Default to writing NO comment. Add one only when removing it would confuse a future reader.
- When editing existing code, audit nearby comments — if the code has drifted, rewrite the comment to match present-tense reality. Don't leave the old wording with a "// now we …" appended.
- Reviewer-grade tells: comments containing "previously", "we used to", "this was changed to", task IDs, severity codes, or wave numbers are almost always candidates for deletion.
- Related to project CLAUDE.md guidance: "Default to writing no comments. Only add one when the WHY is non-obvious." This memory makes that policy load-bearing.

**2026-05-21 reinforcement (Phase 22 incident).** The user reviewed `apps/cve-test-host/lib/mail.ts` (Phase 22 host MailService composition) and called the comment density "novels about our code." The file has 50+ line block-comment headers above small functions, multi-paragraph JSDoc explaining things that are obvious from the signature, and inline narration about wave/task scope. The user permitted it to stand THIS TIME because `apps/cve-test-host/` is the v1.2 reference for the future production host and rewriting now would interrupt phase flow — but this is NOT a baseline to copy. Hard threshold going forward: if a single comment block exceeds ~3 lines, justify it or delete it. Production application code MUST NOT inherit this density. Test-host files written by later v1.2 phases (Phase 23+) should regress this immediately — short lines or none.
