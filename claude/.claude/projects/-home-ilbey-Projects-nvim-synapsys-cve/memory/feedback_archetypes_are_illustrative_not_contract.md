---
name: Host archetypes in INDUSTRY-NEUTRALITY-AUDIT are illustrative, not a hard per-package requirement
description: Don't treat the "≥3 distinct host archetypes" line in INDUSTRY-NEUTRALITY-AUDIT.md as a strict recurring deliverable per phase; pinning archetypes biases implementations toward them, which is exactly what the audit is supposed to prevent.
type: feedback
originSessionId: 2930c15c-9dea-4d60-b972-878353f112c4
---
The GATE-06 INDUSTRY-NEUTRALITY-AUDIT template's "≥3 host archetypes" section was originally meant as illustrative examples to communicate intent — not a hard, recurring contract enforced per package. Locking specific archetypes (e-commerce / news-media / SaaS docs, or any other named set) creates implementation bias toward them, which directly contradicts the industry-neutrality goal.

**Why:** Industry-neutral packages should be designed so that ANY plausible host can integrate them without modification. Naming specific archetypes and then judging "sufficient reframing" against those names trains the implementation to optimize for those particular hosts. The audit's real purpose is to PREVENT that bias, not codify it.

**How to apply:**
- When designing GATE-06 evidence for a new phase, treat the archetype list as a one-time illustrative artifact at most. Don't propose strict archetype-comparison checks across phases.
- When auditing/verifying an existing GATE-06 deliverable, don't fail or block on archetype reframing judgment calls. Pass if the body is plausibly neutral and the forbidden-token grep is clean.
- When writing UAT items for industry-neutrality, don't ask the user to judge cross-package archetype reframing as a strict comparison — it's the wrong frame.
- If a future phase template (CAPABILITY-MATRIX, INDUSTRY-NEUTRALITY-AUDIT, etc.) inherits this language, gently flag it but don't block on it; the user's stance is that archetypes are illustrative, not load-bearing.
