---
name: Use plain terms, not GSD jargon, when explaining problems
description: When surfacing a blocker or asking a decision question, explain the actual problem in plain terms first; do not assume identifiers like D-04, ISSUE-NN, AUTHZ-04 carry context.
type: feedback
originSessionId: bb18f426-c473-4779-885a-f0d65cc744eb
---
When explaining a problem or asking the user to choose between options, lead with the actual technical situation in plain terms (what broke, why, what changes if we do X vs Y). Do NOT lean on GSD context-document identifiers (`D-04`, `ISSUE-06`, `AUTHZ-04`, `BTB-01`, etc.) as if they self-explain — the user does not pre-load those references when reading a question.

**Why:** User feedback 2026-04-30 mid-Phase-11 — when I framed a Phase 11 architectural decision around "which CONTEXT D-04 contingency branch?" and listed the three branches verbatim from the planning artifact, the user pushed back: "I don't get it exactly... Keep it simple and don't use gsd terms like D-04 and think that adds context."

**How to apply:**
- When asking the user a decision question or surfacing a blocker, write the question as if the user has not read the relevant CONTEXT/PLAN file. Restate the problem in concrete terms (file, symbol, actual error).
- Reference doc identifiers only as a footnote ("recorded in CONTEXT D-04") AFTER the plain explanation, not as the lead.
- If the user asks "why" about something, dig into the actual code/runtime behavior before re-asking the decision. They may want more diagnostic data, not a faster yes/no.
- This applies equally to AUTH-NN, AUTHZ-NN, OBS-NN, BTB-NN, ISSUE-NN, T-XX-XX-XX threat IDs, etc. — those names live in planning docs, not in the user's working memory.
