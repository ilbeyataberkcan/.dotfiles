---
name: project_release_wave_state_file_footgun
description: "After a successful full release:wave run, delete .release-wave-state.json or the NEXT release silently skips every wave."
metadata: 
  node_type: memory
  type: project
  originSessionId: ad645454-9d5e-4518-a927-7b3a15c4e457
---

`scripts/release-wave.ts` persists `.release-wave-state.json` with `completed: [wave-1..4]` and does
**not** clean it up on full success. On the NEXT release it reloads that file, sees all waves
completed, and skips every wave — publishing nothing, silently — even though the version map has
changed. Always `rm -f .release-wave-state.json` after a clean full run (exit 0 / "ALL 4 WAVES
COMPLETE"). The file IS the correct resume mechanism mid-release (partial-failure → re-run resumes),
so only delete it once the whole run succeeds.

Related: the script skips any version already on GHP (`isVersionAlreadyOnGhp`), so it's safe to
re-run; it restores `workspace:*` on crash/SIGINT; and the canonical publish path is
[[project_cve_release_publish_path]] (`bun changeset version` → commit → `bun run release:wave`,
never `release:publish`).
