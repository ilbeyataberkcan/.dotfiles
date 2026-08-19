---
name: project_next_dev_debug_channel_reload_loop
description: Next 16 dev reactDebugChannel reloads any slow authenticated page forever; disabled via experimental flag in tmmaf next.config.ts
metadata: 
  node_type: memory
  type: project
  originSessionId: b54c4f1c-4923-479a-bf79-fa4c7b87e256
  modified: 2026-08-03T08:54:46.814Z
---

Next.js 16.2.10's dev-only `reactDebugChannel` (default ON) hard-reloads any page whose
document takes longer to stream than client bootstrap — an infinite `location.reload()` loop.
`next/dist/client/dev/debug-channel.js` `wasServedFromCache()` returns
`performance.getEntriesByType('navigation')[0].transferSize === 0`, but `transferSize` is
**still 0 while the response is streaming**. `createDebugChannel` runs at ~340 ms during
`appBootstrap`; a ~700–1000 ms authenticated render therefore reads "served from cache",
fails to restore a session-storage channel keyed on a request id that is fresh every
response, and calls `location.reload()`.

Fixed 2026-08-03 in tmmaf `next.config.ts`: `experimental: { reactDebugChannel: false }`.
Dev-only, no production effect. Dev server logs `⨯ reactDebugChannel` and
`createDebugChannel(` disappears from the served client chunk when it is off.

**Why:** this cost a 12-hypothesis investigation (`.planning/debug/application-status-load-fails.md`)
that blamed data, chunks, HMR, `.next` cache, and app source — none of it was the app.

**How to apply:** symptom is repeated **HTTP 200 document GETs** of the same URL, ~140–500 ms
apart, strictly serial, no 3xx, no `pageerror`, server RSS climbing. `ChunkLoadError` /
`NS_BINDING_ABORTED` are downstream (the next navigation tearing down in-flight requests),
not the cause. Fast pages never trip it, which is why "only when there is data" /
"worse on old accounts" looked like a data bug. Re-enable the flag only after upstream makes
the heuristic wait for `responseEnd`. Related: [[project_cve_core_flow_terminal_rendering]].

**Diagnostic recipes proven here:** `.next/dev/trace` is JSONL of `handle-request` /
`render-path` spans — collapsing it into runs of identical URLs shows a loop instantly, and
`/_next/static/*` never appears there so absent chunk requests prove nothing. A route with a
`loading.tsx` returns `200` with an in-band `NEXT_REDIRECT;replace;<target>;307` in the RSC
stream, never a `Location` header, so header-level checks miss real redirects.
`location.reload/assign/replace` cannot be monkey-patched in Firefox (`Location` is
`[LegacyUnforgeable]`) — trap `beforeunload` and read `new Error().stack` instead.
