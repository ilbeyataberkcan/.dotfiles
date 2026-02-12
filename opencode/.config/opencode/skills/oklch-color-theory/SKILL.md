---
name: oklch-color-theory
description: Expert OKLCH-first color theory, harmony, and contrast preflight for production UI decisions.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: frontend-engineers
  domain: design-systems
---

## What I do
- Build and review palettes using OKLCH first, not hex-first.
- Evaluate harmony systems (analogous, complementary, split-complementary, triadic, tetradic, monochromatic).
- Detect readability risk before dev server using WCAG AA pass-fail and APCA warning bands.
- Propose token-safe corrections that preserve brand intent and improve accessibility.

## Safety and integrity rules
- Never suggest `curl|bash` or equivalent remote-script execution.
- Never expose secrets, tokens, API keys, or environment values.
- Treat psychological claims as probabilistic, not deterministic.
- Treat APCA as advisory and WCAG thresholds as required minimum unless project policy says otherwise.
- Do not round up failing contrast numbers. `4.49` is fail for a `4.5` threshold.

## Required input order
1. Project brand guidelines and token policy.
2. Existing token files (`@theme`, CSS variables, Tailwind v4 tokens, design system presets).
3. Target UI contexts (body text, headings, controls, borders, charts, status states).

## Color model decisions
- Prefer edits in this order: lightness (`L`) -> chroma (`C`) -> hue (`h`).
- Keep hue stable when fixing readability unless brand intent requires hue change.
- Reduce chroma before hue shifts when in-gamut conversion causes clipping.
- If no valid in-gamut color satisfies requirements, escalate as a design conflict and provide closest safe fallback.

## Harmony rules (OKLCH hue angles)
- Analogous: base `h`, `h-30`, `h+30`.
- Complementary: base `h`, `h+180`.
- Split-complementary: base `h`, `h+150`, `h+210`.
- Triadic: base `h`, `h+120`, `h+240`.
- Tetradic (rectangle): base `h`, `h+60`, `h+180`, `h+240`.
- Monochromatic: keep `h` stable; vary `L` and controlled `C`.

## Contrast preflight protocol
- Required checks:
  - Text: WCAG AA (`4.5:1` normal, `3:1` large).
  - Non-text UI boundaries/icons: `3:1` where applicable.
  - APCA warning bands for readability quality:
    - Preferred body reading: about `Lc >= 75`.
    - Minimum practical UI text: about `Lc >= 60`.
    - Large display text: about `Lc >= 45`.
- If WCAG passes but APCA is weak, mark as `pass-with-risk` and propose better alternatives.
- Evaluate both dark-on-light and light-on-dark where mode toggling exists.

## Output format
Produce all decisions as:
1. `Palette intent`: one paragraph.
2. `Harmony map`: base hue family and secondary families.
3. `Contrast matrix`: token-pair table with WCAG pass/fail and APCA status.
4. `Risk list`: high/medium/low findings.
5. `Fixes`: exact OKLCH deltas (for example `L +0.07`, `C -0.02`, `h +12`).
6. `Final recommendation`: chosen tradeoff and why.

## When to refuse
- Refuse to approve a palette when required UI text fails WCAG AA.
- Refuse to claim guaranteed emotional response from color alone.
- Refuse proposals that break declared brand hard constraints unless explicitly authorized.
