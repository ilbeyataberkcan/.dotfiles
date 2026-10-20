---
name: project_release_wave_state_file_footgun
description: "release-wave stale-journal footgun is FIXED (2026-07-19): post-run rmSync + version-fingerprint self-discard. Don't re-recommend manual deletion."
metadata: 
  node_type: memory
  type: project
  originSessionId: ad645454-9d5e-4518-a927-7b3a15c4e457
---

HISTORICAL footgun, now closed in `scripts/release-wave.ts` (PR #24 line, 2026-07-19):

1. `rmSync(STATE_FILE)` after a fully-completed run (commit `ef378f3d`) — a clean run no longer
   leaves an all-complete journal behind.
2. `WaveState.versionFingerprint` (commit `976ed73f`) — sha256 over the sorted `name@version`
   lines of the on-disk version map. `loadState()` discards any journal whose fingerprint doesn't
   match the current workspace (covers crashes before cleanup AND pre-fingerprint journals).

Do NOT re-recommend "delete `.release-wave-state.json` before a release" — the script handles both
directions itself. The file remains the correct mid-release resume mechanism (partial-failure →
re-run resumes the failed wave).

Related: canonical publish path is [[project_cve_release_publish_path]]; since 2026-07-19 the
tag-triggered `publish.yml` also routes through gated `release:wave` (no more raw tiered
`bun publish`).
