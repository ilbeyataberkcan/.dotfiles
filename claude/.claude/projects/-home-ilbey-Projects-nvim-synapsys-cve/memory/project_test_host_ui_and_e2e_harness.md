---
name: project_test_host_ui_and_e2e_harness
description: "cve-test-host UI token conventions, RenderEngine host-block pattern, and the Playwright magic-link-via-DB auth harness"
metadata:
  node_type: memory
  type: project
  originSessionId: 92b3695c-f574-470b-9045-eb41374e5a7d
---

Building/screenshotting UI in **apps/cve-test-host** (learned 2026-07-02):

**Token classes — CLAUDE.md's table is WRONG for this host.** `p-lg`, `gap-md`, `bg-primary`, `bg-surface`, `border-default`, `max-w-container-md` do NOT generate — pages render full-bleed/unstyled. The REAL working tokens (grep `SignInForm.tsx`): standard Tailwind spacing (`p-8`, `px-4`, `gap-3`), `bg-canvas`, `bg-surface-raised`, `bg-accent-primary`, `border-border`, `text-text-primary`/`-secondary`, `status-{error,success,warning}-{surface,fg}` (opacity ok: `border-status-error-fg/30`), `rounded-md`/`-lg`. Only classes inside `transpilePackages` (cve-components) or these real tokens get scanned.

**Canonical page pattern** (`feedback_user_facing_pages_must_use_render_engine`): page = Server Component that builds a `ComponentNode` tree (`section` → host-block node) and hands it to `<RenderEngine rootNode componentRegistry={hostRegistry} animationRegistry strategyRegistry />`. Interactivity lives in a registered host-block (`lib/host-blocks/X.tsx` `'use client'` + `X.schemas.ts` server-safe sibling, registered via `defineComponent` in `lib/registry.ts`). Server actions reach the block by direct import. Template: `SignInForm.tsx`.

**cve-components quirks when used directly in a block:** every component needs an `id` prop (BaseEngineBlockProps). `Input` puts that id on the WRAPPER div; the real `<input>` is `id + "-input"` (Playwright target the `-input`). `Button` renders `type="button"` with no onClick → CANNOT submit a form; use a raw `<button type="submit" className="…bg-accent-primary…">` for submits. `Card`/`Text`/`Badge`/`Input` all render well.

**Playwright signed-in session (no auth helper exists).** This dev server runs `dev:https` on :3000 and `MAIL_TRANSPORT=resend` → magic-link/OTP email goes to the real inbox, NOT mailpit. But the magic-link TOKEN is stored plaintext in `cve_auth.verification_tokens` (identifier=token, value=`{"email":…}`). So: `POST https://localhost:3000/api/auth/sign-in/magic-link {email,callbackURL}` → `SELECT identifier FROM cve_auth.verification_tokens WHERE value::text LIKE '%<email>%' AND value::text LIKE '%email%' ORDER BY created_at DESC LIMIT 1` → Playwright (`chromium` from `/usr/lib/node_modules/playwright`, `ignoreHTTPSErrors:true`) `goto(/api/auth/magic-link/verify?token=<t>&callbackURL=/org)` → real BA session + the `magic-link` marker cookie both land (the `handleAuthAfter` hook issues the marker on `/magic-link/verify`). `getSession` then passes. See [[project_test_host_active_context_wiring]], [[project_cve_auth_no_client_facade]].
