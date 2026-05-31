---
name: Spot-check revisions instead of re-running full checker
description: When a revision agent returns a structured per-issue changelog, prefer cheap targeted greps over spawning another full plan-checker (or equivalent verifier) agent
type: feedback
originSessionId: cc94c145-76dc-41a1-8ff3-9261426f3996
---
When a revision/fix agent returns a structured changelog mapping each prior issue to specific edits in specific files, prefer spot-checking the claimed fixes via targeted greps rather than spawning another full verification agent.

**Why:** The user pushed back on a second `/gsd-plan-phase` plan-checker run after the first one used ~350K tokens. The revision agent's own per-issue changelog (which file, which line, which grep pattern added) gives an auditable diff that can be confirmed in seconds with `grep -c` on the modified files.

**How to apply:** After any revision/fix loop where the agent emits a per-issue change summary:
1. Pull the specific patterns/strings the agent claims to have added (grep regexes, key strings, token names, attribute names).
2. Run a single batched `grep -c` (or a few greps) against the modified files to confirm presence + non-trivial count.
3. Only spawn a fresh full verifier agent if (a) the revision agent didn't return a structured changelog, (b) a spot-check finds a fix missing, or (c) the task involves runtime correctness that grep can't validate.

This applies to gsd-plan-checker, gsd-code-reviewer fix loops, and any analogous verify-fix-reverify pattern.
