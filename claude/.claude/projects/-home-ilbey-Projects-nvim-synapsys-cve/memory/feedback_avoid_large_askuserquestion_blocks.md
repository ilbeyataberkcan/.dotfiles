---
name: feedback_avoid_large_askuserquestion_blocks
description: Prefer plain-text questions over multi-question AskUserQuestion blocks; ESC wipes long typed answers
metadata:
  node_type: memory
  type: feedback
  originSessionId: 7ab48296-e363-4d40-a209-854d54aa9cf7
---

Avoid large multi-question `AskUserQuestion` blocks when options invite detailed free-text answers. The user types long, considered answers into the "Other" field; in vim mode a single ESC cancels the whole questionnaire and **all typed answers are lost** — even after answering 3 of 5. Re-typing detailed answers is a real burden and risks dropped content.

**Why:** A harness bug (ESC cancels on first press in vim mode, discarding in-progress input) makes detailed questionnaires high-cost-on-failure. Reported via /feedback 2026-06-29.

**How to apply:** For decisions needing nuanced input, ask in plain prose in my message and let the user reply in their own message (no input-loss risk), or use a single focused question with short pickable options. Reserve multi-question `AskUserQuestion` for genuinely quick multiple-choice picks where no long typing is expected. Relates to [[feedback_honest_recommendations]] and [[feedback_workflow_gates_vs_terse_directive]].
