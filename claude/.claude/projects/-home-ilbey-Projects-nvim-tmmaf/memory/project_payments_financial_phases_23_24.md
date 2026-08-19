---
name: project_payments_financial_phases_23_24
description: Phase 23 (payment surfaces + event financial mgmt) is MID-EXECUTION — 8/12 plans shipped, blocked on the operator package publish; phase 24 is Corpenza invoicing
metadata:
  node_type: memory
  type: project
  originSessionId: 32449b4e-0397-47b3-80f9-7766cac6662e
  modified: 2026-07-28T22:54:43.657Z
---

Execution order is deliberately out-of-numeric: **20 → 23 → 24 → 21 → 22**. No file overlap with the
matchday line; phase 21 is separately gated on environment defects.

**Phase 23 status (2026-07-27): MID-EXECUTION, 8 of 12 plans shipped.** Planned as 12 plans / 6 waves
after 3 adversarial rounds (28 findings closed) plus a clean plan-checker pass.

**Shipped + gates green:** 23-01 package nav/route seams (`hostSurfaces` / `navOverrides` /
`rowEnrichment`) · 23-02 card capture + contract fields + the `ids` filter on all THREE query-type
duplications · 23-03 table enrichment + selection seam · 23-04 task 1 (migration 0047) · 23-05 finance
permissions + shared display vocabulary · 23-06 `lib/admin/finance-queries.ts` (D-12 single source,
₺500−₺200=₺300 fixture green) · 23-08 finance export kind + per-kind export permissions · 23-12 lint
baseline 83 errors → 0.

**Migration 0047 IS APPLIED** — `card_last4` / `card_network` / `refunded_amount_minor` on
`cve_payment.payment_intents`, all nullable, 0 backfilled across 104 rows.

**Remaining: 23-07 (publish — OPERATOR), then 23-09 / 23-10 / 23-11 (the UI surfaces).** No host code
importing the new contract fields typechecks until `cve-payment-processing@10.3.0` is published and
pinned. Publish ONCE, all seams in one minor.

**Open operator gates:** publish + pin bump · `charge.succeeded` on staging AND live Stripe endpoints
(card columns stay NULL until then) · design fidelity sign-off · `git push`.

## Corrections that execution proved (supersede the original plan text)

- **`registration.paymentStatus` does NOT change.** It keeps `unpaid | paid | not_required` with ZERO
  schema change — display relabel only (`paid`→Ödendi, `unpaid`→Bekliyor, `not_required`→Sponsorlu).
  The operator rejected the migration outright: `not_required` already IS sponsored.
- **The package ships no migration machinery** and is ORM-agnostic. The package owns the *contract*
  (schema fields, store methods, webhook write path); **tmmaf owns the physical `cve_payment` DDL**.
- **A partially-refunded intent LEAVES the paid state**, so "Σ paid − Σ refunded" as two independent
  sums double-loses it. Use a per-intent effective amount.
- **`hostSurfaces` alone cannot produce the target nav** — package children carry hardcoded English
  labels with no order, so a neutral label/order override seam is also required.

## Live findings surfaced during execution, unresolved

- **Pre-existing store duplication:** `cve-auth` 13.0.0 + 13.0.1, `cve-user-management` x3,
  `cve-admin` x2 peer-hashes. `cve-core` is single, so no flow split. But
  `cve-payment-processing@10.2.2` resolves *different* `cve-admin`/`cve-auth` copies than the app.
  See [[project_bun_dual_cve_core_store]].
- **The test suite is nondeterministic under concurrency:** `admin-access-durability`,
  `federation-org-storage`, `referee-score-lifecycle` rotate as failures against the shared
  long-running `tmmaf_pg`; all pass in isolation. Judge any failure by re-running it alone.
  `bun run test` passing is a phase-23 acceptance criterion the suite cannot currently satisfy.
- **`synapsys-cve` has concurrent activity** — another session layered v1.5 cve-matchmaking commits on
  `feat/federation-platform` above the payment work. The publish carries that branch.

