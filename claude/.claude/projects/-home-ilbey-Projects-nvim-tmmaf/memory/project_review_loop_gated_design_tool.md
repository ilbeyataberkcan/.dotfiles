---
name: project_review_loop_gated_design_tool
description: "The synapse-core review app is a gated, sequential visual design tool — build/approve Stage 1, THEN Stage 2, THEN the real pages; approved designs become seedable RenderEngine trees"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2b34fa58-2e9f-4c0f-b947-d5b1587a3840
---

The `synapse-core-design-system` review app is a **gated, sequential visual design tool** (a "pre-cve-studio visual design tool / pre-cve-studio-ai-helper"), not just a review surface. Build + iterate ONE stage at a time, each a gated annotate→fix→accept loop — **never build a later stage before the earlier one is operator-accepted**:

1. **Stage 1 — Foundations**: tokens, fonts, buttons — the overall foundations → feedback↔fix loop → ACCEPT.
2. **Stage 2 — Building blocks**: composed elements — cards, interactives (pickers/selectors), text elements — built FROM the foundations; the reusable blocks of every screen/page. **NOT full screens yet.** Drafted only AFTER Stage 1 accepted → loop → ACCEPT.
3. **Stage 3 — Pages / screens / layout**: assembled from the accepted building blocks, **one page at a time** (landing pages or flow-step screens like payment/auth). Per page, in order: **layout → building blocks + their variants → final assembly**. Carried out via the host stage; only AFTER Stage 2 accepted.

(Corrected 2026-06: the OLD model wrongly made Stage 2 = screens. Screens are Stage 3; Stage 2 is the building-blocks layer between foundations and pages.)

**STAGES ARE GENERATED ONE AFTER ANOTHER — NOT pre-generated-and-unlocked (operator corrected this repeatedly).** Only the stages built so far EXIST. Right now only Stage 1 exists; Stage 2 is GENERATED when Stage 1 is finished, Stage 3 when Stage 2 is finished. "Locked from interaction" means the later stage is **absent / not generated yet** — NOT a disabled tab sitting on already-built content. The reviewer that pre-generated Stage 2 (StageScreens) and merely *gated/unlocked* it was the BUG (operator: "The stages are not to be unlocked but to be built one after another. Not generated directly but locked from the interaction... right now we can't see the stage 3. And that is the correct behavior. It will be generated when we finish the stage two."). So the generator must be **stage-incremental**: emit/render only stages built so far; never scaffold a future stage's content ahead of time.

End vision: the approved designs are **RenderEngine trees that can be seeded into the real apps' databases** — the tool's output IS production-ready app content.

**The review app is an EVOLVING feedback instrument — grow its input tooling as needed (operator directive 2026-06-08).** When detecting fixes, also detect *missing information* that would make the feedback clearer, and ADD review-page tools so the operator can inform you faster than typing: e.g. more **axis chips** (feedback categories), **edit-an-existing-annotation from the sidebar** (clicking a numbered pin / sidebar row opens the SAME give-feedback popup PRE-FILLED with the note + the selected chips, to update it), and any analogous affordance you can invent. Also: **specimen/part presentation containers must CONFORM TO THE COMPONENT** — size to best represent what they display, never force a too-narrow shape that squishes/breaks the element (mobile/responsiveness is a later stage; first land the components). Keep the per-specimen **zoom** affordance. **MANDATORY: every review-page change MUST be mirrored into the skill's scaffold generation script + its templates** (`~/.claude/skills/synapse-core-design-system/scaffold/review-app/`) so `scaffold --stage N` stays reproducible — this template-sync is itself an allowed extra pass AFTER the fix passes, run automatically without waiting. Relates to [[feedback_evolve_skill_as_we_progress]].

**The gate is about RESOURCE FOCUS, not an approval ceremony (corrected twice).** The point of one-stage-at-a-time is that you *get feedback on that one stage and focus only on it* — if you build a later stage first, you waste resources on something the earlier stage's feedback might force you to rebuild. Operator: "It is not about me approving them. It is about you getting feedback and focusing only on one stage. Otherwise you would lose your resources on a stage that we might need to rebuild." Also: **"Only create one stage at a time and add to the UI afterwards"** — build the single stage, wire it into the review UI, get feedback, THEN move on. This same discipline applies beyond the review app: don't build a downstream artifact (e.g. a skill-doctrine rewrite) before the current piece is confirmed — you might rebuild it.

**Why:** wasted-rebuild avoidance + tight feedback loops; the designs end as RenderEngine trees seedable into the real apps' DBs.
**How to apply:** create/iterate exactly ONE stage, add it to the UI, gather feedback, incorporate — never build the next stage ahead. Annotation targeting offers two levels — the whole specimen card (overall change) vs a specific inner element (targeted change). Relates to [[feedback_visual_analyzers_weak]] (operator + impeccable confirm fidelity).
