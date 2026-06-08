/**
 * OKLCH-based theme generation.
 *
 * Generates complete ThemeTokens from a minimal seed (2 colors + optional fonts),
 * deriving neutrals, semantic colors, and dark/light mode pairs.
 *
 * Colors can be passed as hex strings (e.g. '#4845FF') or OKLCH objects.
 * Hex-to-OKLCH conversion uses culori for accuracy.
 *
 * OKLCH is perceptually uniform — equal numeric changes produce equal
 * perceived visual differences, making it ideal for programmatic
 * palette generation.
 *
 * Phase 03.1 note (D-23, B4): `generateTheme` / `generateModePair` are retained
 * for backwards compatibility and test coverage, but the Synapsys preset uses
 * APPROACH B (hand-authored literal in `presets/synapsys.ts`). The derived
 * output here cannot reproduce the warm-graphite handoff ramp from cool-hue
 * inputs; consumers that need the handoff vocabulary should import
 * `SYNAPSYS_TOKENS` directly from the preset.
 */

import { parse, converter } from 'culori';
import type {
  BorderRadiusTokens,
  ColorRamp10,
  MotionTokens,
  ShadowTokens,
  SpacingTokens,
  ThemeTokens,
} from '../tokens/index.js';
import type { PartialThemeTokens } from './types.js';

const toOklch = converter('oklch');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OklchColor {
  /** Lightness: 0 (black) to 1 (white) */
  l: number;
  /** Chroma: 0 (gray) to ~0.4 (most vivid) */
  c: number;
  /** Hue: 0-360 degrees on the color wheel */
  h: number;
}

/** Color input: hex/rgb/hsl string or OKLCH object */
export type ColorInput = string | OklchColor;

export interface FontSeed {
  family: string;
  source?: 'google' | 'custom';
  weights?: number[];
}

/**
 * Theme seed (0.5.0 named-accent map shape).
 *
 * `accents.primary` is required — every theme has at least one decorative accent
 * (D-LOCAL-02). Optional `secondary`/`tertiary` slots are derived only when the
 * seed provides them. Optional `status` per-slot seeds derive a `{ fg, bg }`
 * pair; absent slots fall back to `DEFAULT_STATUS`.
 */
export interface ThemeSeed {
  primary: ColorInput;
  accents: {
    primary: ColorInput;
    secondary?: ColorInput;
    tertiary?: ColorInput;
  };
  status?: {
    success?: ColorInput;
    warning?: ColorInput;
    error?: ColorInput;
    info?: ColorInput;
  };
  fonts?: {
    sans?: FontSeed;
    mono?: FontSeed;
    display?: FontSeed;
  };
  /**
   * Optional non-color contract slots (0.6.0 front-doors). Each is threaded
   * `{ ...DEFAULT_X, ...seed.X }` in `generateTheme`, so an omitted slot — or an
   * omitted key within a slot — falls back to the Synapsys-neutral default. A
   * host expresses its own geometry / elevation / motion / scale here; no brand
   * value lives in any default (Standing Rule 4).
   */
  borderRadius?: Partial<BorderRadiusTokens>;
  /** Elevation ramp + optional signature `brand` glow (`--shadow-signal`). */
  shadows?: Partial<ShadowTokens>;
  /** Easing curves + duration ramp; merged per-key (easing and duration independently). */
  motion?: {
    easing?: Partial<MotionTokens['easing']>;
    duration?: Partial<MotionTokens['duration']>;
  };
  spacing?: Partial<SpacingTokens>;
  typography?: {
    scale?: Partial<ThemeTokens['typography']['scale']>;
    weights?: Partial<ThemeTokens['typography']['weights']>;
    tracking?: Partial<ThemeTokens['typography']['tracking']>;
  };
  /**
   * Which mode applies when `<html>` has no `data-theme` attribute.
   *
   * Consumed by the dev-only tokens codegen (`generateThemeCSS`) to decide
   * which mode's values land in the generated `:root { ... }` block. The
   * `[data-theme="light"]` and `[data-theme="dark"]` blocks always emit
   * regardless, so a theme library (e.g. `next-themes`) can flip between
   * modes via the attribute at runtime.
   *
   * Hosts that are explicitly light-first (e.g. brand identity says "we are
   * a light brand") should set `'light'`. Hosts that are dark-first or
   * don't have a strong stance leave it undefined (default `'dark'`,
   * matching the preset's element-default cascade).
   *
   * @default 'dark'
   */
  defaultMode?: 'dark' | 'light';
}

/**
 * Pre-0.5.0 seed shape (singular `accent`). Accepted via `ThemeSeedInput` for
 * back-compat; `normalizeThemeSeed` rewrites it into the new shape and emits a
 * single deprecation warning per unique seed (D-LOCAL-03).
 */
