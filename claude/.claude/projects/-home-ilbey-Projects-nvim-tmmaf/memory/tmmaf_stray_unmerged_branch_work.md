---
name: tmmaf-stray-unmerged-branch-work
description: "Audited 2026-07-25 — the only real work NOT in staging/matchday line: PLAT-05 per-line audit (unpushed local staging), email-verification gate + CI Node-24 bump (backup branch), a flows test-timeout fix"
metadata: 
  node_type: memory
  type: project
  originSessionId: 15b6e569-79ca-4830-bc46-4f6e04710ed0
  modified: 2026-07-26T15:12:36.626Z
---

Full branch audit on 2026-07-25 (28 local branches vs `origin/staging`). Everything is contained
in the matchday line **except** these, verified by content, not just by `git cherry`:

1. **~~Local `staging` branch~~ → now `keep/staging-plat05-260704` — 6 commits, never pushed** (2026-07-04..07-06).
   **Moved 2026-07-26:** `staging` was fast-forwarded to the matchday tip `1ab8706` to give the operator a
   stable base, so these 6 commits now live only on the `keep/` branch. They were deliberately NOT merged —
   `0f6bc12` would regress the shipped weigh-in, and the `.planning/` edits would have re-introduced exactly
   the stale STATE/ROADMAP content the same session was repairing. The one that matters:
   `4bc61cf feat(audit): emit audit_log rows on privileged registration decisions (PLAT-05)` —
   emits `subject.type: 'registration-line'` audit rows on per-line approve/reject (incl. bulk),
   cancellation, level override, and first-time application finalize. 9 `internal-operator` sites
   vs **4** in the matchday line, which audits only club-assign / region-set / coach-set /
   payment-status plus application-level rows. **The per-line decision audit is genuinely
   missing.** Its sibling `0f6bc12 refactor(weigh-in): render natively, drop RenderEngine` is
   *superseded, not lost* — the shipped line deliberately kept RenderEngine with a comment
   explaining it is a code-authored one-node tree.
2. **`backup/2026-06-12-deferred-work` — 11 commits.** Two still absent:
   `ce321ca auth: hard email-verification gate for /app portal and event application` (there is
   **no** `app/verify-email/` route and no `emailVerified` gate in `app/app/layout.tsx` or
   `lib/registration-entry-actions.ts`), and `06cd806 ci: bump actions to Node-24 majors` —
   workflows are still on `actions/checkout@v4`, see [[gha-node20-deprecation]] for the
   2026-09-16 removal deadline. `19e4d4f` (fail build on missing reCAPTCHA key) is **covered
   differently** — an `env.ts` boot-time pairing assertion, which is better than a build guard.
3. **`gsd/phase-09` — `ae9d832 test(flows): warm injector module graphs in beforeAll`** so the
   first dynamic import does not blow the 5s timeout. Real fix, still unmerged.

Ignorable strays: `feat/event-creation-catalog` (one `graphify update`), `gsd/phase-11` and
`gsd/phase-09`'s docs summaries, and `fix/captcha-v2-fallback` — its `57f0bcd` v3→v2 fallback is
already patch-equivalent in the shipped line; its other 6 "unique" commits are just local
staging's 6, because it branched off local staging.

**Why:** local `staging` looks disposable (285 behind) so a reset would be the obvious cleanup —
that would silently drop the PLAT-05 audit coverage.

**How to apply:** do not delete `keep/staging-plat05-260704` or `backup/2026-06-12-deferred-work`
until PLAT-05, the email-verification gate, and the Node-24 CI bump are either cherry-picked or
consciously dropped. Each is a separate small PR, not matchday scope. Related:
[[matchday-design-implementation-milestone]], [[captcha-rejections-unaudited]].
