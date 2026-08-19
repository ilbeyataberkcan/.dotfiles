---
name: feedback_turkish_diacritics_never_folded
description: Never ASCII-fold Turkish diacritics in user-facing copy to save space — shorten the sentence or fix the constraint instead
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 64af19cd-176a-41f5-a99e-5fab31f9cbd6
  modified: 2026-08-14T14:54:59.024Z
---

When copy hits a length ceiling, **shortening the sentence is allowed; stripping `ı İ ş Ş ğ Ğ ç`
is not.** The user rejected an ASCII-fold proposal on 2026-08-14: "I would prefer to keep the
Turkish Letters, Make the sentences shorter."

> **Live exception — SMS only, 2026-08-14.** Later the same day the user reversed for time
> reasons: `lib/outreach/sms-templates.ts` now ships ASCII on purpose, with a header comment
> saying so, because the dynamic-links package and short domain that would buy the 70-char budget
> are not built yet. This is **explicitly temporary** ("We will come back and fix the letters
> later") and scoped to SMS bodies — every other surface keeps its diacritics. Do not generalize
> the exception, and do not quietly leave it in place: restoring them is the last step of
> [[project_sms_one_segment_dynamic_links]].

**Why:** proper Turkish is the product's shipped voice, not a nice-to-have. The fold was
technically tempting — `ı İ ş Ş ğ Ğ ç` are the only Turkish letters missing from GSM-03.38, so
folding them would have quadrupled the SMS budget from 70 to 160 characters. The user chose to pay
for a URL shortener and a new domain instead. Treat the ceiling as the thing to fix, never the
language.

**How to apply:** when a surface is length-constrained (SMS, badges, exports, print, QR), rewrite
shorter in Turkish first; if it still does not fit, attack the constraint (shorten the link, drop
a redundant prefix, change the medium) and bring the trade to the user. Do not present
transliteration as an option again. Note that `ö Ö ü Ü Ç` *are* GSM-7-native and cost nothing —
only the other seven force UCS-2.

Related: [[feedback_audit_every_user_facing_sentence.md]], [[project_sms_one_segment_dynamic_links]].
