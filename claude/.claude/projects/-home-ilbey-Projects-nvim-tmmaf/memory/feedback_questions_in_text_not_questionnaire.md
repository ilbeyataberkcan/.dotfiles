---
name: feedback_questions_in_text_not_questionnaire
description: "Ask scoping questions as plain text, not the AskUserQuestion tool — this user answers with nuanced multi-part reasoning that fixed options can't hold"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 164301fb-e275-47ef-8e69-61fdc71349c8
  modified: 2026-07-29T02:46:51.188Z
---

When gathering requirements or scoping decisions, ask the questions as **plain text in the
response body**, not via the `AskUserQuestion` questionnaire. The user asked for this
explicitly on 2026-07-29 ("ask the questions and only the questions again in text instead of
questionare") after rejecting a questionnaire mid-turn.

**Why:** this user's answers are consistently nuanced and multi-part — they routinely pick an
option *and* rewrite its terms ("Per discipline yes but not in the same row…", "Actually none
but for now we will allow athlete accounts to remain self-servable until we settle…", "All
three actually…"). Fixed options force that reasoning into an "Other" free-text box, which
buries the real answer and makes the option labels actively misleading. Plain text lets them
answer at the granularity the decision actually has.

**How to apply:** state findings first, then ask numbered questions in prose, each with a
recommendation and its trade-off so they can agree, amend, or reject per-question. Still give
a recommendation — they engage with it and correct it (see
[[feedback_revision_verification]]). The questionnaire is still fine for genuinely binary
mechanical choices where no nuance is possible.

Related: [[feedback_fix_all_severity_findings]], [[feedback_concise_comments]].
