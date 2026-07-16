---
name: project_phase_complete_progress_table_gaps
description: "synapsys-cve phase-close: reconcile can't update the 4-col ROADMAP Progress table, checkpoint plans don't self-register progress, and phase.complete skips REQUIREMENTS traceability — three manual fixes needed at every phase close"
metadata:
  node_type: memory
  type: project
  originSessionId: 6c2b6497-dacd-4cf0-a082-9855bb7ba513
---

At v1.4 phase completion, `gsd-sdk query phase.complete` + `bun run reconcile` leave THREE tracking artifacts stale. All three need a manual nudge or the ROADMAP/REQUIREMENTS lie.

**1. `bun run reconcile` can't update the Progress table row.** `.planning/scripts/reconcile-progress.ts` expects a 5-column row `| NN. Name | vX.Y | N/N | Status | Date |`, but the v1.4 ROADMAP Progress table is 4-column `| Phase | Plans Complete | Status | Completed |` (no version column). So reconcile updates the phase **checkbox** (`[ ]`→`[x]`) and STATE counters (`completed_phases`, `percent`) correctly, but the per-phase "Plans Complete / Status" row is a no-op. The per-plan CLI `gsd-sdk query roadmap.update-plan-progress <phase> <plan> complete` DOES handle the 4-col format correctly — that's what actually writes "4/4 | Complete | <date>".

**2. Checkpoint plans (`autonomous: false`) never self-register their plan progress.** A plan whose final task is a `checkpoint:human-verify gate="blocking-human"` (e.g. 01-04's `release:wave` publish) pauses and returns before its executor runs `roadmap update-plan-progress` for itself — so the Progress table stalls one short (showed "3/4 In Progress" with all 4 SUMMARYs on disk). After completing the checkpoint, run `roadmap.update-plan-progress <phase> <that-plan> complete` yourself.

**3. `phase.complete` does NOT update the REQUIREMENTS.md traceability table.** The requirement **definition** checkbox flips to `[x]`, but the traceability row `| ORG-01 | Phase 1 … | Planned |` stays "Planned". Edit it to "Complete" by hand (it is NOT a reconcile-derived counter, so editing it directly is fine — the "don't hand-edit, it's derived" rule in CLAUDE.md applies only to STATE frontmatter counters + the ROADMAP Progress table).

**How to apply (phase-close checklist after the last plan + verifier pass):**
1. `gsd-sdk query roadmap.update-plan-progress <phase> <each-checkpoint-or-unregistered-plan> complete`
2. `bun run reconcile` (flips checkbox + STATE counters)
3. Hand-edit the REQUIREMENTS.md traceability row(s) for the phase's requirement IDs → `Complete`
4. Commit all three (`.planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md`)

Related: counters are reconcile-derived per CLAUDE.md; see [[project_cve_release_publish_path]] for the publish path that feeds the checkpoint plan.
