---
name: project_mail_kvkk_masking_corpus
description: "The mail KVKK mask exists and is applied PER CALL SITE — leaks are forgotten fields, not a missing masker; a sentinel corpus test now guards all 30 factories"
metadata: 
  node_type: memory
  type: project
  originSessionId: a5006746-e261-4020-bc9e-080b034854b2
  modified: 2026-08-08T17:21:39.752Z
---

`lib/email/layout.ts` `maskPersonName` (`Ahmet Yılmaz` → `A** Y**`) has always existed and is
applied **per call site** across the six template files. So a mail leak here is never "masking
is missing" — it is one field somebody forgot. Diagnose by RENDERING the mail, not by reading:
a throwaway vitest in `lib/__tests__/` that writes the output to a file is the fastest probe
(console.log is swallowed by the default reporter).

**The 2026-08-08 pass** (operator report: "child's name not masked in the parent mail"). The
child WAS masked; the raw name was the **coach's**, via `registrationSourceLine` and the
single-child lede in `createGuardianRegistrationNoticeEmail`. Fixed at derivation, plus the
wider corpus: recipient/athlete conflation in 7 templates (greet the mailbox owner, name the
athlete only to a third party — `noticeNameFields()`), names out of subject lines, an
HMAC'd idempotency key that had been persisting a bystander's address (and had never been
deliverable — `@` fails cve-mail's key regex), provider error prose scrubbed before
`mail_audit`, and two schemas that failed a mail CLOSED rather than truncating.

**The net:** `lib/__tests__/mail-masking-corpus.test.ts` — sentinel names/address through all
30 factories × 4 surfaces (subject/html/text/to.name), plus a completeness guard that unions
the `@/lib/email` AND `@/lib/mail` export surfaces, so a template added later fails the suite
instead of shipping uncovered. Mutation-verified non-vacuous.

**Standing constraints:** X-08 — `lib/masked-identity.ts` and the mail masker stay separate
modules, no import either direction. Never mask non-personal data (club, event, category,
weight label, document TYPE, fee definition). No mask can redact prose, so free-text carriers
(rejection reasons, reviewer notes, admin messages) are bounded at the WRITE boundary instead.

**Open operator rulings, not decided:**
- Mask shape `A** Y**` keeps every initial and the word count — against a known club roster
  that is often one person. Unchanged on purpose; strengthening it needs a snapshot net first.
- A parent of two `Y** ` children gets two identical rows in the guardian notice. Options
  offered: ordinal on colliding rows, or drop the list to a count.
- Should rejection reasons / reviewer notes reach guardians at all? If not, drop `reason` from
  the guardian legs of the recipient loops — a caller change, not blanking it for everyone.
- OTP codes render in the mail **preheader** (`auth.ts`), i.e. the lock-screen preview.
  One-line fix (`preheader: copy.subject`), deliberately left as a product call.
- `adminCategoryEditFlow` v3 → v4 needs a reseed before the new KVKK hint appears.
- Legacy `outreach_delivery` rows still hold addresses in `idempotency_key`. Operator's call.

Related: [[project_email_templates_redesign]], [[feedback_audit_every_user_facing_sentence]].
