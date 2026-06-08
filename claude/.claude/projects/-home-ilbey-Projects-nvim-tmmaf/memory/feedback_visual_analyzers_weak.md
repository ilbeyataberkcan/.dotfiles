---
name: feedback_visual_analyzers_weak
description: Sub-agent screenshot analysis is unreliable for design fidelity; confirm with impeccable + the operator via an interactive HTML review surface
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2b34fa58-2e9f-4c0f-b947-d5b1587a3840
---

Screenshot-reading sub-agents repeatedly returned "PASS"/"PASS-WITH-NITS" on visuals the operator's eye rejected ("it fails to analyze the images correctly" — media image-handling + composition didn't match the reference). Vision-by-subagent is weak at faithful reference comparison (proportions, photo treatment, composition).

**Why:** the operator: "its visual analyzers are not strong enough" — the agent must not trust its own visual PASS.
**How to apply:** NEVER gate design fidelity on a sub-agent verdict. Confirm via **impeccable** (`critique`/`polish`) AND the **operator** in the loop, presented through an **interactive HTML review surface** that renders each component BOTH in isolation AND composed into a constructed mockup page (so impeccable + the human compare the real render against the reference). Sub-agents may CAPTURE renders (mechanical) but do NOT judge them. Feeds the Phase-4 interpretation skill. Relates to [[project_light_dark_both_first_class]].
