---
name: feedback_design_tokens_no_hardcoded
description: Build UI with design-system tokens + standard Tailwind utilities only — no hardcoded inline styles/hex/raw var()/arbitrary values unless a genuine advanced need
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 117c7a18-eb97-4723-9e60-205fa52ecdce
---

For all tmmaf UI work, use **design-system tokens + standard Tailwind utility classes only**. Do NOT use hardcoded inline `style={{}}`, raw hex, raw `var(--…)`, or arbitrary `[…]` values when a token or standard class exists. Only reach for a hardcoded value for a genuine advanced use case that the token system can't express.

**Why:** maintainability + automatic light/dark theme consistency (the tokens rebind per `[data-theme]`). Hardcoded values silently break theming and drift from the design system.

**How to apply:** the host token sheet is `app/theme.generated.css` (generated from `lib/theme-seed.ts`; regenerate via `bun run tokens:generate`). It already carries the TMMAF design values, so standard Tailwind utilities map 1:1:
- radius: `--radius-xs:2 sm:4 md:6 lg:10 xl:14 full:9999` → `rounded-sm/md/lg/full`
- fonts: `font-display`=Barlow Condensed, `font-sans`=Barlow, `font-mono`=JetBrains Mono
- type sizes: `--text-xl:28px 2xl:36px` etc. → `text-xl/2xl`; `tracking-wide`=0.10em
- color: `text-text-primary|secondary|tertiary|disabled|inverse`, `bg-surface|surface-inset|canvas`, `border-border-subtle|default|strong`, `accent-primary`, `status-{success|error|warning|info}-{surface|fg}`
- in-repo reference for the intended heading recipe: `app/flows/registration/status/page.tsx` (`font-display font-black uppercase tracking-[0.01em] text-text-primary`).

Relates to [[feedback_host_custom_css_allowed]] (custom CSS only when Tailwind truly can't express the design) and [[feedback_preview_html_is_element_ground_truth]]. Applies to the catalog admin UI fidelity pass and all future UI.
