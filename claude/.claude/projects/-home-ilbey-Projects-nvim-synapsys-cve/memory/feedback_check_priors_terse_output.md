---
name: Check implementation assumptions against prior decisions before proposing — terse output, no search narration
description: Before proposing an implementation approach, verify against prior decisions, locked rules, and existing similar implementations. State the conclusion tersely; do not narrate the search.
type: feedback
originSessionId: d8789fe0-f215-4e77-9023-ecec3a9e78af
---
When making any non-trivial implementation choice (API shape, data model, naming, error handling, validation strategy, file layout, sanitization approach, schema split, registry pattern, etc.), check the following before proposing:

1. **Prior decisions log** — `.planning/v1.1-PARALLEL-COORDINATION.md` "Cross-cutting decisions log", the phase's handoff brief, the ROADMAP entry's "Locked rules" / "Success Criteria", `CLAUDE.md` (project instructions — Architectural Principles, Design Decisions table).
2. **Similar implementations in the codebase** — if a sibling package solved a structurally identical problem (e.g. cve-mail's seam when designing cve-payment's seam), analyze whether the pattern fits.

Then:

- **If a prior decision constrains the choice:** align with it. Do not re-litigate.
- **If a similar implementation fits:** replicate the pattern. Codebase consistency is a feature.
- **If a similar implementation does NOT fit:** present the alternative with the *logic* — what's different about this use case that breaks the precedent. Do not silently diverge.

**Output discipline:**

- Do NOT narrate the search ("I looked at X, didn't find Y, then searched Z..."). That's noise.
- State the conclusion in one short paragraph: "Following the cve-mail pattern at `packages/mail/src/index.ts` because [reason]." or "Diverging from cve-mail's pattern because [reason]: [alternative]." or "[approach] — no prior decision found in [places checked]."
- Move on.

**Why:** Phase 11 of v1.1 failed badly on this — the agent proposed multiple approaches without checking precedent, and the user (ilbey) had to step through corrections manually. That model doesn't scale to parallel work where two or three sessions are in flight simultaneously and the user can't manually correct each one. The agent must self-discipline.

**How to apply:**

- For every prompt I prepare for a phase agent (or any agent doing implementation work in this codebase), include this directive verbatim or by reference. The v1.1 session template now contains it as HARD DIRECTIVE 3 at `.planning/v1.1-PARALLEL-SESSION-TEMPLATE.md` — referencing the template is enough for v1.1 phases.
- For non-phase work (debugging, ad-hoc tasks), apply the same discipline myself: check priors, state the conclusion tersely, no search narration.
