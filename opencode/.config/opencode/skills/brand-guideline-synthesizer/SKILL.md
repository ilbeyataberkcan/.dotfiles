---
name: brand-guideline-synthesizer
description: Convert evidence and Brand DNA into enforceable guideline and token-ready outputs with accessibility gates.
license: CC-BY-4.0
compatibility: opencode
metadata:
  audience: design-system-engineers
  domain: synthesis
---

## What I do
- Synthesize brand evidence and Brand DNA into concrete design guidelines.
- Produce token-aware decisions compatible with implementation workflows.
- Enforce accessibility and brand compliance before approval.
- Preserve traceability so every hard guideline maps to approved user inputs.

## Inputs (priority order)
1. Approved decision ledger (`approved_by_answer` or `approved_by_gate`).
2. Project-local brand documents and token files.
3. Normalized evidence bundle with source authority and confidence.
4. Brand DNA interview output.
5. Existing frontend constraints (Next.js/React/Tailwind/Radix and CVE contract if used).

## Synthesis workflow
1. Build constraint snapshot (hard vs soft constraints).
2. Define visual system intent (color, type, shape, spacing, motion).
3. Generate enforceable do/don't rules.
4. Run color accessibility checks (WCAG hard gate, APCA advisory).
5. Run layout and brand consistency checks.
6. Verify non-canonical sources did not become hard constraints.
7. Return final disposition and remediation steps.

## Required outputs
1. `Guideline package`
2. `Design token direction`
3. `Compliance matrix`
4. `Conflict report`
5. `Go/no-go disposition`

## Safety and quality rules
- If WCAG required gates fail, block approval.
- If brand hard constraints conflict with safety or accessibility, provide compliant alternatives.
- Keep decisions traceable to evidence sources or explicit interview statements.
- In guided mode, never create mission/promise/voice facts that were not explicitly provided or approved.
