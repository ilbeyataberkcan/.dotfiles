/**
 * Theme utilities: CSS variable generation, theme creation, and merging.
 *
 * generateCSSVariables produces a flat Record<string, string> suitable for
 * React's style prop. Only explicitly-set tokens emit variables — undefined
 * values are skipped, allowing CSS inheritance from parent scopes.
 *
 * Phase 03.1 (D-24) — expanded in 0.5.0: the emitter mirrors the full
 * three-tier vocabulary declared in tokens/index.ts (named-accent map,
 * per-slot status fg/bg). CSS custom-property names align with the
 * names declared in preset.css (same Tailwind v4 namespace); an override
 * supplied via <ThemeInjector> therefore rebinds the preset's default.
 */

import { ThemeTokensSchema } from './schemas.js';
import type { PartialThemeTokens } from './types.js';
import type { SpacingTokens, ThemeTokens } from '../tokens/index.js';

/**
 * Runtime regex validators matching the Zod schemas.
 * Used as a final safety net in generateCSSVariables.
 */
const CSS_COLOR_REGEX =
  /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[\d.%,\s/]+\)|hsla?\(\s*[\d.%,\s/deg]+\)|oklch\(\s*[\d.%,\s/]+\)|[a-zA-Z]+)$/;
const CSS_LENGTH_REGEX = /^(0|[\d.]+(rem|px|em|%|vw|vh|svh|dvh))$/;
const CSS_DURATION_REGEX = /^\d+(ms|s)$/;
const FONT_FAMILY_REGEX = /^[a-zA-Z0-9\s'",-]+$/;

const MAX_VALUE_LENGTH = 200;

type TokenType = 'color' | 'length' | 'font' | 'shadow' | 'duration';

function isValidCSSValue(value: string, type: TokenType): boolean {
  if (value.length > MAX_VALUE_LENGTH) return false;
  if (value.length === 0) return false;
  switch (type) {
    case 'color':
      return CSS_COLOR_REGEX.test(value);
    case 'length':
      return CSS_LENGTH_REGEX.test(value);
    case 'font':
      return FONT_FAMILY_REGEX.test(value);
    case 'duration':
      return CSS_DURATION_REGEX.test(value);
    case 'shadow':
      // Permissive: the shadow/easing grammar is too baroque for a tight regex.
      // Length + non-empty is the practical guard. Final defense is the Zod
      // schema on upstream inputs.
      return true;
  }
}

/**
 * Generates a flat CSS variable map from partial theme tokens.
 *
 * Only tokens that are explicitly set produce output. Undefined tokens
 * are omitted, allowing CSS variable inheritance from ancestor scopes.
 * Invalid values are silently dropped for security.
 */
export function generateCSSVariables(
  tokens: PartialThemeTokens
): Record<string, string> {
  const vars: Record<string, string> = {};

  function set(name: string, value: string | undefined, type: TokenType): void {
    if (value === undefined) return;
    if (!isValidCSSValue(value, type)) return;
    vars[name] = value;
  }

  // ── Colors ──────────────────────────────────────────────────────────────
  if (tokens.colors) {
    const c = tokens.colors;

    // Primitives: neutrals (13 steps)
    if (c.neutrals) {
      const n = c.neutrals;
      set('--color-neutral-0',    n[0],    'color');
      set('--color-neutral-50',   n[50],   'color');
      set('--color-neutral-100',  n[100],  'color');
      set('--color-neutral-200',  n[200],  'color');
      set('--color-neutral-300',  n[300],  'color');
      set('--color-neutral-400',  n[400],  'color');
      set('--color-neutral-500',  n[500],  'color');
      set('--color-neutral-600',  n[600],  'color');
      set('--color-neutral-700',  n[700],  'color');
      set('--color-neutral-800',  n[800],  'color');
      set('--color-neutral-900',  n[900],  'color');
      set('--color-neutral-950',  n[950],  'color');
      set('--color-neutral-1000', n[1000], 'color');
    }

    // Primitives: named-accent map (primary required; secondary/tertiary opt-in)
    if (c.accents) {
      const a = c.accents;
      (['primary', 'secondary', 'tertiary'] as const).forEach((slot) => {
        const ramp = a[slot];
        if (!ramp) return;
        set(`--color-accent-${slot}-50`,  ramp[50],  'color');
        set(`--color-accent-${slot}-100`, ramp[100], 'color');
        set(`--color-accent-${slot}-200`, ramp[200], 'color');
        set(`--color-accent-${slot}-300`, ramp[300], 'color');
        set(`--color-accent-${slot}-400`, ramp[400], 'color');
        set(`--color-accent-${slot}-500`, ramp[500], 'color');
        set(`--color-accent-${slot}-600`, ramp[600], 'color');
        set(`--color-accent-${slot}-700`, ramp[700], 'color');
        set(`--color-accent-${slot}-800`, ramp[800], 'color');
        set(`--color-accent-${slot}-900`, ramp[900], 'color');
      });
    }

    // Primitives: per-slot status ramps (10-step + surface + bare alias).
    // Mirrors the named-accent emission so utility classes `bg-status-success`,
    // `bg-status-success-{N}`, `bg-status-success-surface` all resolve.
    if (c.status) {
      (['success', 'warning', 'error', 'info'] as const).forEach((fam) => {
        const ramp = c.status?.[fam];
        if (!ramp) return;
        set(`--color-status-${fam}-50`,  ramp[50],  'color');
        set(`--color-status-${fam}-100`, ramp[100], 'color');
        set(`--color-status-${fam}-200`, ramp[200], 'color');
        set(`--color-status-${fam}-300`, ramp[300], 'color');
        set(`--color-status-${fam}-400`, ramp[400], 'color');
        set(`--color-status-${fam}-500`, ramp[500], 'color');
        set(`--color-status-${fam}-600`, ramp[600], 'color');
        set(`--color-status-${fam}-700`, ramp[700], 'color');
        set(`--color-status-${fam}-800`, ramp[800], 'color');
        set(`--color-status-${fam}-900`, ramp[900], 'color');
        set(`--color-status-${fam}-surface`, ramp.surface, 'color');
        // Accessible on-tint foreground — guarded so an omitted `fg` (e.g. the
        // hand-authored SYNAPSYS_TOKENS literal) never emits `…-fg: undefined`.
        if (ramp.fg) set(`--color-status-${fam}-fg`, ramp.fg, 'color');
        // Bare alias mirrors the preset.css fallback: `bg-status-success` → 500.
        set(`--color-status-${fam}`, ramp[500], 'color');
      });
    }

    // Semantic surface ladder
    if (c.bg) {
      set('--color-canvas',           c.bg.canvas,          'color');
      set('--color-surface',          c.bg.surface,         'color');
      set('--color-surface-raised',   c.bg.surfaceRaised,   'color');
      set('--color-surface-elevated', c.bg.surfaceElevated, 'color');
      set('--color-dialog',           c.bg.dialog,          'color');
      set('--color-surface-inset',    c.bg.surfaceInset,    'color');
      set('--color-surface-accent',   c.bg.surfaceAccent,   'color');
      set('--color-overlay',          c.bg.overlay,         'color');
    }

    // Semantic text ladder (D-08: text as color to avoid --text-* size collision)
    if (c.text) {
      set('--color-text-primary',   c.text.primary,   'color');
      set('--color-text-secondary', c.text.secondary, 'color');
      set('--color-text-tertiary',  c.text.tertiary,  'color');
      set('--color-text-disabled',  c.text.disabled,  'color');
      set('--color-text-inverse',   c.text.inverse,   'color');
      set('--color-text-accent',    c.text.accent,    'color');
    }

    // Semantic icon ladder
    if (c.icon) {
      set('--color-icon-primary',   c.icon.primary,   'color');
      set('--color-icon-secondary', c.icon.secondary, 'color');
      set('--color-icon-disabled',  c.icon.disabled,  'color');
      set('--color-icon-inverse',   c.icon.inverse,   'color');
    }

    // Semantic border ladder
    if (c.border) {
      set('--color-border-subtle',  c.border.subtle,  'color');
      set('--color-border-default', c.border.default, 'color');
      set('--color-border-strong',  c.border.strong,  'color');
      set('--color-border-accent',  c.border.accent,  'color');
    }

    // Semantic action states
    if (c.action) {
      if (c.action.primary) {
        set('--color-action-primary-bg',        c.action.primary.bg,       'color');
        set('--color-action-primary-bg-hover',  c.action.primary.bgHover,  'color');
        set('--color-action-primary-bg-active', c.action.primary.bgActive, 'color');
        set('--color-action-primary-text',      c.action.primary.text,     'color');
      }
      if (c.action.secondary) {
        set('--color-action-secondary-bg',       c.action.secondary.bg,      'color');
        set('--color-action-secondary-bg-hover', c.action.secondary.bgHover, 'color');
        set('--color-action-secondary-border',   c.action.secondary.border,  'color');
      }
    }

    // Focus + selection
    if (c.focus) {
      set('--color-focus-ring',        c.focus.ring,       'color');
      set('--color-focus-ring-offset', c.focus.ringOffset, 'color');
    }
    if (c.selection) {
      set('--color-selection-fill',    c.selection.fill,    'color');
      set('--color-selection-outline', c.selection.outline, 'color');
    }

    // `statusSlots` retired in 0.5.0 — status fg/bg pairs are emitted above.
  }

  // ── Typography ──────────────────────────────────────────────────────────
  if (tokens.typography) {
    const t = tokens.typography;

    if (t.fonts) {
      if (t.fonts.sans)    set('--font-sans',    t.fonts.sans.family,    'font');
      if (t.fonts.mono)    set('--font-mono',    t.fonts.mono.family,    'font');
      if (t.fonts.display) set('--font-display', t.fonts.display.family, 'font');
    }

    if (t.scale) {
      const s = t.scale;
      set('--text-micro', s.micro, 'length');
      set('--text-xs',    s.xs,    'length');
      set('--text-sm',    s.sm,    'length');
      set('--text-md',    s.md,    'length');
      set('--text-base',  s.base,  'length');
      set('--text-lg',    s.lg,    'length');
      set('--text-xl',    s.xl,    'length');
      set('--text-2xl',   s['2xl'], 'length');
      set('--text-3xl',   s['3xl'], 'length');
      set('--text-4xl',   s['4xl'], 'length');
      set('--text-5xl',   s['5xl'], 'length');
      set('--text-6xl',   s['6xl'], 'length');
      set('--text-7xl',   s['7xl'], 'length');
      set('--text-8xl',   s['8xl'], 'length');
    }

    if (t.weights) {
      // Numeric weights stored as strings; emitted raw (preset.css uses
      // the same unitless form — e.g. `--font-weight-regular: 400`).
      if (t.weights.regular  !== undefined) vars['--font-weight-regular']  = t.weights.regular;
      if (t.weights.medium   !== undefined) vars['--font-weight-medium']   = t.weights.medium;
      if (t.weights.semibold !== undefined) vars['--font-weight-semibold'] = t.weights.semibold;
      if (t.weights.bold     !== undefined) vars['--font-weight-bold']     = t.weights.bold;
    }

    if (t.lineHeights) {
      // Line heights are unitless; the length regex doesn't match bare numbers.
      // Emit raw after max-length check.
      if (t.lineHeights.compact !== undefined && t.lineHeights.compact.length <= MAX_VALUE_LENGTH) {
        vars['--leading-compact'] = t.lineHeights.compact;
      }
      if (t.lineHeights.default !== undefined && t.lineHeights.default.length <= MAX_VALUE_LENGTH) {
        vars['--leading-default'] = t.lineHeights.default;
      }
      if (t.lineHeights.relaxed !== undefined && t.lineHeights.relaxed.length <= MAX_VALUE_LENGTH) {
        vars['--leading-relaxed'] = t.lineHeights.relaxed;
      }
      if (t.lineHeights.display !== undefined && t.lineHeights.display.length <= MAX_VALUE_LENGTH) {
        vars['--leading-display'] = t.lineHeights.display;
      }
    }

    if (t.tracking) {
      // Tracking values are 'em'-suffixed signed decimals (e.g. '-0.02em') or '0'.
      if (t.tracking.tight  !== undefined && t.tracking.tight.length  <= MAX_VALUE_LENGTH) {
        vars['--tracking-tight']  = t.tracking.tight;
      }
      if (t.tracking.normal !== undefined && t.tracking.normal.length <= MAX_VALUE_LENGTH) {
        vars['--tracking-normal'] = t.tracking.normal;
      }
      if (t.tracking.wide   !== undefined && t.tracking.wide.length   <= MAX_VALUE_LENGTH) {
        vars['--tracking-wide']   = t.tracking.wide;
      }
    }
  }

  // ── Spacing (numeric keys 0..13) ───────────────────────────────────────
  if (tokens.spacing) {
    const sp = tokens.spacing;
    for (let i = 0; i <= 13; i++) {
      set(`--spacing-${i}`, sp[i as keyof SpacingTokens], 'length');
    }
  }

  // ── Border Radius ──────────────────────────────────────────────────────
  if (tokens.borderRadius) {
    const r = tokens.borderRadius;
    set('--radius-xs',   r.xs,    'length');
    set('--radius-sm',   r.sm,    'length');
    set('--radius-md',   r.md,    'length');
    set('--radius-lg',   r.lg,    'length');
    set('--radius-xl',   r.xl,    'length');
    set('--radius-2xl',  r['2xl'], 'length');
    set('--radius-full', r.full,  'length');
  }

  // ── Shadows ────────────────────────────────────────────────────────────
  if (tokens.shadows) {
    const sh = tokens.shadows;
    set('--shadow-xs',      sh.xs,     'shadow');
    set('--shadow-sm',      sh.sm,     'shadow');
    set('--shadow-md',      sh.md,     'shadow');
    set('--shadow-lg',      sh.lg,     'shadow');
    set('--shadow-xl',      sh.xl,     'shadow');
    set('--shadow-glow-sm', sh.glowSm, 'shadow');
    set('--shadow-glow-md', sh.glowMd, 'shadow');
    // Signature elevation — guarded so an omitted `brand` slot never emits
    // `--shadow-signal: undefined` (e.g. the SYNAPSYS_TOKENS literal).
    if (sh.brand) set('--shadow-signal', sh.brand, 'shadow');
  }

  // ── Motion ─────────────────────────────────────────────────────────────
  if (tokens.motion) {
    const m = tokens.motion;
    if (m.easing) {
      set('--ease-standard', m.easing.standard, 'shadow');
      set('--ease-entrance', m.easing.entrance, 'shadow');
      set('--ease-exit',     m.easing.exit,     'shadow');
      // Emphasis easing — guarded so an omitted slot never emits
      // `--ease-emphasis: undefined` (e.g. the SYNAPSYS_TOKENS literal).
      if (m.easing.emphasis) set('--ease-emphasis', m.easing.emphasis, 'shadow');
    }
    if (m.duration) {
      set('--duration-instant', m.duration.instant, 'duration');
      set('--duration-fast',    m.duration.fast,    'duration');
      set('--duration-base',    m.duration.base,    'duration');
      set('--duration-slow',    m.duration.slow,    'duration');
      set('--duration-slower',  m.duration.slower,  'duration');
    }
  }

  return vars;
}

/**
 * Generates a CSS custom property declaration string from partial theme tokens.
 *
 * Suitable for injection via `<style>` tags (CSP nonce support).
 * Reuses generateCSSVariables for validation — invalid values are dropped.
 *
 * @example
 * generateCSSString(tokens)
 * // → "--color-canvas: oklch(0.13 0.003 286); --spacing-5: 16px"
 */
export function generateCSSString(tokens: PartialThemeTokens): string {
  const vars = generateCSSVariables(tokens);
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

/**
 * Creates a validated, frozen ThemeTokens object.
 * Throws a ZodError if tokens fail validation.
 */
export function createTheme(tokens: ThemeTokens): ThemeTokens {
  const validated = ThemeTokensSchema.parse(tokens);
  return Object.freeze(validated) as ThemeTokens;
}

/**
 * Deep-merges partial theme token objects onto a base.
 * Override tokens are applied left-to-right, with later values winning.
 */
export function mergeThemes(
  base: PartialThemeTokens,
  ...overrides: PartialThemeTokens[]
): PartialThemeTokens {
  if (overrides.length === 0) return base;

  return overrides.reduce((acc, theme) => deepMerge(acc, theme), base);
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: T): T {
  const result = { ...target } as Record<string, unknown>;

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = result[key];

    if (sourceVal === undefined) continue;

    if (
      typeof sourceVal === 'object' &&
      sourceVal !== null &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else {
      result[key] = sourceVal;
    }
  }

  return result as T;
}
