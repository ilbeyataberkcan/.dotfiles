---
name: t3-preview-device-binding
description: t3 preview tools bind to a device the user picks; if it's not tulpar_arch the browser can't reach the local dev server
metadata:
  type: feedback
---

The `mcp__t3-code__preview_*` tools target whichever device the operator has selected in t3,
and there is NO device parameter I can pass. tmmaf's servers run on **tulpar_arch**
(`/etc/hostname`). When the preview was bound to another device (synapsys-desktop), every
navigation to `localhost:3000` / `127.0.0.1:3000` failed with `ERR_CONNECTION_REFUSED` while
`curl` on the box worked fine, and no request ever reached the dev server — it loads
`example.com` fine, so it looks like a cloud browser rather than a wrong-device problem.

**Why:** I wasted ~20 tool calls diagnosing this as "t3 browser is cloud-hosted, needs a
tunnel" and nearly asked to expose the dev DB (1759 accounts) publicly.

**How to apply:** if preview navigation to a local port fails but curl succeeds, don't
conclude the browser is remote — ask the user to point the t3 preview at `tulpar_arch`, then
retry `preview_open`. Also: use `bun run dev:https` (passkeys/step-up need a secure context),
`preview_resize` times out on this setup (no phone-viewport testing), and `preview_type`
often fails — focus the input via `preview_evaluate` then send `preview_press` keys.
Related: [[tmmaf-test-baseline-needs-docker]].
