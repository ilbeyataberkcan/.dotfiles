---
name: feedback_audit_every_user_facing_sentence
description: Make a reviewer rule TRUE/FALSE on every user-facing sentence against its exact trigger state — four rounds each shipped a falsehood
metadata:
  type: feedback
---

When a change adds or edits user-facing copy, one review pass must **enumerate every
sentence, name the exact system state that triggers it, and rule TRUE or FALSE in that
state**. Not "is the copy clear" — is it *true*.

**Why:** on the coach athlete-selection rework
([[project_coach_athlete_selection_fixes]]) four consecutive rounds each shipped a message
that was false in a reachable state, and every one was caught only by this audit — never by
typecheck, lint, tests, or an ordinary code review. A rejected athlete told "zaten kayıtlı".
A category-displaced athlete told they were "reddedilmiş" (displacement is explicitly not a
verdict). A coach who *had* athletes told to "önce sporcularınızı ekleyin". A withdrawn
athlete told to contact the federation when the server would have re-registered them
happily. Each read fine in isolation; each was false only in the state that produced it.

**How to apply:** in the review prompt, demand a table — sentence, trigger state, TRUE/FALSE
— and say the previous rounds shipped falsehoods so the reviewer assumes this one did too.
Give extra scrutiny to any sentence asserting **an age, a verdict, a remedy, or what another
surface will show**: those four assert facts the code must actually establish, and they are
where all four failures landed. A sentence naming a remedy is the highest risk — go verify
the remedy surface exists and does what the sentence claims.

A false message also frequently marks a *code* defect underneath: the withdrawn one exposed
a client-side gate with no server twin, which is a standing violation in this repo
([[feedback_client_is_dumb_reflection]]).
