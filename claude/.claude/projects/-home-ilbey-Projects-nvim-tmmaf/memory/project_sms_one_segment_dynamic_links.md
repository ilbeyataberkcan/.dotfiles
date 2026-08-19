---
name: project_sms_one_segment_dynamic_links
description: "Turkish SMS is UCS-2 so one segment = 70 chars; fix is a new cve-dynamic-links package plus a short domain — PLANNED 2026-08-14, blocked on a domain"
metadata: 
  node_type: memory
  type: project
  originSessionId: 64af19cd-176a-41f5-a99e-5fab31f9cbd6
  modified: 2026-08-14T13:44:31.351Z
---

**The measured problem (2026-08-14).** Every `lib/outreach/sms-templates.ts` body is Turkish and
contains `ı ş ğ İ Ş Ğ ç`, none of which exist in GSM-03.38 — so Twilio encodes the **whole** body
as UCS-2 and one segment is **70 characters**, not 160. Nothing in `lib/outreach/` counts, caps or
truncates. Every message today costs 2–4 segments; `document-update-request` costs **7** (448
chars, of which 330 are a `?callbackUrl=`-wrapped signed HMAC token from
`lib/storage/update-request-token.ts`, growing ~19 chars per extra rejected file type toward the
700-char UCS-2 ceiling).

**Twilio numbers, verified against their docs:** GSM-7 = 160/153/1600; UCS-2 = **70/67/700**.
Smart Encoding does **not** transliterate Turkish (quotes/dashes/whitespace only) and needs a
Messaging Service, which `7bb54b5a` deleted. `ö Ö ü Ü Ç` are GSM-7-native and free.

**Decisions.** Turkish stays (see [[feedback_turkish_diacritics_never_folded]]); one SMS per
message, never concatenated; SMS = one short line + CTA link, email carries the detail; the link
must unfurl with the federation logo via **Open Graph**, which forces the resolver to return HTML
rather than a bare redirect.

**The fix is a package, not a host helper:** `@synapsys-integrated/cve-dynamic-links` in
`synapsys-cve`. Brief written to `~/Projects/nvim/synapsys-cve/DYNAMIC-LINKS-BRIEF.md`; plan at
`~/.claude/plans/here-is-the-problem-proud-cake.md`. It stores an *intent* (`{kind, params}`)
resolved at click time, not a URL — which is what structurally kills the 330-char link, since the
`?callbackUrl=` wrapper only existed to cover a signed-out recipient.

**BLOCKING: a short domain with a host of ≤11 characters, served at the root.** At the
credential-grade 22-char code default (131 bits, per ASVS 5.0 §11.5.1), `fighterscore.com` (16)
leaves 3 reasons at 2 segments; `tmmaf.co` (8) fits all 27 with slack. A `/s/` path prefix costs 2
more chars — don't use one. Second independent route: an approved **alphanumeric sender ID**
showing `TMMAF` makes the 7-char in-body prefix redundant and fits everything on the current
domain — but `deploy/RUNBOOK.md:579-583` warns Turkish carriers filter URLs from alphanumeric
senders, which would delete the links entirely.

**Two findings that survived verification and should not be re-litigated:**
- Consumption is already POST-only — `consumeGuardianClaimCore` is called solely from the server
  action at `lib/guardian-claim-actions.ts:18`, while `app/flows/[[...slug]]/page.tsx:654` only
  presents. So a side-effect-free GET resolver is safe end to end; link-preview prefetch does not
  burn claims.
- Storing the intent in plaintext would undo `lib/guardian-claim-core.ts:339`'s deliberate
  digest-only storage. Hence AES-256-GCM under a key derived from the code itself — at-rest
  protection only, **not** end-to-end.

Related: [[project_tmmaf_drizzle_migration_ops]], [[feedback_cve_package_briefs_are_consumer_agnostic]].
