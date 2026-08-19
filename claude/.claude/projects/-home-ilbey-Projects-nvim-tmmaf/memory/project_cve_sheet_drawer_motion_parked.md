---
name: project_cve_sheet_drawer_motion_parked
description: "cve-components Sheet AND Drawer never run their enter animation — the panel parks off-screen while the backdrop paints; every consumer needs [transform:none]!"
metadata: 
  node_type: memory
  type: project
  originSessionId: a5006746-e261-4020-bc9e-080b034854b2
  modified: 2026-08-08T17:21:14.093Z
---

`cve-components` 11.1.0 `Sheet` and `Drawer` both wrap Radix `Dialog.Content` in
`motion.create(forwardRef(...))`. Framer-motion (12.42.2) renders the `initial` transform as a
plain inline `style` and **never attaches**, so the panel stays parked at `translateY(100%)` /
`translateX(100%)` — one viewport off-screen — while the sibling overlay (a real `motion.div`)
animates fine. Symptom: **the page darkens and no panel appears.**

Measured 2026-08-08, Firefox 390x844 and 1440-wide: Sheet rect y=844 on an 844px viewport;
Drawer rect x=1440 on a 1440px viewport; unchanged after 4s (not a slow animation).
`prefers-reduced-motion: false`, rAF fires, framer-motion resolves. Ruled out by measurement:
z-order (backdrop is correctly `z-modal - 1`), and Tailwind class generation (the package
`dist` IS an `@source` in `app/globals.css`).

**Swapping Sheet→Drawer fixes nothing** — same wrapper, same defect, different axis.

**Host fix, SHIPPED to staging 2026-08-09 (`6601dbb4`):** `className="[transform:none]!"` on the panel. An author `!important`
outbeats framer's normal inline style, so the panel lands at its CSS resting position.
Live at `lib/host-blocks/RegistrationAthleteSelector.tsx` and
`lib/admin/components/StaffConfirmationBoard.tsx` (the admin "Akıştaki başvurular" drawer had
been silently off-screen too — nobody had reported it).

**FIXED AT SOURCE — `@synapsys-integrated/cve-components@11.1.1`, published 2026-08-09** (repo
commit `acef00d1` on `feat/federation-platform`, tag `@synapsys-integrated/cve-components@11.1.1`).
Both now hand Radix a REAL `motion.div` via `asChild` and close via an `isClosing` flag +
`onAnimationComplete` — the strategy `Dialog.tsx` already used, so the three modal surfaces
converge. That also restored the exit animation they never had: the old `AnimatePresence`
wrapped `Dialog.Portal`, an always-present element, so it never saw an unmount and every
`exit` prop was dead code. No API change. Regression test `panel-motion.test.tsx` asserts the
failure signature (an open panel still at a full 100% translate) and is mutation-verified.

**ACTION REQUIRED IN ANY HOST ON <= 11.1.0:** bump the pin, then DELETE every
`[transform:none]!` workaround — it now suppresses the working animation and pins the panel.

Also uncovered: `RegistrationAthleteSelector` is unreachable in the running app — nothing
supplies `canonicalController`, so `TmmafCanonicalRegistration` always falls back to
`mode: 'self'`. Related: [[project_cve_design_system_z_utilities]].
