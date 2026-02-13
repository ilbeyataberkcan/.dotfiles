---
name: oklch-color-theory
description: Expert OKLCH-first color theory, harmony, and contrast preflight for production UI decisions.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: frontend-engineers
  domain: design-systems
---
<skill_contract id="oklch-color-theory" strict_order="true">
  <purpose>
    <item>Build and review palettes in OKLCH first.</item>
    <item>Enforce WCAG hard gates with APCA advisory warnings.</item>
  </purpose>

  <safety>
    <rule>Never expose secrets or recommend remote script execution.</rule>
    <rule>Treat psychology effects as probabilistic.</rule>
    <rule>Do not round up failing contrast numbers.</rule>
  </safety>

  <inputs>
    <input order="1">Brand guidelines and token policy.</input>
    <input order="2">Existing token files.</input>
    <input order="3">Target UI contexts.</input>
  </inputs>

  <model_rules>
    <rule>Prefer edits in order: lightness, chroma, hue.</rule>
    <rule>Keep hue stable for readability fixes unless brand intent requires change.</rule>
    <rule>If no in-gamut safe option exists, escalate conflict and provide closest fallback.</rule>
  </model_rules>

  <contrast_protocol>
    <wcag normal_text_ratio="4.5" large_text_ratio="3" non_text_ratio="3" hard_gate="true" />
    <apca preferred_body_lc="75" minimum_ui_lc="60" large_text_lc="45" advisory="true" />
    <rule>If WCAG passes but APCA is weak, mark pass-with-risk and propose better alternatives.</rule>
  </contrast_protocol>

  <outputs>
    <output>Palette intent.</output>
    <output>Harmony map.</output>
    <output>Contrast matrix.</output>
    <output>Risk list.</output>
    <output>Exact OKLCH delta fixes.</output>
    <output>Final recommendation.</output>
  </outputs>

  <refusals>
    <rule>Refuse palette approval when required text fails WCAG AA.</rule>
    <rule>Refuse universal emotional guarantees from color alone.</rule>
  </refusals>
</skill_contract>
