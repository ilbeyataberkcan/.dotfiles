#!/usr/bin/env bun
// audit-token-refs — every token a component reaches for MUST resolve (L8).
//
// Why: `text-status-error-fg` is used 36× but `--color-status-error-fg` exists
// in neither preset.css nor the generated theme — so the brand-red required
// marker silently falls back to inherited graphite and just vanishes. Same with
// `--shadow-brand`: referenced, undefined, every CTA degrades to a dark
// shadow-sm. tsc/build/tests are all green through this. The fix is a hard lint:
// every `var(--…)` and every token-shaped Tailwind utility must resolve against
// the union of @theme (preset.css) + the emitted theme CSS, or it's exit 1.
//
// CLI: audit-token-refs --scan <src> --theme <css> [--preset <css>] [--json]
// Out: unresolved file:line refs; exit 1 on any dangling token reference.

import { parseArgs, flagStr, readSources, stripComments, lineAt, emit, type Violation } from '../_lib/cli.ts';

// Only the namespaces whose utility tails are SEMANTIC TOKENS (a typo'd one
// silently no-ops) are in scope. Tailwind's built-in scales (leading-none,
// duration-200, rounded-lg, tracking-wide, text-sm) always resolve against
// Tailwind's own defaults, never a custom property, so flagging them is a false
// positive — they're deliberately excluded. The L8 finding was a color token
// (status-error-fg) and a signature shadow (shadow-brand); those are the shapes
// that silently vanish, so those are what we resolve.
const COLOR_PREFIXES = ['text', 'bg', 'border', 'ring', 'fill', 'stroke', 'from', 'to', 'via', 'decoration', 'outline', 'caret', 'divide', 'placeholder'];

// First tail-segment must name a known semantic color group for the utility to
// count as a token reference (keeps text-white, bg-black, border-transparent out).
const COLOR_ROOTS = new Set([
  'status', 'accent', 'surface', 'canvas', 'dialog', 'overlay', 'text', 'icon',
  'border', 'action', 'focus', 'selection', 'neutral',
]);
const SHADOW_ROOTS = new Set(['signal', 'brand']);
const FONT_ROOTS = new Set(['display']);

// Runtime-injected variable namespaces are defined by the framework at render
// time, never statically — Radix sizing vars, Tailwind internals, the bleed var.
const RUNTIME_VAR = /^--(radix|tw|cve-bleed|swiper|reach)/;

/** Extract every defined custom-property name from a CSS file's declarations + @theme. */
function definedVars(css: string): Set<string> {
  const set = new Set<string>();
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) set.add(m[1]);
  return set;
}

/** Map a token-shaped Tailwind utility to the custom property it must resolve to, or null. */
function isTokenUtility(util: string): { varName: string } | null {
  for (const pre of COLOR_PREFIXES) {
    if (util === pre || !util.startsWith(pre + '-')) continue;
    const tail = util.slice(pre.length + 1).replace(/^-/, '');
    if (!tail) return null;
    return COLOR_ROOTS.has(tail.split('-')[0]) ? { varName: `--color-${tail}` } : null;
  }
  if (util.startsWith('shadow-')) {
    const tail = util.slice(7);
    return SHADOW_ROOTS.has(tail.split('-')[0]) ? { varName: `--shadow-${tail}` } : null;
  }
  if (util.startsWith('font-')) {
    const tail = util.slice(5);
    return FONT_ROOTS.has(tail) ? { varName: `--font-${tail}` } : null;
  }
  return null;
}

async function main() {
  const { _, flags } = parseArgs(Bun.argv.slice(2));
  const src = flagStr(flags, 'scan') ?? _[0];
  const themePath = flagStr(flags, 'theme');
  const presetPath = flagStr(flags, 'preset');
  const asJson = flags.text !== true;
  if (!src || !themePath) {
    console.error('audit-token-refs: --scan <src> and --theme <css> required');
    process.exit(2);
  }

  // The resolution universe = the EMITTED theme (ground truth, L7) ∪ the preset
  // @theme block. Both arrive as path args; nothing about the token set is baked.
  const defined = new Set<string>();
  for (const p of [themePath, presetPath].filter(Boolean) as string[]) {
    const file = Bun.file(p);
    if (await file.exists()) for (const v of definedVars(await file.text())) defined.add(v);
  }
  if (defined.size === 0) {
    console.error(`audit-token-refs: theme CSS at ${themePath} defined no variables — wrong path?`);
    process.exit(2);
  }

  const files = await readSources(src, { globs: ['**/*.ts', '**/*.tsx', '**/*.css'], includeTests: flags['include-tests'] === true });
  const violations: Violation[] = [];

  for (const f of files) {
    const isCss = f.path.endsWith('.css');
    // Strip comments so a token NAME documented in a JSDoc/CSS comment is not
    // read as a usage — the L8 bug is a real reference that fails to resolve.
    const code = stripComments(f.text);

    // 1) Direct var(--…) references — both in CSS and in TS/TSX inline styles.
    for (const m of code.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)/gi)) {
      const name = m[1];
      // A var() with a fallback (var(--x, #fff)) is self-healing — skip those.
      // Framework-injected vars (--radix-*, --tw-*) are defined at render time.
      const hasFallback = /,/.test(m[0]);
      if (RUNTIME_VAR.test(name)) continue;
      if (!defined.has(name) && !hasFallback) {
        violations.push({ file: f.path, line: lineAt(code, m.index ?? 0), rule: 'unresolved-var', detail: `var(${name}) resolves to nothing — define the token or the value silently falls back`, severity: 'CRITICAL' });
      }
    }

    // 2) Token-shaped Tailwind utilities — only in TS/TSX className strings.
    // A .css theme file DEFINES these tokens (it's the source of truth), so a
    // `border-status-*` substring there is a declaration, not a usage to resolve.
    if (isCss) continue;
    for (const m of code.matchAll(/[a-z][a-z0-9]*(?:-[a-z0-9]+)+/gi)) {
      const util = m[0];
      const tok = isTokenUtility(util);
      if (tok && !defined.has(tok.varName)) {
        violations.push({ file: f.path, line: lineAt(code, m.index ?? 0), rule: 'unresolved-utility', detail: `utility "${util}" → ${tok.varName} is undefined; the class silently no-ops`, severity: 'CRITICAL' });
      }
    }
  }

  emit({ audit: 'audit-token-refs', ok: violations.length === 0, scanned: files.length, violations, tokensKnown: defined.size }, asJson);
}

main();
