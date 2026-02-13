---
name: nextjs-react-tailwind-radix
description: Production patterns for Next.js 16, React, Tailwind v4 tokens, and Radix or shadcn composition.
license: MIT
compatibility: opencode
metadata:
  audience: frontend-engineers
  domain: implementation
---
<skill_contract id="nextjs-react-tailwind-radix">
  <purpose>
    <item>Provide implementation guidance for Next.js, React, Tailwind tokens, and Radix composition.</item>
    <item>Keep UI implementation secure, accessible, and token-driven.</item>
  </purpose>

  <security>
    <rule>Validate untrusted input at boundaries.</rule>
    <rule>Avoid unsafe html injection patterns.</rule>
    <rule>Keep server-only values out of client components.</rule>
  </security>

  <defaults>
    <rule>Prefer server components and add client boundaries only when required.</rule>
    <rule>Use predictable state flow and controlled component APIs.</rule>
    <rule>Use tokenized theme variables instead of ad hoc literals.</rule>
    <rule>Preserve semantic roles, keyboard behavior, and focus management.</rule>
  </defaults>

  <design_system_integration>
    <rule>Prefer semantic tokens over direct color literals.</rule>
    <rule>Use OKLCH-capable token values for new color decisions.</rule>
    <rule>Align spacing, radius, and typography scales with project tokens.</rule>
  </design_system_integration>

  <outputs>
    <output>Architecture choice.</output>
    <output>Component and token strategy.</output>
    <output>Accessibility checks.</output>
    <output>Risk notes.</output>
    <output>Implementation steps.</output>
  </outputs>
</skill_contract>