export interface LegacyThemeSeed {
  primary: ColorInput;
  accent: ColorInput;
  fonts?: {
    sans?: FontSeed;
    mono?: FontSeed;
    display?: FontSeed;
  };
}

/** Union accepted by `generateTheme` / `generateModePair`. */
export type ThemeSeedInput = ThemeSeed | LegacyThemeSeed;

/**
 * Module-level latch keyed by the legacy seed's content. First sighting of a
 * unique legacy seed emits exactly one `console.warn`; subsequent sightings
 * of the same key are silent.
 *
 * The key uses `JSON.stringify(input, Object.keys(input).sort())` so two
 * semantically-identical legacy seeds with different field-order construction
 * produce the same key (WR-01 fix). Nested `fonts` keys are NOT recursively
 * sorted — full canonicalization would require a recursive walker; the
 * top-level sort is enough for practical legacy-seed usage during the
 * deprecation window (D-LOCAL-03).
 */
const __legacySeedWarnSeen = new Set<string>();

/**
 * @internal Test-only: clear the warn-once latch between cases (WR-06 fix).
 *
 * Module-level state survives across vitest test cases in the same module
 * run; call this in `beforeEach` if a test reuses seed colors and asserts on
 * the warn-call count.
 */
export function __resetLegacySeedWarnLatchForTests(): void {
  __legacySeedWarnSeen.clear();
}

/** Type guard: input is the pre-0.5.0 legacy seed shape. */
function isLegacyThemeSeed(input: ThemeSeedInput): input is LegacyThemeSeed {
  return 'accent' in input && !('accents' in input);
}

/**
 * Normalize a `ThemeSeedInput` to the new `ThemeSeed` shape. Pre-0.5.0 seeds
 * have their singular `accent` mapped to `accents.primary`. Already-new seeds
 * are returned identity. Legacy seeds emit one `console.warn` per unique seed
 * (D-LOCAL-03).
 *
 * Defensive guards (WR-02 fix): non-object / null inputs and seeds missing
 * BOTH `accent` and `accents` throw a TypeError at the boundary with an
 * actionable message, instead of producing an opaque downstream crash inside
 * `generateTheme` when `normalized.accents.primary` is accessed.
 */
export function normalizeThemeSeed(input: ThemeSeedInput): ThemeSeed {
  if (input === null || typeof input !== 'object') {
    throw new TypeError(
      `[cve-design-system] normalizeThemeSeed: expected a ThemeSeed object, got ${input === null ? 'null' : typeof input}`
    );
  }
  if (!('accent' in input) && !('accents' in input)) {
    throw new TypeError(
      '[cve-design-system] normalizeThemeSeed: seed must define either `accent` (legacy) or `accents.primary` (0.5.0+)'
    );
  }
  if (!isLegacyThemeSeed(input)) {
    return input;
  }
  const key = JSON.stringify(input, Object.keys(input).sort());
  if (!__legacySeedWarnSeen.has(key)) {
    __legacySeedWarnSeen.add(key);
    console.warn(
      '[cve-design-system] ThemeSeed.accent is deprecated — use ThemeSeed.accents.primary. ' +
        'See @synapsys-integrated/cve-design-system CHANGELOG.md 0.5.0.'
    );
  }
  return {
    primary: input.primary,
    accents: { primary: input.accent },
    ...(input.fonts ? { fonts: input.fonts } : {}),
  };
}

export interface ThemeModePair {
  dark: PartialThemeTokens;
  light: PartialThemeTokens;
}

// ─── Color Conversion ────────────────────────────────────────────────────────

/**
 * Convert any CSS color string (hex, rgb, hsl, oklch) to an OklchColor object.
 * Uses culori for accurate perceptual color space conversion.
 */
export function colorToOklch(input: ColorInput): OklchColor {
  // Object-input branch: clamp + normalize channels. Pass-through is unsafe
  // because callers can hand us out-of-range values that break downstream
  // CSS emission (D-LOCAL-08). NaN on any channel collapses to 0.
  if (typeof input === 'object' && input !== null && 'l' in input) {
    const lRaw = input.l;
    const cRaw = input.c;
    const hRaw = input.h ?? 0;
    return {
      l: Number.isFinite(lRaw) ? clamp(lRaw, 0, 1) : 0,
      c: Number.isFinite(cRaw) ? clamp(cRaw, 0, 0.4) : 0,
      h: Number.isFinite(hRaw) ? ((hRaw % 360) + 360) % 360 : 0,
    };
  }

  const parsed = parse(input);
  if (!parsed) {
    throw new Error(`Invalid color string: "${input}"`);
  }
  const oklch = toOklch(parsed);
  return {
    l: oklch.l,
    c: oklch.c,
    h: oklch.h ?? 0,
  };
}

