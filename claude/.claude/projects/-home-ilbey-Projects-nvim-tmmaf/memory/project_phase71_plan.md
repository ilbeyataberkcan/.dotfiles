---
name: project_phase71_plan
description: "Phase 7.1 (category-system + event-creation refactor) planning shape, repo boundary, and plan decomposition"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5ecfac0b-6f99-443d-89d2-02334b00d64e
---

Phase 7.1 = category system + event-creation refactor. SPEC has **14 requirements (R1–R14)**, CONTEXT has **18 decisions (D-01–D-18)**; ROADMAP maps NO REQUIREMENTS.md IDs to it (TBD/0-0, inserted-urgent), so coverage units are R*/D* and the GSD requirements-coverage gate is a no-op. Ambiguity 0.12 — discuss+spec already done.

Operator decisions for planning (2026-06-21):
- **Plan BOTH repos.** The D-05/R11 general-purpose multi-select/collection collector is **cve-core upstream** work in `/home/ilbey/Projects/nvim/synapsys-cve` (sibling repo), NEVER reimplemented in tmmaf. It is Wave-0 plan `07.1-00`; tmmaf event-creation (R4) + category-edit (R10) flows depend on it. Consuming the new build needs an operator build→publish/link checkpoint (autonomous:false). See [[project_cve_release_path]] [[project_bun_dual_cve_core_store]].
- **Reference existing design system** for UI (no separate gsd-ui-phase): plans cite synapse-core design system + existing `Tmmaf*` host-blocks + preview HTMLs; fidelity via the design-system HTML review surface, not subagent screenshots ([[feedback_visual_analyzers_weak]] [[feedback_preview_html_is_element_ground_truth]]).

Plan naming: `07.1-NN-PLAN.md` in the phase dir; YAML frontmatter (phase, plan int, type, wave, depends_on, files_modified, autonomous, requirements, must_haves.truths/artifacts). Latest migration is 0010 → new schema = `0011`. Cross-schema FK to cve_payment = plain col + raw ALTER (mirror 0008), operator runs `bun db:migrate` ([[project_tmmaf_drizzle_migration_ops]]).
