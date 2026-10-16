---
name: project_twilio_21609_and_dynamic_links_handoff
description: "Twilio 21609 SHIPPED; cve-dynamic-links 0.2.0 IS PUBLISHED but its package never granted the tmmaf repo read access, so every CI build since e93129ef fails; host wiring still blocked on the short domain"
metadata:
  node_type: memory
  type: project
---

State as of 2026-08-19, both repos pushed, work continues on the laptop.

**Twilio 21609 — DONE, on `staging` (`bd5d7b10`).** Root cause: `statusCallback` was built
straight from `BETTER_AUTH_URL`, which `lib/env.ts` accepts as *any* URL. Twilio validates
StatusCallback **before queueing**, so a non-public origin fails the **message**, not just its
delivery tracking — no SMS went out at all. New `lib/outreach/status-callback.ts` rejects
non-https, loopback, single-label container hosts (`staging-app1`), underscore hosts, IP
literals and embedded credentials; the send **omits** the callback rather than sending one
Twilio refuses. The webhook route reads the same helper, so its signature `exactUrl` can no
longer drift from what Twilio was given. `TWILIO_STATUS_CALLBACK_ORIGIN` is the override.

- **OPEN, operator:** `docker exec <staging-app> printenv BETTER_AUTH_URL`. If it is not
  `https://staging.fighterscore.com` that is the live cause; correcting it restores delivery status.
- **OPEN:** `.env.example` could not be written from the sandbox — still needs
  `TWILIO_STATUS_CALLBACK_ORIGIN` added and the dead `TWILIO_MESSAGING_SERVICE_SID` removed.

**cve-dynamic-links 0.2.0 — PUBLISHED (confirmed 2026-08-19: 0.1.0 + 0.2.0 both on GitHub Packages, private).**
Also bumps **cve-components 11.2.0** (the FilePreviewModal `renderers` changeset rode along).
Added `policy.destinationBaseUrl` (defaults to `baseUrl`) — **`baseUrl` alone built BOTH the
short URL and the resolved destination**, so without the split a resolver returning
`/app/documents` sends the visitor to `https://short.tld/app/documents`. `og:url` stays on
`baseUrl`. Capability rows DL-50/51 proven.

- **BLOCKING CI (2026-08-19):** every tmmaf build since `e93129ef` fails at `bun install` with
  **403 on `@synapsys-integrated/cve-dynamic-links/0.1.0`** — the package never granted the
  `tmmaf` repo read access (package → Settings → *Manage Actions access* → add
  `synapsys-integrated/tmmaf` → Read). Consequence: `:staging` still points at the
  2026-08-18 build `dce9c598`, so a successful deploy ships stale code.
- **BLOCKING:** bump the tmmaf **`overrides`** entry to `^0.2.0` — `dependencies` already says
  `^0.2.0` (`053451c5`) but **overrides win**, so node_modules is still on 0.1.0.
- **BLOCKING:** the short domain is still unknown. It sets `DYNAMIC_LINKS_BASE_URL`, the Caddy
  block, the DNS record, and the whole SMS character budget.
- Release gate note: `release:test` fails one `cve-auth` test (`setPassword > throws
  AUTH_METHOD_DISABLED`) — **passes in isolation at 2.7s against a 5s budget**, only times out
  under the full concurrency-1 run. Pre-existing, unrelated.

**Design decided, not yet built:** four of the six SMS links (`statusUrl`, `documentsUrl`,
`retryUrl`, `profileUrl`) already resolve to CONSTANT paths in `LINKED_REASONS`, identical for
every recipient — so they become **reserved aliases** (`/durum`, `/belge`, `/profil`): no row,
no TTL, no sweep. Only `setupUrl` and `inviteUrl` get minted links, at the full **22 chars
(~131 bits)** because the short code *becomes* the bearer credential.

**SMS diacritics — the arithmetic is the blocker, not the code.** Target is ONE UCS-2 segment =
**70 characters total**. The current opt-out `" Kapatmak: profil ayarları."` is **26 of them**,
37% of the budget. One segment is unreachable until the federation either shortens it
(~`Kapat: profilden`, 16) or rules that transactional SMS needs none (İYS/ETK opt-out attaches
to *commercial* messages). Fallback is 2 segments WITH diacritics — never re-fold them
([[feedback_turkish_diacritics_never_folded]]). All 27 strings in `transactionalCopy` get
rewritten and each must be audited against its trigger state
([[feedback_audit_every_user_facing_sentence]]).

**Summary side panel — DOES NOT REPRODUCE, still open with the operator.** 12 conditions
(Chromium+Firefox, 4 desktop viewports, reduced motion, mobile 390×844 with `?device=mobile`,
3 sequential-open orders): `#applicant-grid-summary` always commits `transform: none` at
`z-index: 1000` above the z-999 overlay. `w-[min(90vw,26rem)]!` beats `w-96` → 351px on-screen
at 390px. Leading hypothesis: **a stale Turbopack CSS chunk after `bun install`** —
`app/globals.css:15` `@source`s cve-components through a bun-store **symlink**, and installing
cve-dynamic-links rewrote that path; with `z-modal` missing from the served chunk the panel
falls to `z-index: auto` and paints UNDER the overlay, which is exactly the symptom. Operator
check: `getComputedStyle(document.querySelector('#applicant-grid-summary')).zIndex` — `auto`
confirms it, and `rm -rf .next` after any install is the cure.

**Three logged, unfixed `cve-components` Drawer gaps** (one release would close all three):
`Kapat` sits inside the `flex-1 overflow-auto` region so it scrolls out of view on mobile and
the host CANNOT pin it (all children land in that scroller); the package's own close button has
no accessible name; and Radix warns `Missing Description or aria-describedby`.

**RESOLVED 2026-08-21 — CI is green again.** `build-and-push` on `staging` has succeeded on every
push since 2026-08-19, so the `cve-dynamic-links` 403 no longer blocks the image. The `overrides`
pin is still `^0.1.0` while `dependencies` asks `^0.2.0`, so the app STILL resolves 0.1.0 — that
half is unfixed. The short domain is still unregistered.