// ─── OKLCH Utilities ──────────────────────────────────────────────────────────

/** Clamp a number between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round to fixed decimal places */
function round(value: number, decimals: number = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Convert OklchColor to CSS oklch() string.
 *
 * Output is clamped (l ∈ [0,1], c ∈ [0,0.4], h ∈ [0,360)) and rounded to
 * 4 decimal places on l/c and 2 on h. Rounding stabilizes literal equality
 * for tests and bounds emitted-string length below MAX_VALUE_LENGTH (200).
 */
export function oklchToCSS(color: OklchColor): string {
  const l = round(clamp(color.l, 0, 1));
  const c = round(clamp(color.c, 0, 0.4));
  const h = round(((color.h % 360) + 360) % 360, 2);
  return `oklch(${l} ${c} ${h})`;
}

/**
 * Parse CSS oklch() string back to OklchColor. Throws on invalid input.
 *
 * Accepts both the three-channel form `oklch(l c h)` and the alpha-suffixed
 * form `oklch(l c h / α)` (emitted by `deriveStatusSlot.surface`). Alpha is
 * discarded — `OklchColor` has no alpha channel; consumers needing alpha
 * should keep the source string and parse it themselves.
 */
export function parseOklch(css: string): OklchColor {
  const match = css.match(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\s*\)$/
  );
  if (!match) {
    throw new Error(`Invalid oklch string: "${css}"`);
  }
  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);
  if (isNaN(l) || isNaN(c) || isNaN(h)) {
    throw new Error(`Invalid oklch values in: "${css}"`);
  }
  return {
    l: clamp(l, 0, 1),
    c: clamp(c, 0, 0.4),
    h: ((h % 360) + 360) % 360,
  };
}

/** Create a new OklchColor with partial adjustments applied */
export function adjustColor(
  color: OklchColor,
  adjustments: Partial<OklchColor>
): OklchColor {
  return {
    l: clamp(adjustments.l ?? color.l, 0, 1),
    c: clamp(adjustments.c ?? color.c, 0, 0.4),
    h: ((adjustments.h ?? color.h) % 360 + 360) % 360,
  };
}

// ─── Theme Generation ─────────────────────────────────────────────────────────

/**
 * Lightness values for the neutral scale (0 → 1000; 13 steps).
 * Derived from Synapsys brand guidelines via culori conversion.
 */
const NEUTRAL_LIGHTNESS = [
  1.00, // 0
  0.97, // 50
  0.93, // 100
  0.84, // 200
  0.74, // 300
  0.62, // 400
  0.48, // 500
  0.39, // 600
  0.31, // 700
  0.25, // 800
  0.13, // 900
  0.10, // 950
  0.05, // 1000
] as const;

/**
 * Chroma values for the neutral scale (bell-curve distribution).
 * Mid-range neutrals show subtle hue tinting; extremes are achromatic.
 * This matches natural color perception and the Synapsys brand pattern.
 */
const NEUTRAL_CHROMA = [
  0.000, // 0
  0.003, // 50
  0.004, // 100
  0.011, // 200
  0.019, // 300
  0.024, // 400
  0.034, // 500 - peak
  0.029, // 600
  0.018, // 700
  0.013, // 800
  0.005, // 900
  0.004, // 950
  0.002, // 1000
] as const;

const NEUTRAL_KEYS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000] as const;

/** Generate the neutral color scale from the primary hue */
function generateNeutrals(hue: number): ThemeTokens['colors']['neutrals'] {
  const neutrals = {} as Record<number, string>;
  for (let i = 0; i < NEUTRAL_KEYS.length; i++) {
    neutrals[NEUTRAL_KEYS[i]] = oklchToCSS({
      l: NEUTRAL_LIGHTNESS[i],
      c: NEUTRAL_CHROMA[i],
      h: hue,
    });
  }
  return neutrals as ThemeTokens['colors']['neutrals'];
}

/**
 * Generate neutrals for light mode.
 *
 * Pre-0.6.1 versions reversed the lightness + chroma arrays, which swapped
 * the numeric-key semantics in light mode — `lightNeutrals[50]` returned the
 * DARKEST value instead of the LIGHTEST. The call site at `generateModePair`
 * (`lightSemantic.bg.canvas = lightNeutrals[50]`, etc.) expected `[50]` to
 * mean "lightest" in both modes, so light-mode canvas ended up dark.
 *
 * Post-0.6.1: the scale runs in the same direction as `generateNeutrals` —
 * key 50 = lightest, key 950 = darkest, in BOTH modes. The function is
 * retained as a separate symbol to leave room for future divergence (e.g.
 * a light-mode-specific chroma curve), but the current implementation is
 * a pass-through to the same lightness/chroma arrays as `generateNeutrals`.
 */
