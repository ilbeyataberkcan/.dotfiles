---
name: tmmaf-playwright-dev-testing
description: "How to drive Playwright UI/flow tests against the tmmaf dev server (Firefox, captcha + auth + device gotchas)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 5ecfac0b-6f99-443d-89d2-02334b00d64e
---

Recipe for in-depth Playwright testing of the tmmaf registration/admin flows. Use FIREFOX (user directive), via a Node script — NOT the Playwright MCP browser tools.

- **MCP browser is broken in this session**: the Playwright plugin `.mcp.json` pins the `chrome` channel (`/opt/google/chrome/chrome`, not installed) and a running MCP can't be repointed. Durable fix (future sessions): add `"--browser","firefox"` (or `chromium`) to that `.mcp.json` and restart. For now, bypass the MCP.
- **Drive via a script**, keeping browser output out of context. In an isolated `/tmp/tmmaf-pw/`: `bun add playwright-core@1.60.0` (matches cached `~/.cache/ms-playwright/firefox-1522`; newer wants firefox-1532 which won't install). `import { firefox } from 'playwright-core'; firefox.launch({ headless:true })`. Firefox CANNOT set `isMobile`/`hasTouch` — for "mobile" set ONLY `viewport:{width:390,height:844}` (width triggers the responsive CSS) and use `page.click` not tap.
- **Captcha blocks sign-in**: the `.env.local` reCAPTCHA site key is invalid for localhost, so `DEVAM ET` throws before any network call. Fix WITHOUT editing the secrets file (sandbox blocks `.env` anyway): restart the dev server with Google universal TEST keys injected via process-env (Next prefers them over `.env`): `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe bun run dev`. Plain restart restores real keys.
- **Auth**: passkey can't be scripted; password signup currently 400s `CAPTCHA_REQUIRED` — use the MAGIC-LINK leg + mailpit (HTTP API `http://localhost:8026/api/v1/messages`). auth-client forces `https://localhost:3000` in dev (NEXT_PUBLIC_SITE_URL unset) — reroute `https://localhost:3000/**`→http in the Playwright context.
- **Device is server-resolved** from `Sec-CH-UA-Mobile`+User-Agent (`app/flows/[[...slug]]/page.tsx:426`). A desktop UA renders the DESKTOP chrome even at 390px (false "off-screen" findings). Force real mobile with the dev-only `?device=mobile` query — but it's read once at the instance-URL GET and DROPPED on the `/register`→`/flows/registration/<id>` redirect, so navigate directly to `/flows/registration/<instanceId>?device=mobile`.
- **Storage 500 mid-flow is expected for a fresh account**: the baseline storage role is granted at the flow TERMINAL ([[project_storage_permission_redesign]]), so a magic-link account that skipped onboarding 500s at the documents step. To reach documents→category→summary→payment, grant the role first (onboard, or `ensureBaselineStorageRole`).
- Event slug `tmmaf-2026-open`. Run via a sub-agent ([[feedback_playwright_via_subagent]]); trust concrete observations (bbox, console, network), not "looks good" ([[feedback_visual_analyzers_weak]]).