## Operator amendment 2026-07-27 (post-wave-1) — D-17 / D-18

"Ödeyen sporcu" sponsored inclusion and the catalog-mismatch basis (gross vs net) are **user-facing
toggles**, not fixed choices — the operator wanted both readings. URL params, defaults expressed by
ABSENCE of the key (sponsored excluded, basis gross), one options parameter on the existing query
function, never a second query path. Recorded as a dated amendment rather than rewritten into the
locked SPEC. The lint baseline also entered scope in the same decision.

## Still-valid locked decisions

- **collected = Stripe settled minus refunds/reversals**, plus a catalog-price mismatch warning.
- **Card networks are plain text in their own column**, separate from last4 — no logo assets. Persist
  `network`, not `brand`. **Troy is unreachable — Stripe doesn't support it**
  ([[reference_stripe_card_capture_facts]]).
- **Card capture = subscribe `charge.succeeded`, read inline.** Independent idempotent upsert keyed by
  the intent; never settles, no-ops when the row is absent, safe to replay.
- **`refunded_amount_minor` is ASSIGNED** from cumulative `amount_refunded`, never accumulated — `+=`
  double-counts on Stripe's 3-day retries.
- **No historical card backfill** — pre-change rows render `—`.
- **Four permissions:** view / export / reconcile / invoice, hidden in UI AND rejected server-side
  ([[feedback_client_is_dumb_reflection]]). `reconcile` and `invoice` ship grantable-only in 23.
- **IA:** Payments › Özet (landing) · Etkinlikler · İşlemler · Ücret Tanımları · Ayarlar.

**Phase 24 — Corpenza Accounting.** API `https://corpenza.com/api/external/accounting`,
`Authorization: Bearer`. Invoices are **metered and non-deletable — cancel only, the number stays
in sequence**, so no agent may ever create a real one; tests use `lib/corpenza/fixtures.ts`.
`CORPENZA_API_KEY` follows the `STRIPE_API_KEY` shape in `lib/env.ts`.

**Plans 24-01..24-06 SHIPPED** (`b22874c`, `0486e9f`, `9bcb5e4`, `272bb31`, `835b86c`, `ac44ce8`)
— but as commits with **no PLAN/SUMMARY artifacts on disk**, so the phase record must be
reconstructed before it can close.

**The federation REVISED the contract on 2026-07-28, invalidating part of what shipped.** The
plumbing (facade, `finance:invoice` + 60s step-up, claim-before-call guard) is correct; the
**payload and the grain are wrong**:

- **Grain: one invoice per event per SUCCEEDED paymentIntent**, not per athlete per event — an
  athlete who validly pays twice gets two invoices. This kills migration 0048's
  `(event_id, athlete_id)` partial unique index. Preserve its property that `failed`/`cancelled`
  rows fall OUT of the index so a considered reissue stays possible.
- `clientName` = the **card owner** from Stripe `billing_details`, not the athlete.
- `clientCountry` and `clientVatNumber` are **empty strings with the keys present**.
- **`autoVat` is `true`** — settled 2026-07-28 on the authority of the approved object,
  superseding the earlier "I believe the autoVat should be false".
- `description` is exactly `{Athlete's Name} event participation fee ({last 4 digit})`. The
  pipe-delimited category/discipline/weight-class proposal is dropped.
- `unitPrice` is **major units** in the JSON while everything else is bigint minors.