function generateInvertedNeutrals(hue: number): ThemeTokens['colors']['neutrals'] {
  const neutrals = {} as Record<number, string>;
  for (let i = 0; i < NEUTRAL_KEYS.length; i++) {
    neutrals[NEUTRAL_KEYS[i]] = oklchToCSS({
      l: NEUTRAL_LIGHTNESS[i],
      c: NEUTRAL_CHROMA[i],
      h: hue,
    });
  }
  return neutrals as ThemeTokens['colors']['neutrals'];
}

/** Ramp step keys (shared by accent + status generators). */
const RAMP_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

/** Generate a 10-step accent ramp from an accent OKLCH base. */
function generateAccents(accent: OklchColor): ColorRamp10 {
  // Lightness keyframes matching the preset.css accent ramp.
  const L = [0.95, 0.89, 0.79, 0.68, 0.60, 0.53, 0.48, 0.41, 0.32, 0.23];
  const C = [0.023, 0.056, 0.109, 0.172, 0.219, accent.c, 0.249, 0.211, 0.158, 0.102];
  const out = {} as Record<number, string>;
  for (let i = 0; i < RAMP_KEYS.length; i++) {
    out[RAMP_KEYS[i]] = oklchToCSS({ l: L[i], c: C[i], h: accent.h });
  }
  return out as ColorRamp10;
}

/**
 * Generate a 10-step status ramp from a seed OKLCH base (0.5.0 / D-LOCAL-12).
 *
 * Status colors are typically less saturated than brand accents — the chroma
 * curve scales relative to the seed's own chroma (peak at the 500 step, fading
 * toward gray at the extremes). Lightness curve mirrors the accent ramp so the
 * visual hierarchy stays consistent across slots.
 */
function generateStatusRamp(seed: OklchColor): ColorRamp10 {
  const L = [0.95, 0.89, 0.79, 0.68, 0.60, 0.53, 0.45, 0.36, 0.27, 0.18];
  // Per-step chroma multiplier relative to the seed's chroma — peaks at the 500
  // step (1.0×), fades to 0.15× at the lightest step and 0.4× at the darkest.
  const C_SCALE = [0.15, 0.35, 0.6, 0.85, 1.0, 1.0, 0.95, 0.8, 0.6, 0.4];
  const out = {} as Record<number, string>;
  for (let i = 0; i < RAMP_KEYS.length; i++) {
    out[RAMP_KEYS[i]] = oklchToCSS({
      l: L[i],
      c: seed.c * C_SCALE[i],
      h: seed.h,
    });
  }
  return out as ColorRamp10;
}

/**
 * Derive the low-alpha `surface` overlay for a status slot from its seed
 * OKLCH base (D-LOCAL-10). Mid-lightness + clamped chroma + 12% alpha; used as
 * the banner/alert backdrop behind text rendered in the matching foreground.
 */
function deriveStatusSurface(seed: OklchColor): string {
  const surfaceL = 0.6;
  const surfaceC = Math.min(Math.max(seed.c, 0), 0.15);
  const surfaceH = ((seed.h % 360) + 360) % 360;
  return `oklch(${round(surfaceL)} ${round(surfaceC)} ${round(surfaceH, 2)} / 0.12)`;
}

/** Default typography scale (14-step pixel scale per handoff / D-13). */
const DEFAULT_TYPOGRAPHY_SCALE: ThemeTokens['typography']['scale'] = {
  micro: '12px',
  xs:    '13px',
  sm:    '14px',
  md:    '15px',
  base:  '16px',
  lg:    '18px',
  xl:    '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
  '6xl': '56px',
  '7xl': '64px',
  '8xl': '72px',
};

/** Default named weights (D-13 — merged under `ThemeSeed.typography.weights`). */
const DEFAULT_TYPOGRAPHY_WEIGHTS: ThemeTokens['typography']['weights'] = {
  regular: '400', medium: '500', semibold: '600', bold: '700',
};

/** Default tracking tokens (D-13 — merged under `ThemeSeed.typography.tracking`). */
const DEFAULT_TYPOGRAPHY_TRACKING: ThemeTokens['typography']['tracking'] = {
  tight: '-0.02em', normal: '0', wide: '0.04em',
};

/** Default spacing scale (numeric keys 0..13 — D-14, no multiplier). */
const DEFAULT_SPACING: ThemeTokens['spacing'] = {
  0:  '0',
  1:  '2px',
  2:  '4px',
  3:  '8px',
  4:  '12px',
  5:  '16px',
  6:  '20px',
  7:  '24px',
  8:  '32px',
  9:  '40px',
  10: '48px',
  11: '64px',
  12: '80px',
  13: '96px',
};

