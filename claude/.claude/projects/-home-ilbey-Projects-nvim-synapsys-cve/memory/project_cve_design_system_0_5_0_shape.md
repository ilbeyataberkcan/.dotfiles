---
name: project-cve-design-system-0-5-0-shape
description: cve-design-system 0.5.0 ThemeSeed / ColorTokens / Tailwind utility surface — Revised Option C′ landed
metadata: 
  node_type: memory
  type: project
  originSessionId: e8e5c5ea-4f72-451d-9329-bfbbf532024a
---

cve-design-system 0.5.0 (shipped 2026-05-15, merged in main as `26b8aaf`, not yet published to GHP at memory write time) replaces the singular-accent surface with a named-accent map and replaces flat status `{fg, bg}` pairs with 10-step status ramps + a low-alpha `surface` overlay per slot.

**`ThemeSeed` shape:**

```ts
interface ThemeSeed {
  primary: ColorInput;
  accents: {
    primary: ColorInput;                  // required
    secondary?: ColorInput;
    tertiary?: ColorInput;
  };
  status?: {                              // optional per-slot brand-aligned overrides
    success?: ColorInput;
    warning?: ColorInput;
    error?: ColorInput;
    info?: ColorInput;
  };
  fonts?: { sans?: FontSeed; mono?: FontSeed; display?: FontSeed };
}
```

`ColorInput = string | OklchColor`. Hex/rgb/hsl strings flow through culori for conversion; the result is clamped (`l ∈ [0,1]`, `c ∈ [0,0.4]`, `h` normalized).

**`ColorTokens.status` shape:**

```ts
type ColorRamp10 = { 50: string; 100: string; …; 900: string };

interface ColorTokens['status'] {
  success: ColorRamp10 & { surface: string };  // 10-step ramp + low-alpha overlay
  warning: ColorRamp10 & { surface: string };
  error:   ColorRamp10 & { surface: string };
  info:    ColorRamp10 & { surface: string };
}
```

Status surface derivation: `oklch(0.6 c h / 0.12)` where `c` is clamped to `[0, 0.15]` for backdrop readability.

**Tailwind utility classes emitted by `preset.css`:**

| Family | Bare | Numbered | Surface |
|---|---|---|---|
| accent | `bg-accent-primary` | `bg-accent-primary-{50..900}` | — |
| accent secondary/tertiary | commented out by default; host opt-in via `<ThemeInjector>` | — | — |
| status success/warning/error/info | `bg-status-success` (= -500) | `bg-status-success-{50..900}` | `bg-status-success-surface` |

Plus parallel `text-*`, `ring-*`, `border-*`, `from-*`, `to-*`, etc. for every directional prefix.

**Back-compat — `LegacyThemeSeed` shape (slated for removal in 0.6.0):**

```ts
interface LegacyThemeSeed {
  primary: ColorInput;
  accent: ColorInput;                     // singular
  fonts?: { … };
}

type ThemeSeedInput = ThemeSeed | LegacyThemeSeed;
```

`normalizeThemeSeed()` accepts either, rewrites legacy to new, emits one `console.warn` per unique seed (canonical-keyed Set latch). Defensive guards reject null/undefined/non-object inputs at the boundary.

**Generator helpers (in `packages/design-system/src/theme/oklch.ts`):**

- `generateAccents(seed: OklchColor): ColorRamp10` — 10-step ramp from a seed, lightness curve `[0.95..0.23]`, chroma curve peaks at seed.c at the 500 step.
- `generateStatusRamp(seed: OklchColor): ColorRamp10` — status-tuned variant (chroma scales relative to seed, lighter at 50, darker at 900).
- `deriveStatusSurface(seed: OklchColor): string` — alpha overlay emission.
- `buildStatusSlot(seed: OklchColor): ColorRamp10 & { surface }` — composes the two.
- `colorToOklch(input: ColorInput): OklchColor` — culori-backed, ΔE ≈ 0.01 round-trip on hex inputs.
- `oklchToCSS(color: OklchColor): string` — emits `oklch(l c h)` with l/c rounded to 4 decimals, h to 2.
- `parseOklch(css: string): OklchColor` — accepts BOTH `oklch(l c h)` AND `oklch(l c h / α)` (alpha discarded — OklchColor has no alpha channel).

**Hardcoded defaults retained for status:**

`DEFAULT_STATUS_SEEDS` in `oklch.ts` carries the anchor `(l, c, h)` tuples for each slot (success: green oklch(0.6959 0.1491 162.48), warning: amber oklch(0.7686 0.1647 70.08), error: red oklch(0.6368 0.2078 25.33), info: blue oklch(0.6231 0.188 259.81)). `DEFAULT_STATUS` is computed at module load via `buildStatusSlot(DEFAULT_STATUS_SEEDS[slot])` — deterministic, shape-identical to a seeded slot.

**Semantic-tier derivation (WR-04 fix):**

`bg.surfaceAccent` and `selection.fill` are derived at runtime via `deriveAccentOverlay(accents[500], alpha)` so a host seeding non-violet primary gets a hue-matched surface. `preset.css` keeps the literal rgba (Synapsys static default; runtime ThemeInjector overrides it).

**Test isolation hook:**

`__resetLegacySeedWarnLatchForTests()` is exported `@internal` for vitest test isolation — call in `beforeEach` to drain the warn-once latch.

**Where to look:**

- Types + helpers: `packages/design-system/src/theme/oklch.ts`
- Token types: `packages/design-system/src/tokens/index.ts`
- CSS variable surface: `packages/design-system/src/preset.css`
- Synapsys-anchored preset: `packages/design-system/src/theme/presets/synapsys.ts` (hand-authored Approach B literal)
- CHANGELOG: `packages/design-system/CHANGELOG.md` § 0.5.0 (full migration guide for external consumers)
