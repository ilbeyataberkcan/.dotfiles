---
name: TMMAF client deck — frame for the customer, not the dev team
description: When working on the TMMAF design-system presentation deck (or any client-facing deck for this project), focus content on brand, blockers, and asks — not on internal phase numbering or technical detail
type: feedback
originSessionId: 20dcbca4-fb81-4265-8c7f-e39b56b716d1
---
For client-facing TMMAF artifacts (deck, packet, presentation script), the audience is the federation, not the dev team.

**Why:** The user reviewed the phase 11 deck and explicitly said most of the technical information presented was not relevant to the customer. The federation does not know what "Phase 3" or upstream package terminology means; surfacing internal milestone naming or implementation detail loses them. They reacted positively to the design-system-as-art angle (color, type, motifs, components) and to the card-reveal animations — but rejected the broader narrative as "too technical, information-oriented".

**How to apply:**
- Focus deck/packet content on:
  1. **Design decisions that represent the federation's brand** (voice, type, motif rationale)
  2. **Current blockers** (what's stopping progress, in plain language)
  3. **What we aim to achieve and what we need from them** (specific federation-side decisions)
  4. **Customer-facing deliverable timeline** with concrete dates / milestones — NOT internal phase numbers
- Avoid:
  - Internal jargon: `synapsys-cve`, "Phase 3", "host application", "package handoff", "matchmaking" as a meta-stream
  - Engineering rationale presented as a design rationale (e.g. "registry maps" as a slide topic)
  - Deep architectural narrative — federation cares about outcomes, not mechanism
- Keep:
  - The card-component zoom-reveal motion pattern — user explicitly liked this
  - The system-as-art opening (Sistemin Doğuşu / Ses ve Üslup / Görsel Motifler / Renk / Tipografi / Boşluk) — these landed
  - The decisions/blockers/asks structure — but with rewritten content per the focus list above
- Defer-then-revisit: when the user says "we are setting up the groundwork" or "this can be handled later" about content/flow, the foundation pass is acceptable. A dedicated polish pass should rework flow, zoom-emphasis points, and the Turkish copy before the deck ships to the federation. Do NOT consider the deck "done" once functional — it's "foundation done"; content polish is a separate explicit ask.