/** Default border radius scale (D-15 — no --radius-none; xs is the smallest). */
const DEFAULT_BORDER_RADIUS: ThemeTokens['borderRadius'] = {
  xs:   '4px',
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  '2xl': '20px',
  full: '9999px',
};

/**
 * Default shadow set (D-16 — restrained + glow pair).
 *
 * `brand` is the neutral default for the signature-elevation slot
 * (`--shadow-signal`) — a restrained achromatic glow, NOT a brand color
 * (Standing Rule 4). A host feeds its own accent-tinted signal via
 * `ThemeSeed.shadows.brand`; the violet `glowSm`/`glowMd` pair stays for
 * back-compat.
 */
const DEFAULT_SHADOWS: ThemeTokens['shadows'] = {
  xs:     '0 1px 0 rgba(0, 0, 0, 0.35)',
  sm:     '0 2px 6px rgba(0, 0, 0, 0.35)',
  md:     '0 6px 16px rgba(0, 0, 0, 0.40)',
  lg:     '0 14px 40px rgba(0, 0, 0, 0.50)',
  xl:     '0 24px 64px rgba(0, 0, 0, 0.60)',
  glowSm: '0 0 18px rgba(72, 69, 255, 0.35)',
  glowMd: '0 0 32px rgba(72, 69, 255, 0.42)',
  brand:  '0 0 24px rgba(0, 0, 0, 0.30)',
};

/** Default motion tokens (D-17 — handoff easing + duration scales). */
const DEFAULT_MOTION: ThemeTokens['motion'] = {
  easing: {
    standard: 'cubic-bezier(0.2,0,0,1)',
    entrance: 'cubic-bezier(0,0,0,1)',
    exit:     'cubic-bezier(0.4,0,1,1)',
    // Neutral emphasis default — a mild emphasized curve, NOT a brand punch
    // (Standing Rule 4). Host feeds its own sharp accent via motion.easing.emphasis.
    emphasis: 'cubic-bezier(0.4,0,0.2,1)',
  },
  duration: {
    instant: '80ms',
    fast:    '160ms',
    base:    '220ms',
    slow:    '400ms',
    slower:  '700ms',
  },
};

/**
 * Per-slot status anchor seeds (0.5.0 / D-LOCAL-10).
 *
 * Each anchor matches the pre-0.5.0 `500` step (handoff anchor color) — the
 * full 10-step ramp + `surface` slot is derived from these via
 * `generateStatusRamp()` and `deriveStatusSurface()`, producing identical
 * shape to a seeded slot. Unified CSS form across both paths
 * (oklch / oklch-with-alpha) — fixes WR-05 regex round-trip gap.
 */
const DEFAULT_STATUS_SEEDS: Record<
  keyof ThemeTokens['colors']['status'],
  OklchColor
> = {
  success: { l: 0.6959, c: 0.1491, h: 162.48 },
  warning: { l: 0.7686, c: 0.1647, h: 70.08 },
  error:   { l: 0.6368, c: 0.2078, h: 25.33 },
  info:    { l: 0.6231, c: 0.188,  h: 259.81 },
};

/**
 * Mode whose canvas the status foreground must read against. The `surface`
 * tint composites over the active canvas (near-black in dark, near-white in
 * light), so a single foreground cannot satisfy WCAG in both — `fg` is
 * derived per mode (D-LOCAL-13).
 */
export type StatusMode = 'dark' | 'light';

/**
 * Derive a WCAG-accessible per-slot status foreground from the slot's seed
 * (D-LOCAL-13). The foreground reads on the slot's `-surface` (the 12%-alpha
 * tint over the canvas) AND on the bare `--color-canvas`:
 *   - dark mode  → a lightened hue tint (≥ 4.5:1 vs surface, ≥ 3:1 vs canvas)
 *   - light mode → a darkened hue tint (same thresholds, inverted)
 * Chroma is clamped so the tint stays readable rather than vivid.
 */
function deriveStatusForeground(seed: OklchColor, mode: StatusMode): string {
  const l = mode === 'dark' ? 0.8 : 0.44;
  const c = mode === 'dark' ? Math.min(seed.c, 0.12) : Math.min(seed.c, 0.15);
  const h = ((seed.h % 360) + 360) % 360;
  return `oklch(${round(l)} ${round(c)} ${round(h, 2)})`;
}

/** Build a complete status slot (10-step ramp + surface + mode-aware fg) from an OKLCH seed. */
function buildStatusSlot(
  seed: OklchColor,
  mode: StatusMode = 'dark'
): ColorRamp10 & { surface: string; fg: string } {
  return {
    ...generateStatusRamp(seed),
    surface: deriveStatusSurface(seed),
    fg:      deriveStatusForeground(seed, mode),
  };
}

