---
name: feedback_concise_comments
description: "Do NOT write code comments — the user has escalated to zero comments, not even one-liners"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0a786c21-2a6b-4a3c-87a7-31c9975610f7
---

Do NOT add code comments. The user escalated from "keep them short" to "JUST DON'T" ("FOR GOD'S SAKE PLEASE STOP WRITING COMMENTS ON THE FILES AND FUNCTIONS"). Write comment-free code.

**Why:** The user has corrected this repeatedly and is now angry about it. Comments — even one-liners — read as noise/bloat to them. The existing codebase is heavily commented, but that is NOT a license to add more; match intent, not density.

**How to apply:** Write zero comments in code I author or edit (source, tests, configs). No JSDoc blocks, no inline "why", no decision-ID notes. Put all rationale in the commit message or the chat response instead. When editing a file that already has comments, leave the existing ones but don't add mine. Relates to [[feedback_fix_properly_system_wide]].
