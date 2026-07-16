---
name: project_weigh_in_referee_portal
description: "Weigh-in referee panel (COMMITTED f9ff7a2, staging) — first privileged tool at /weigh-in/:eventId; render-engine block, weigh_in table + migration 0028 applied, weighin RBAC; design re-ported to dark instrument cards"
metadata:
  node_type: memory
  type: project
  originSessionId: 4632eb57-3cb9-4d0d-a766-1a1a00acac84
---

First privileged event-day tool (2026-07-02): the **Weigh-In Referee panel** at
`/weigh-in/:eventId` (top-level, weighin:view-only — NOT under /admin). Referee enters measured weight on an on-screen keypad → live
color-first verdict vs each registered class limit → confirm → next athlete. Handles over/under
retry, fail, absent, correction, search, and a not-cleared hard stop.

**Architecture (source-verified, non-obvious):** neither cve-core's RenderEngine (static node tree,
no conditional node) nor its flow engine (linear wizard over a static array) can host an interactive
list-iteration instrument — interactivity lives inside a registered `'use client'` block. So it's ONE
render-engine block `tmmafWeighIn` (DocumentManager pattern, `lib/host-blocks/WeighInInstrument.tsx`),
rendered by the route from a **code-authored one-node tree** via `RenderEngine` — NOT a seeded CVE
page, because a seeded `/weigh-in` slug is reachable UNGATED through the root `[[...slug]]` catch-all.

**Reuse points (bind, don't duplicate):** verdict = `divisionContains` in `lib/eligibility/matchers.ts`
(same half-open floor-aware predicate as the registration category step; tolerance 0), shared via
`lib/host-blocks/weigh-in/verdict.ts`; roster = single `loadEventRoster` in `lib/event-roster.ts` (the
export's `fetchPerLineLines` now projects from it); clearance = existing `registration.missingDocuments`
+ doc-review (no parallel approver). See [[project_registration_category_model]], [[project_per_application_doc_review_redesign]].

**New backend:** `tmmaf_competition.weigh_in` table (row-per-attempt; `outcome` stored, per-class
verdict derived) + migration `0028_weigh_in.sql`; `recordWeighIn` (`lib/official/weigh-in.ts`) server-
authoritative (recomputes verdict, referee=session user, attempt cap 3, writes `athletes.last_approved_weight_kg`
on pass, audit row). RBAC: `weighin:view`/`weighin:record` + delegatable `weigh-in-referee` role in
`bootstrap-admin.ts` + `/weigh-in` proxy gate + `app/weigh-in/layout.tsx`.

**State:** COMMITTED `f9ff7a2` on `staging` (2026-07-03, no push). Migration 0028 APPLIED; superadmin
holds weighin:*. Visual RE-PORTED to the design via a 7-agent ultracode workflow: dark status-gradient
queue/photo cards (verbatim `.dc.html` hex) + monogram watermarks, huge readout, tag'd reg-rows, header
w/ official `/tmmaf-logo.png` + division dropdown + red progress bar. Verified live in the OPERATOR's
real browser — Playwright-Firefox (firefox-1522) can't hydrate Next 16, a HARNESS quirk NOT an app bug
([[tmmaf-playwright-dev-testing]]); a corrupted `.next` genuinely breaks hydration in all browsers →
`rm -rf .next`. Follow-ups (not blocking): cage-pattern texture on the dark cards, a queue-complete /
all-weighed end-state, `federationNumber` (license) generator (display-only, null today). See
[[project_tmmaf_drizzle_migration_ops]], [[feedback_fix_properly_system_wide]].