/** Defaults are derived from the anchor seeds on module load (deterministic, dark-first). */
const DEFAULT_STATUS: ThemeTokens['colors']['status'] = {
  success: buildStatusSlot(DEFAULT_STATUS_SEEDS.success),
  warning: buildStatusSlot(DEFAULT_STATUS_SEEDS.warning),
  error:   buildStatusSlot(DEFAULT_STATUS_SEEDS.error),
  info:    buildStatusSlot(DEFAULT_STATUS_SEEDS.info),
};

/** Light-mode defaults — same ramp/surface, light-readable foreground. */
const DEFAULT_STATUS_LIGHT: ThemeTokens['colors']['status'] = {
  success: buildStatusSlot(DEFAULT_STATUS_SEEDS.success, 'light'),
  warning: buildStatusSlot(DEFAULT_STATUS_SEEDS.warning, 'light'),
  error:   buildStatusSlot(DEFAULT_STATUS_SEEDS.error,   'light'),
  info:    buildStatusSlot(DEFAULT_STATUS_SEEDS.info,    'light'),
};

/**
 * Derive an alpha-overlay CSS value from the primary accent's 500-step
 * (WR-04 fix). Used for `bg.surfaceAccent` and `selection.fill` so a host
 * seeding a non-violet accent gets a hue-matched surface, not a hardcoded
 * Synapsys violet. The 500-step is already an `oklch(l c h)` string; we
 * parse it and re-emit with the alpha suffix.
 */
function deriveAccentOverlay(accentStep500: string, alpha: number): string {
  const ok = parseOklch(accentStep500);
  return `oklch(${round(ok.l)} ${round(ok.c)} ${round(ok.h, 2)} / ${alpha})`;
}

/**
 * Build a semantic surface ladder from neutrals + the primary accent ramp.
 *
 * Receives `accents.primary` (a `ColorRamp10`) rather than the whole accents
 * map — secondary/tertiary slots do not feed semantic-tier defaults.
 */
function buildSemanticColors(
  neutrals: ThemeTokens['colors']['neutrals'],
  accents: ColorRamp10
): Pick<
  ThemeTokens['colors'],
  'bg' | 'text' | 'icon' | 'border' | 'action' | 'focus' | 'selection'
> {
  return {
    bg: {
      canvas:           neutrals[950],
      surface:          neutrals[800],
      surfaceRaised:    neutrals[800],
      surfaceElevated:  neutrals[700],
      dialog:           neutrals[800],
      surfaceInset:     neutrals[900],
      surfaceAccent:    deriveAccentOverlay(accents[500], 0.08),
      overlay:          'rgba(7, 7, 8, 0.72)',
    },
    text: {
      primary:   neutrals[50],
      secondary: neutrals[300],
      tertiary:  neutrals[400],
      disabled:  neutrals[600],
      inverse:   neutrals[950],
      accent:    accents[300],
    },
    icon: {
      primary:   neutrals[50],
      secondary: neutrals[300],
      disabled:  neutrals[600],
      inverse:   neutrals[950],
    },
    border: {
      subtle:  'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.10)',
      strong:  'rgba(255, 255, 255, 0.18)',
      accent:  accents[500],
    },
    action: {
      primary: {
        bg:       accents[500],
        bgHover:  accents[400],
        bgActive: accents[600],
        text:     '#ffffff',
      },
      secondary: {
        bg:       neutrals[800],
        bgHover:  neutrals[700],
        border:   'rgba(255, 255, 255, 0.10)',
      },
    },
    focus:     { ring: accents[400], ringOffset: neutrals[950] },
    selection: { fill: deriveAccentOverlay(accents[500], 0.18), outline: accents[500] },
  };
}

/**
 * Derive a complete per-slot status object (10-step ramp + surface + fg) from a
 * seed color (D-LOCAL-10). Mirrors the accent ramp shape, then overlays a
 * `surface` low-alpha backdrop and a mode-aware accessible `fg`.
 */
function deriveStatusSlot(
  seed: ColorInput,
  mode: StatusMode = 'dark'
): ColorRamp10 & { surface: string; fg: string } {
  return buildStatusSlot(colorToOklch(seed), mode);
}

/** Resolve per-slot status from optional seed entries, falling back to defaults. */
function buildStatusColors(
  seedStatus: ThemeSeed['status'],
  mode: StatusMode = 'dark'
): ThemeTokens['colors']['status'] {
  const defaults = mode === 'light' ? DEFAULT_STATUS_LIGHT : DEFAULT_STATUS;
  return {
    success: seedStatus?.success !== undefined ? deriveStatusSlot(seedStatus.success, mode) : defaults.success,
    warning: seedStatus?.warning !== undefined ? deriveStatusSlot(seedStatus.warning, mode) : defaults.warning,
    error:   seedStatus?.error   !== undefined ? deriveStatusSlot(seedStatus.error,   mode) : defaults.error,
    info:    seedStatus?.info    !== undefined ? deriveStatusSlot(seedStatus.info,    mode) : defaults.info,
  };
}

