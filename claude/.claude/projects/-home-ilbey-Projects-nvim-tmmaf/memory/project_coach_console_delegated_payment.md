---
name: project_coach_console_delegated_payment
description: "Coach console + separated delegated registration + shared coach/parent batch payment — 11 units COMPLETE and PUSHED (branch worktree-coach-console-delegated-payment, 56f96a69), awaiting package publish + seed:storage-roles"
metadata:
  type: project
---

**Quick task `260804-u81`, completed 2026-08-05.** 11 units, 4 waves, 51 commits on branch
`worktree-coach-console-delegated-payment` — **pushed to origin at `56f96a69`** (51 ahead of
`staging`, which stays untouched at `a2a9bbf3`). No PR opened; merge is the operator's call.
The synapsys-cve side (`expirePaymentSession`) is the **operator's** to publish — they said so
explicitly and it was deliberately not pushed from here.

Gate: typecheck clean · lint **0 errors** · **2872 passed / 4 failed / 15 skipped**. The 4 failures
are `send-payment-reminders.test.ts` (3) + `event-creation-edit-mode.test.ts` (1) — **pre-existing**,
proven three ways (base re-run, changed-file set, import graph). They are real assertion failures
against real behaviour, not flake, and still need an owner.

## What shipped

- **Coach console** `/app/coach/events` → event cards → per-event registration table. The seeded
  `coach-registration` flow mounts in a **dialog**; its documents step names each athlete's missing
  documents and opens **their own vault** in a second column of the same `DialogContent` (Radix has
  no placement variant — two modals would fight the focus trap).
- **Self vs delegated split**: `/register/{eventId}` is self-only. `renderCoachRegistration` and 3
  orphaned delegated `'use server'` endpoints deleted; the two legacy routes remain **redirects**
  because live Stripe sessions baked those URLs.
- **One `mintDelegatedBatchPayment`** for coach and parent. Cap **50** (OD-1); oversize selections
  **chunk sequentially** — one Stripe intent per chunk, chunk k+1 blocked until k finalizes, and
  both cursors **derived** (settlement state / step position), no table, no migration, no worker.
- **Cross-payer double-charge closed** — `classifyDelegatedHolds` sees every live checkout at the
  event whoever started it → resume / supersede / contended / sequenced. **Expiry strictly precedes
  minting; a failed expiry aborts the mint.**
- Mails carry payment **and** consent deadlines, one `recipientRole` voice, per-recipient CTA.

## OPERATOR-OWED (blocking a real deploy)

1. **Publish `cve-payment-processing` and re-pin BOTH `dependencies` and `overrides`.**
   `PaymentService.expirePaymentSession` is written + changeset (`a8a57da8` on
   `feat/federation-platform` in synapsys-cve) but **unpublished**; source/installed/pinned are all
   10.3.0. The host uses a **capability probe** (`typeof svc.expirePaymentSession === 'function'`),
   so superseding activates on publish **with no host edit** — until then it correctly refuses and
   renders no override button.
2. **`bun run seed:storage-roles` BEFORE this reaches any environment.** Without
   `storage:upload:on-behalf`, cross-owner `listForOwner` throws and the whole documents step renders
   "Akış yüklenemedi." — not a degraded badge.
3. `bun run build` with the dev server **down**; visual UAT; **the user pushes**.
4. NOT owed: `seed:explicit-permissions` (no new permission — the invented `payment:intent:expire`
   was dropped for the existing `payment:intent:create`) and `seed:coach-registration-flow`
   (`COACH_REGISTRATION_FLOW_VERSION` stays 2 — every addition is an injected node prop).

## Lessons worth keeping

- **A dead executor must HALT a sequential chain.** U07's executor died mid-response having
  committed nothing; the harness returned the unchanged SHA and U11 built on a tree missing U07.
  Fixed, but the pattern generalizes to every wave workflow — see
  [[project_gsd_execute_phase_wave_workflow_recipe]].
- **When a unit dies, re-check the ground before re-running it.** U11 had meanwhile added its own
  hold probe; re-running U07's original spec would have created two divergent answers to "is there
  a live hold". Re-scoped (OD-4) to extend the probe, which also **cut** the planned
  `payerUserId` stash change — intents already carry `payer_id` in metadata.
- Adversarial review caught 4 would-have-shipped bugs: unifying the cap at 25 would have broken
  "Tümünü öde" (the payable set is the union of all batches, not one batch); `??` in the badge merge
  where `null` IS "ready" so it would never clear; `EventSelectionGrid` nesting `<main>` inside the
  shell's; and a resume seed that would have locked a coach into a mis-picked batch
  (`affordances: []` means no way back).
- The "0054/0055 unapplied" blocker was **false all session** — see
  [[feedback_verify_db_state_not_docs]].

Related: [[project_phase252_coach_accounts]], [[project_phase253_athlete_consent_parental_authority]],
[[project_payments_financial_phases_23_24]].
