---
name: feedback-no-doc-item-numbers-in-prose
description: "Don't cite planning-doc item numbers (D-10, AMEND-4, R9, C-3) when talking to the user — describe the thing in plain language"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4090539e-7acd-45ef-8678-2fd8eced67a5
  modified: 2026-07-30T13:23:23.791Z
---

When reporting to the user, never lead with identifiers from planning artifacts — `D-10`, `AMEND-4`,
`R9`, `C-3`, `AC-16`. Say what the thing *is*: "the decision that rejected a coach flow tree",
"the finding that the fold now runs at summary-advance", "the requirement that a coach registration
parks instead of folding".

**Why:** stated directly on 2026-07-30 during phase 25.2 planning — *"I really don't like and
understand when you use the item numbers from the files. It is confusing."* The user holds the
architecture in their head by meaning, not by index; an id forces them to go open a file to decode a
sentence.

**How to apply:** ids stay in the artifacts (downstream GSD gates match on them — never renumber or
drop them there) and may appear in a trailing parenthetical when the user would plausibly want to
grep for it. Prose leads with the meaning. Same rule for file:line anchors — quote them when the user
needs to look, not as a substitute for saying what changed.

Related: [[feedback_questions_in_text_not_questionnaire]], [[feedback_concise_comments]],
[[feedback_tmmaf_deck_audience]]