/**
 * Generate a complete ThemeTokens object from a minimal seed.
 *
 * The seed provides primary + named-accent OKLCH colors; the function derives
 * all other colors (neutrals, primary/secondary/tertiary accent ramps, status
 * slots, semantic slots), typography, spacing, and border radius.
 *
 * Phase 03.1 note: `generateTheme` produces a dark-first ThemeTokens shaped
 * to the expanded vocabulary but CANNOT reproduce the warm-graphite handoff
 * ramp from a cool-hue seed. The synapsys preset uses APPROACH B (hand-
 * authored literal) instead — see `presets/synapsys.ts`.
 *
 * Phase 0.5.0 expands the seed contract to the named-accent map; legacy
 * `{ accent }` seeds are accepted via `ThemeSeedInput` and emit a single
 * deprecation warning via `normalizeThemeSeed`.
 */
export function generateTheme(seed: ThemeSeedInput): ThemeTokens {
  const normalized = normalizeThemeSeed(seed);
  const primary = colorToOklch(normalized.primary);
  const primaryAccent = colorToOklch(normalized.accents.primary);
  const { fonts } = normalized;

  const neutrals = generateNeutrals(primary.h);
  const primaryRamp = generateAccents(primaryAccent);
  const secondaryRamp = normalized.accents.secondary !== undefined
    ? generateAccents(colorToOklch(normalized.accents.secondary))
    : undefined;
  const tertiaryRamp = normalized.accents.tertiary !== undefined
    ? generateAccents(colorToOklch(normalized.accents.tertiary))
    : undefined;

  const accents: ThemeTokens['colors']['accents'] = {
    primary: primaryRamp,
    ...(secondaryRamp !== undefined ? { secondary: secondaryRamp } : {}),
    ...(tertiaryRamp !== undefined ? { tertiary: tertiaryRamp } : {}),
  };

  const colors: ThemeTokens['colors'] = {
    neutrals,
    accents,
    status: buildStatusColors(normalized.status),
    ...buildSemanticColors(neutrals, primaryRamp),
  };

  const typography: ThemeTokens['typography'] = {
    fonts: {
      sans: {
        family: fonts?.sans?.family ?? 'Inter',
        source: fonts?.sans?.source ?? 'google',
        // The preset ships Inter as a variable font exposing the 'opsz' axis;
        // seeds that provide explicit weights get them echoed on the literal.
        ...(fonts?.sans?.weights
          ? { weights: fonts.sans.weights }
          : { axes: ['opsz'] }),
      },
      mono: {
        family: fonts?.mono?.family ?? 'JetBrains Mono',
        source: fonts?.mono?.source ?? 'google',
        weights: fonts?.mono?.weights ?? [400, 500, 600, 700],
      },
      display: fonts?.display
        ? { family: fonts.display.family, source: fonts.display.source ?? 'google' }
        : { family: fonts?.sans?.family ?? 'Inter', source: 'google' },
    },
    scale:       { ...DEFAULT_TYPOGRAPHY_SCALE, ...normalized.typography?.scale },
    weights:     { ...DEFAULT_TYPOGRAPHY_WEIGHTS, ...normalized.typography?.weights },
    lineHeights: { compact: '1.25', default: '1.5', relaxed: '1.65', display: '1.1' },
    tracking:    { ...DEFAULT_TYPOGRAPHY_TRACKING, ...normalized.typography?.tracking },
  };

  return {
    colors,
    typography,
    spacing:      { ...DEFAULT_SPACING, ...normalized.spacing },
    borderRadius: { ...DEFAULT_BORDER_RADIUS, ...normalized.borderRadius },
    shadows:      { ...DEFAULT_SHADOWS, ...normalized.shadows },
    motion: {
      easing:   { ...DEFAULT_MOTION.easing,   ...normalized.motion?.easing },
      duration: { ...DEFAULT_MOTION.duration, ...normalized.motion?.duration },
    },
  };
}

// ─── Mode Pair Generation ─────────────────────────────────────────────────────

/**
 * Generate dark and light mode color overrides from a theme seed.
 *
 * The dark mode uses the seed values directly (Synapsys is dark-first).
 * The light mode inverts the neutral scale and adjusts semantic colors
 * for better contrast on light backgrounds.
 */
