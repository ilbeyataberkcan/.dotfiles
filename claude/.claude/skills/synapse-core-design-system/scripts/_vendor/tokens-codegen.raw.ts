/**
 * Tokens codegen — compile-time CSS-overrides generator for cve-design-system.
 *
 * Dev-only module: excluded from the published tarball via
 * `tsconfig.build.json` `exclude`. Reachable only via direct workspace path
 * for monorepo-internal hosts (`bun packages/design-system/src/tokens-codegen/cli.ts`).
 *
 * Why compile-time over runtime ThemeInjector:
 * - Runtime injection (`<ThemeInjector tokens={...}>`) renders a wrapping div
 *   whose CSS variables apply only to descendants. `<html>` / `<body>` styling
 *   from preset.css `@layer base` reads the preset's `:root` defaults, not the
 *   host seed — a structural cascade gap.
 * - Compile-time output declares `:root { ... }` + `[data-theme="light"] { ... }`
 *   + `[data-theme="dark"] { ... }` at non-layered specificity, beating
 *   preset's `@theme` block (which Tailwind v4 folds into `@layer theme`,
 *   lower priority). Tokens apply globally, including `<html>` / `<body>`.
 *
 * Output shape (three blocks):
 *   :root                — values for whichever mode the seed's `defaultMode` selects
 *                          (matches no-attribute html; covers pre-hydration / no-JS)
 *   [data-theme="light"] — host's light-mode values; overrides preset's [data-theme="light"] block
 *   [data-theme="dark"]  — host's dark-mode values
 *
 * Pair with `next-themes` (or equivalent) for runtime mode switching — the
 * library toggles `<html data-theme="...">` and the CSS handles the rest.
 *
 * @module
 */

import type { ThemeSeedInput } from '../theme/oklch.js';
import {
  generateModePair,
  generateTheme,
  normalizeThemeSeed,
} from '../theme/oklch.js';
import type { PartialThemeTokens } from '../theme/types.js';
import { generateCSSString, mergeThemes } from '../theme/utils.js';

export interface GenerateThemeCSSOptions {
  /** Header comment inserted at the top of the file. */
  header?: string;
}

/**
 * Generate a CSS file overriding `cve-design-system/preset.css` defaults with
 * seed-derived tokens. Returns a string suitable for direct writeFileSync.
 *
 * Output shape:
 *   :root                — non-color tokens (typography, spacing, radii,
 *                          shadows, motion) PLUS the default-mode colors.
 *                          Wins when `<html>` has no data-theme attribute.
 *   [data-theme="light"] — host's light-mode COLOR overrides only
 *                          (typography etc. lives in :root and is mode-independent).
 *   [data-theme="dark"]  — host's dark-mode COLOR overrides only.
 *
 * Mode-independent tokens (fonts, spacing, etc.) live ONCE at :root because
 * they don't change when the user toggles theme. Putting them only there
 * keeps the `[data-theme="..."]` blocks minimal and avoids the bug where
 * one mode picks up preset defaults because its block was missing typography.
 *
 * For light-first hosts: set `seed.defaultMode = 'light'`. The `:root` block
 * carries light-mode colors so no-JS / pre-hydration paint shows the host's
 * brand instead of the preset's dark-first defaults.
 */
export function generateThemeCSS(
  seed: ThemeSeedInput,
  options?: GenerateThemeCSSOptions,
): string {
  const normalized = normalizeThemeSeed(seed);
  const defaultMode = normalized.defaultMode ?? 'dark';

  // `generateTheme` returns the FULL ThemeTokens (typography + spacing + radii
  // + shadows + motion + DARK colors). `generateModePair` returns colors-only
  // PartialThemeTokens for each mode.
  const fullTheme = generateTheme(normalized);
  const { dark: darkColors, light: lightColors } = generateModePair(normalized);

  // :root carries non-color tokens + default-mode colors. For dark-default,
  // fullTheme already has dark colors. For light-default, overlay light colors
  // on top of fullTheme's typography/spacing/etc.
  const rootTokens: PartialThemeTokens =
    defaultMode === 'light' ? mergeThemes(fullTheme, lightColors) : fullTheme;

  const indent = (tokens: PartialThemeTokens): string =>
    generateCSSString(tokens)
      .split('; ')
      .filter(Boolean)
      .map((decl) => `  ${decl};`)
      .join('\n');

  const lines: string[] = [];
  if (options?.header) {
    lines.push(`/* ${options.header} */`, '');
  }

  lines.push(
    ':root {',
    indent(rootTokens),
    '}',
    '',
    '[data-theme="light"] {',
    indent(lightColors),
    '}',
    '',
    '[data-theme="dark"] {',
    indent(darkColors),
    '}',
  );

  return lines.join('\n') + '\n';
}
