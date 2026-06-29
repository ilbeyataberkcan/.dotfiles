---
name: project_captcha_rejections_unaudited
description: "Deferred cve-auth fix — captcha gate rejections (CAPTCHA_REQUIRED 400 / CAPTCHA_FAILED 403) emit NO audit row and NO log, making login outages invisible server-side; add audit/log emission"
metadata:
  node_type: memory
  type: project
  originSessionId: 6ff7e557-01b9-489d-a66a-a3365ea60159
---

cve-auth's captcha gate (`captchaGate` in `synapsys-cve/packages/auth/src/http/router.ts`, ~L528) returns BEFORE the driver dispatch where audit events are emitted, so a rejected sign-in/account-status request leaves **no trace server-side**:
- `CAPTCHA_REQUIRED` (400, no `x-captcha-response` token) → silent, no audit row, no log.
- `CAPTCHA_FAILED` (403, verifier rejected token) → silent, no audit row, no log.
- `CAPTCHA_UNAVAILABLE` (503, no verifier / verifier threw) → ONLY this one `console.error`s.

This is why the 2026-06-12 prod login outage (site key not baked into the client bundle → no token → 400) showed clean app logs AND an empty `cve_auth.authorization_logs` for `account-status-check` — the request never reached the driver, and the gate logged nothing. Diagnosis had to rely on the browser Network status code.

**PARTIAL FIX shipped host-side (2026-06-24, commit c92cb6c on tmmaf staging):** `lib/captcha-verifier-logging.ts` `withCaptchaLogging()` wraps the host-injected `CaptchaVerifier` in `lib/auth.ts` and `console.warn`/`console.error`s a blocked verdict (operation + reason failed/unavailable + remoteIp, never the token). This covers **CAPTCHA_FAILED** (verifier called → token rejected; e.g. prod reCAPTCHA key on https://localhost:3000) and re-logs UNAVAILABLE with more context. It does NOT and CANNOT cover **CAPTCHA_REQUIRED** (no `x-captcha-response` header) — the router short-circuits BEFORE the verifier is invoked, so the wrapper never runs. That missing-token case is exactly the 2026-06-12 prod outage (site key not in client bundle). 4 unit tests in lib/__tests__/captcha-verifier-logging.test.ts.

**STILL DEFERRED (cve-auth package change):** log + emit an authorization_logs audit row for ALL captcha rejections at the gate (`packages/auth/src/http/router.ts` captchaGate ~L528), CRITICALLY incl. CAPTCHA_REQUIRED, with operationId/outcome/reason/IP, KVKK-safe. Needs the tier-ordered release cycle (host won't see it until cve-auth is rebuilt + bumped). Sibling deferred item: [[project_gha_node20_deprecation]].