export function generateModePair(seed: ThemeSeedInput): ThemeModePair {
  const normalized = normalizeThemeSeed(seed);
  const primary = colorToOklch(normalized.primary);
  const primaryAccent = colorToOklch(normalized.accents.primary);
  const secondaryAccent = normalized.accents.secondary !== undefined
    ? colorToOklch(normalized.accents.secondary)
    : undefined;
  const tertiaryAccent = normalized.accents.tertiary !== undefined
    ? colorToOklch(normalized.accents.tertiary)
    : undefined;

  // Dark mode — seed values feed the ramps directly.
  const darkNeutrals = generateNeutrals(primary.h);
  const darkPrimaryRamp = generateAccents(primaryAccent);
  const darkSecondaryRamp = secondaryAccent !== undefined ? generateAccents(secondaryAccent) : undefined;
  const darkTertiaryRamp = tertiaryAccent !== undefined ? generateAccents(tertiaryAccent) : undefined;
  const darkAccents: ThemeTokens['colors']['accents'] = {
    primary: darkPrimaryRamp,
    ...(darkSecondaryRamp !== undefined ? { secondary: darkSecondaryRamp } : {}),
    ...(darkTertiaryRamp !== undefined ? { tertiary: darkTertiaryRamp } : {}),
  };
  const darkSemantic = buildSemanticColors(darkNeutrals, darkPrimaryRamp);

  // Light mode — same +0.05 lightness / -0.03 chroma offset for every named accent.
  const lightNeutrals = generateInvertedNeutrals(primary.h);
  const liftAccent = (c: OklchColor): OklchColor =>
    adjustColor(c, { l: c.l + 0.05, c: Math.max(0, c.c - 0.03) });
  const lightPrimaryRamp = generateAccents(liftAccent(primaryAccent));
  const lightSecondaryRamp = secondaryAccent !== undefined
    ? generateAccents(liftAccent(secondaryAccent))
    : undefined;
  const lightTertiaryRamp = tertiaryAccent !== undefined
    ? generateAccents(liftAccent(tertiaryAccent))
    : undefined;
  const lightAccents: ThemeTokens['colors']['accents'] = {
    primary: lightPrimaryRamp,
    ...(lightSecondaryRamp !== undefined ? { secondary: lightSecondaryRamp } : {}),
    ...(lightTertiaryRamp !== undefined ? { tertiary: lightTertiaryRamp } : {}),
  };
  const lightSemantic = buildSemanticColors(lightNeutrals, lightPrimaryRamp);
  // Light-mode surface ladder inverts the scale picks from buildSemanticColors
  // (which always returns dark-mode references — neutrals[800] for surface,
  // neutrals[700] for elevated, etc.). Without these overrides the entire
  // surface ladder stays dark in light mode and cards/dialogs render as dark
  // patches on a light canvas (Phase 21 P-15-H).
  lightSemantic.bg.canvas =          lightNeutrals[50];
  lightSemantic.bg.surface =         lightNeutrals[0];
  lightSemantic.bg.surfaceRaised =   lightNeutrals[0];
  lightSemantic.bg.surfaceElevated = lightNeutrals[100];
  lightSemantic.bg.dialog =          lightNeutrals[0];
  lightSemantic.bg.surfaceInset =    lightNeutrals[100];
  // Text + icon inversions — light mode wants dark text/icons on light bg.
  lightSemantic.text.primary =   lightNeutrals[950];
  lightSemantic.text.secondary = lightNeutrals[700];
  lightSemantic.text.tertiary =  lightNeutrals[500];
  lightSemantic.text.disabled =  lightNeutrals[300];
  lightSemantic.text.inverse =   lightNeutrals[50];
  lightSemantic.icon.primary =   lightNeutrals[950];
  lightSemantic.icon.secondary = lightNeutrals[700];
  lightSemantic.icon.disabled =  lightNeutrals[300];
  lightSemantic.icon.inverse =   lightNeutrals[50];
  // Border inversions — light mode borders are darkish at low alpha.
  lightSemantic.border.subtle =  'rgba(7, 7, 8, 0.06)';
  lightSemantic.border.default = 'rgba(7, 7, 8, 0.10)';
  lightSemantic.border.strong =  'rgba(7, 7, 8, 0.18)';

  // Status ramps + surface are mode-independent; only the accessible `fg`
  // differs per mode (it reads against the active canvas — D-LOCAL-13).
  const darkStatus = buildStatusColors(normalized.status, 'dark');
  const lightStatus = buildStatusColors(normalized.status, 'light');

  const dark: PartialThemeTokens = {
    colors: {
      neutrals: darkNeutrals,
      accents: darkAccents,
      status: darkStatus,
      ...darkSemantic,
    },
  };

  const light: PartialThemeTokens = {
    colors: {
      neutrals: lightNeutrals,
      accents: lightAccents,
      status: lightStatus,
      ...lightSemantic,
    },
  };

  return { dark, light };
}