**ROOT CAUSE OF THE STRANDED INTENTS WAS A PACKAGE BUG, not missed webhooks.** `service.ts:998`
skipped the state write whenever `canTransition` was false; `LEGAL_TRANSITIONS` had no
`pending-provider-action → paid` edge, and every tmmaf Checkout intent is born
`pending-provider-action` while every settling webhook maps to `paid`. So since 10.2.0 (adopted
2026-06-22) settlements were silently skipped with an `illegal_state_transition` audit row —
**52 such rows, first 2026-06-24**, the day after the last intent ever reached `paid`. Of 52
stranded intents **26 held a persisted `paid` webhook** (₺101,416.60 invisible to
`loadEventFinancials`, which counts only `paid|refunded|reversed`) and 26 were genuinely
abandoned. **A webhook resend cannot fix it** — the event is persisted, so a resend dedups to
`{skipped:'replay'}`. Registrations mostly self-healed because
`finalizeRegistrationFromSettlement` works off the FLOW INSTANCE and never reads intent state.

**SHIPPED 2026-07-28:** matrix widened + `PaymentService.reconcileIntent` + payer-identity capture
+ `billing_details` redaction (raw block was persisting the payer's email/phone/address/tax id);
host `Doğrula` rewired onto `reconcileIntent` with the host Stripe facade DELETED; migrations
0049 (payer identity) + 0050 (invoice re-grain) APPLIED; `clientCountry` now from Stripe;
`Doğrula` added to the global İşlemler list in three placements via two NEW package slots
(`rowAction`, `pageAction`) — page button is page-scoped AND needs-it-filtered, so always under
`MAX_VALIDATE_BATCH = 50`. Package pinned at `0.0.0-payment-20260728152818` (BOTH sites).

**Snapshot publish recipe (works, repeatable):** `changeset version --snapshot payment` bumps
matchmaking too — `git checkout` matchmaking first (another session holds an unreleased MAJOR),
`npm publish --tag payment` from the package dir, then `git checkout` to restore 10.2.2 and the
changesets. tmmaf `bun install` needs `NODE_AUTH_TOKEN` exported (tracked `.npmrc` interpolates
it and empty OUTRANKS `~/.npmrc`). The Dockerfile already mounts it as a build secret, so staging
and live install fine given a `read:packages` token.

**PHASE 24 CODE COMPLETE 2026-07-29 at 15/15.** Pin `0.0.0-payment-20260728223822` (BOTH sites).
Migrations 0049/0050/0051 applied. typecheck clean, lint 0 errors, 1660 tests, `next build` green.

**Two settlement facts that took three attempts each and must not be relitigated:**

- **`registration.payment_status` is the settlement truth every figure reads** — `hasPaid`
  (`invoice-queries.ts:101,140`) and `collectedMinor` (`finance-queries.ts:209`). Healing the
  INTENT alone leaves `Tahsil edilen ₺0,00` and refuses the invoice. Reconcile now propagates via
  the same `finalizeRegistrationFromSettlement` the webhook uses. `flipRegistrationPaymentToPaid`
  is therefore the WEBHOOK's path too — scope it to the instance's own `selected_lines_json`
  pairs, and where absent (398 of 589 instances) to rows already stamped with that intent. Never
  widen to (athlete, event): it sweeps offline-paid and second-application lines.
- **Preview heals, commit does not** (`create-invoices.ts:322` true / `:368` false), and the
  dialog commits `preview.invoiceIds`. Sharing `resolveBatch` is NOT enough — preview and commit
  are separate requests, so a commit-side heal can create MORE invoices than were quoted.

**Stripe already supplies the payer country under the default `auto`** — verified against 8 live
charges, all carrying `billing_details.address.country` with every other address field null.
`billing_address_collection: 'required'` was tried and REVERTED: no new data, full postal address
for every athlete. `card.country` is the ISSUER's country (`US` on test cards), not the payer's.

**Doğrula never mails.** `finalizeSettledIntent(id, { notify })` — reconcile passes `false`,
the invoice preview passes `true`. The flag gates the SEND only and never spends the mail
idempotency key, so a silent heal leaves the receipt owed rather than lost.

Related: [[project_planning_reconciliation_260726]], [[project_deferrable_payment_pre_payment_approval]],
[[project_cve_release_path]], [[project_tmmaf_drizzle_migration_ops]],
[[feedback_ultracode_gsd_plan_execute]].
