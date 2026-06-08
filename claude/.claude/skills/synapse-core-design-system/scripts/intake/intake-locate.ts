#!/usr/bin/env bun
/**
 * intake-locate — Stage 0 (INTAKE) ground-truth finder.
 *
 * Before any digest/diagnose work, the pipeline must know WHERE the artifacts it
 * reads actually live. Re-deriving these paths inline in every later stage (each
 * `find … | grep` re-run) is the token waste this skill exists to kill (R3), and
 * a stage that guesses the wrong path silently diagnoses the wrong file (L7: the
 * whole method anchors on the EMITTED output — `theme.generated.css` — so if we
 * locate the wrong CSS, Stage 2 compares the ledger against nothing). This script
 * walks a target `--root` once, applies robust heuristics, and writes ONE paths
 * manifest (`intake-paths.json`) every downstream stage reads.
 *
 * The shape mirrors the real engagement layout: a Next-style HOST (the app being
 * themed: `app/theme.generated.css`, `lib/theme-seed.ts`, `app/globals.css`) that
 * consumes a SEPARATE design-system PACKAGE (the cve source: `preset.css` with
 * `@theme`, the tokens codegen CLI, the components registry + icons index). They
 * may both live under one `--root` (a monorepo) or in sibling trees, so the host
 * and the package are located independently — `--package`/`--host` are hints that
 * scope the search, never hardcoded paths.
 *
 * G0's hard dependency: the EMITTED theme CSS must be found. It is the L7 anchor
 * ("diagnose from emitted output"); without it Stage 2 has nothing to diagnose.
 * So a missing emitted-CSS exits nonzero — every other artifact is reported as
 * found-or-null (a later stage decides whether its own absence is fatal).
 *
 * Pure fs walking (Bun.Glob) + heuristics; zero deps beyond Bun built-ins. The
 * target root and the hints arrive as ARGS at runtime; nothing is hardcoded.
 *
 * CLI
 *   intake-locate --root <repo> [--package <dir>] [--host <dir>]
 *                 [--reference <dir>] [--out <intake-paths.json>] [--json]
 *
 *   --root       the target repo to scan (required). May be the host, the
 *                package, or a monorepo containing both.
 *   --package    hint: where the design-system PACKAGE source lives (preset.css,
 *                codegen, registry, icons). Scopes that half of the search.
 *   --host       hint: where the HOST app lives (theme.generated.css, seed,
 *                globals). Scopes that half of the search.
 *   --reference  hint: where the reference design assets live (mockup images).
 *   --out        where to write the manifest (default: <root>/intake-paths.json).
 *   --json       print the manifest JSON only (no human summary).
 *
 * Exit 0 = the emitted-output anchor was found and the manifest was written.
 * Exit 1 = the emitted theme CSS could not be located (G0 dependency unmet).
 */

import { Glob } from 'bun';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------

export interface IntakeArgs {
  root: string;
  package?: string;
  host?: string;
  reference?: string;
  out?: string;
}

export function parseArgs(argv: string[]): IntakeArgs {
  const args: Partial<IntakeArgs> = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case '--root':
        if (value) { args.root = value; i++; }
        break;
      case '--package':
        if (value) { args.package = value; i++; }
        break;
      case '--host':
        if (value) { args.host = value; i++; }
        break;
      case '--reference':
        if (value) { args.reference = value; i++; }
        break;
      case '--out':
        if (value) { args.out = value; i++; }
        break;
    }
  }
  if (!args.root) throw new Error('--root is required');
  return args as IntakeArgs;
}

// ---------------------------------------------------------------------------
// the manifest shape — what the pipeline needs to know where to find
// ---------------------------------------------------------------------------

/** One located artifact: an absolute path + the rule that found it, or null when absent. */
export interface Located {
  /** Absolute path, or null when no candidate matched. */
  path: string | null;
  /** Short note on WHICH heuristic matched (or why nothing did) — for the human summary. */
  via: string;
  /** Other plausible candidates we saw but did not pick (transparency for an operator override). */
  alternates?: string[];
}

export interface IntakeManifest {
  /** The scanned root, absolute. */
  root: string;
  /** Resolved host / package roots (a monorepo collapses both onto subdirs of root). */
  hostRoot: string | null;
  packageRoot: string | null;
  /** THE L7 anchor — the emitted theme CSS Stage 2 diagnoses against. G0 fails if null. */
  emittedThemeCss: Located;
  /** The design-system seed file (theme-seed.ts) + the codegen CLI that consumes it (L9). */
  themeSeed: Located;
  codegenCli: Located;
  /** Package design surface: the components registry, the icons index, the @theme preset.css. */
  registry: Located;
  iconsIndex: Located;
  presetCss: Located;
  /** Host app surface: the global stylesheet + the showcase route (optional — may not exist). */
  hostGlobals: Located;
  showcase: Located;
  /** The reference design assets (mockup image dir) the digest/review stages pair against. */
  referenceAssets: Located;
  /** True iff the G0 dependency (emitted CSS) resolved. */
  ok: boolean;
}

// ---------------------------------------------------------------------------
// fs walking helpers (Bun.Glob, reuse-first)
// ---------------------------------------------------------------------------

const SKIP = /(^|\/)(node_modules|dist|build|coverage|\.next|\.turbo|\.git|out|__snapshots__)(\/|$)/;

/** Resolve a possibly-relative dir against the root; undefined hints fall back to root. */
function resolveDir(root: string, hint: string | undefined): string {
  if (!hint) return root;
  return isAbsolute(hint) ? hint : resolve(root, hint);
}

/**
 * Glob a directory for files, skipping vendored/build output. Returns absolute
 * paths, shortest-relative-path first so the AUTHORED source (e.g. `src/…`) is
 * preferred over a deep copy and ties are stable (determinism contract).
 */
function find(dir: string, pattern: string): string[] {
  if (!existsSync(dir)) return [];
  const glob = new Glob(pattern);
  const hits: string[] = [];
  for (const rel of glob.scanSync({ cwd: dir, onlyFiles: true, dot: false })) {
    if (SKIP.test('/' + rel)) continue;
    hits.push(join(dir, rel));
  }
  // Prefer shallower paths, then `src/` over a sibling, then lexical — deterministic.
  hits.sort((a, b) => {
    const da = a.split('/').length;
    const db = b.split('/').length;
    if (da !== db) return da - db;
    return a.localeCompare(b);
  });
  return hits;
}

/**
 * First glob hit across one or more patterns, searched in each `dir` in order
 * (scoped hint dirs first, then a wider fallback) so a monorepo where the codegen
 * and the components packages are SIBLINGS still resolves: the package-root hint
 * narrows the common case, the root fallback catches the split-package case.
 */
function firstOf(dirs: string | string[], patterns: string[], label: string): Located {
  const searchDirs = Array.isArray(dirs) ? dirs : [dirs];
  const all: string[] = [];
  for (const dir of searchDirs) {
    for (const p of patterns) {
      for (const hit of find(dir, p)) if (!all.includes(hit)) all.push(hit);
    }
    if (all.length) break; // first dir that yields anything wins (preserves scoping)
  }
  if (all.length === 0) {
    return { path: null, via: `${label}: no match under ${searchDirs.join(' / ')}` };
  }
  const [picked, ...rest] = all;
  const located: Located = { path: picked, via: `${label}: ${patterns.join(' | ')}` };
  if (rest.length) located.alternates = rest;
  return located;
}

// ---------------------------------------------------------------------------
// host / package root detection
// ---------------------------------------------------------------------------

/**
 * Find the HOST root: the app that consumes the design system. Signature is an
 * emitted `theme.generated.css` (the thing it generates) under an `app/`-style
 * dir, OR a package.json with a `tokens:generate`/`codegen` script that names a
 * seed + emitted CSS. The hint short-circuits the search.
 */
function detectHostRoot(root: string, hint: string | undefined): string | null {
  if (hint) {
    const dir = resolveDir(root, hint);
    return existsSync(dir) ? dir : null;
  }
  // The emitted CSS is the strongest host signal; its grandparent is the host root.
  const emitted = find(root, '**/theme.generated.css');
  if (emitted.length) {
    // app/theme.generated.css → host root is the parent of `app/`.
    const css = emitted[0];
    const appDir = css.slice(0, css.lastIndexOf('/'));
    const parent = appDir.slice(0, appDir.lastIndexOf('/'));
    return parent || root;
  }
  return root;
}

/**
 * Find the design-system PACKAGE root: the source that owns the codegen + tokens
 * + preset. Signature is a `preset.css` carrying `@theme`, or a `tokens-codegen`
 * dir. Falls back to the root (single-tree projects) when nothing distinct.
 */
function detectPackageRoot(root: string, hint: string | undefined): string | null {
  if (hint) {
    const dir = resolveDir(root, hint);
    return existsSync(dir) ? dir : null;
  }
  const codegen = find(root, '**/tokens-codegen/cli.ts');
  if (codegen.length) {
    // …/design-system/src/tokens-codegen/cli.ts → package root is the dir holding `src/`.
    const cli = codegen[0];
    const idx = cli.indexOf('/src/');
    if (idx !== -1) return cli.slice(0, idx);
    return cli.slice(0, cli.lastIndexOf('/tokens-codegen'));
  }
  // Otherwise an authored preset.css (skips dist) marks the package source tree.
  const preset = find(root, '**/preset.css');
  if (preset.length) {
    const p = preset[0];
    const idx = p.indexOf('/src/');
    if (idx !== -1) return p.slice(0, idx);
  }
  return root;
}

// ---------------------------------------------------------------------------
// the locate pass — one walk, all artifacts
// ---------------------------------------------------------------------------

export function locate(args: IntakeArgs): IntakeManifest {
  const root = resolve(process.cwd(), args.root);

  const hostRoot = detectHostRoot(root, args.host);
  const packageRoot = detectPackageRoot(root, args.package);
  const refDir = args.reference ? resolveDir(root, args.reference) : root;

  // The L7 anchor lives in the host (it is what the host's codegen EMITS). Search
  // the host root first, then widen to the whole root so a non-standard layout
  // still resolves rather than silently failing G0.
  const emittedThemeCss = (() => {
    const inHost = hostRoot ? firstOf(hostRoot, ['**/theme.generated.css'], 'emitted theme CSS') : null;
    if (inHost?.path) return inHost;
    return firstOf(root, ['**/theme.generated.css'], 'emitted theme CSS');
  })();

  // Seed: the typed ThemeSeed literal the host feeds the codegen. `lib/theme-seed.ts`
  // is the engagement convention; widen to any *theme-seed* / *theme.seed*.
  const seedDir = hostRoot ?? root;
  const themeSeed = firstOf(
    seedDir,
    ['**/theme-seed.ts', '**/theme.seed.ts', '**/*theme-seed*.ts'],
    'theme seed',
  );

  // Codegen CLI: package-owned. tokens-codegen/cli.ts is canonical.
  const pkgDir = packageRoot ?? root;
  const codegenCli = firstOf(
    pkgDir,
    ['**/tokens-codegen/cli.ts', '**/tokens-codegen/cli.*', '**/codegen/cli.ts'],
    'codegen CLI',
  );

  // The codegen lives in the design-system package, but the registry + icons live
  // in a SIBLING components package — so search the package root first, then the
  // whole root (the monorepo) to cross the package boundary. Dedupe when equal.
  const pkgThenRoot = pkgDir === root ? [root] : [pkgDir, root];

  // Components registry: the keyed component map. Prefer the components package's
  // registry over core's (the renderable surface is in components).
  const registry = firstOf(
    pkgThenRoot,
    ['**/components/**/registries/index.ts', '**/registries/index.ts', '**/registry.ts'],
    'components registry',
  );

  // Icons index: the lucide tree-shake registry.
  const iconsIndex = firstOf(
    pkgThenRoot,
    ['**/icons/index.ts', '**/icons/registry.ts'],
    'icons index',
  );

  // preset.css carrying @theme: the package's Tailwind preset (source, not dist).
  const presetCss = firstOf(
    pkgDir,
    ['**/preset.css'],
    'preset.css (@theme)',
  );

  // Host globals: the app stylesheet that imports preset + emitted theme.
  const hostGlobals = firstOf(
    seedDir,
    ['**/app/globals.css', '**/globals.css', '**/app/global.css'],
    'host globals',
  );

  // Showcase route (optional): the /showcase page or the FeatureShowcase component.
  const showcase = firstOf(
    root,
    ['**/showcase/page.tsx', '**/*[Ss]howcase*.tsx', '**/showcase-tree.ts'],
    'showcase',
  );

  // Reference assets: the mockup image directory the digest/review pair against.
  const referenceAssets = locateReferenceDir(refDir);

  const ok = emittedThemeCss.path !== null;

  return {
    root,
    hostRoot,
    packageRoot,
    emittedThemeCss,
    themeSeed,
    codegenCli,
    registry,
    iconsIndex,
    presetCss,
    hostGlobals,
    showcase,
    referenceAssets,
    ok,
  };
}

/**
 * Reference assets are a DIRECTORY of mockup images, not one file. Find the dir
 * with the densest cluster of image files (a `docs/<x>-design-system/**` tree in
 * the engagement), so the digest stage gets the folder to walk, not a lone png.
 */
function locateReferenceDir(searchRoot: string): Located {
  const imgs = find(searchRoot, '**/*.{png,jpg,jpeg,webp,svg}');
  if (imgs.length === 0) {
    return { path: null, via: `reference assets: no images under ${searchRoot}` };
  }
  // Tally images per containing directory; the heaviest dir is the asset root.
  const counts = new Map<string, number>();
  for (const img of imgs) {
    const dir = img.slice(0, img.lastIndexOf('/'));
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // densest first
    return a[0].localeCompare(b[0]); // stable tie-break
  });
  const [picked, ...rest] = ranked;
  const located: Located = {
    path: picked[0],
    via: `reference assets: densest image dir (${picked[1]} files)`,
  };
  if (rest.length) located.alternates = rest.slice(0, 4).map(([d, n]) => `${d} (${n})`);
  return located;
}

// ---------------------------------------------------------------------------
// output
// ---------------------------------------------------------------------------

function rel(root: string, p: string | null): string {
  if (!p) return '(not found)';
  const r = relative(root, p);
  return r.startsWith('..') ? p : r;
}

function summary(m: IntakeManifest): string {
  const lines: string[] = [];
  lines.push(`intake-locate — ${m.root}`);
  lines.push(`  host root:    ${m.hostRoot ? rel(m.root, m.hostRoot) || '.' : '(none)'}`);
  lines.push(`  package root: ${m.packageRoot ? rel(m.root, m.packageRoot) || '.' : '(none)'}`);
  lines.push('');
  const row = (label: string, l: Located) =>
    lines.push(`  ${l.path ? '✓' : '✗'} ${label.padEnd(20)} ${rel(m.root, l.path)}`);
  row('emitted theme CSS', m.emittedThemeCss);
  row('theme seed', m.themeSeed);
  row('codegen CLI', m.codegenCli);
  row('components registry', m.registry);
  row('icons index', m.iconsIndex);
  row('preset.css (@theme)', m.presetCss);
  row('host globals', m.hostGlobals);
  row('showcase', m.showcase);
  row('reference assets', m.referenceAssets);
  lines.push('');
  lines.push(
    m.ok
      ? '  ✓ G0 dependency met — emitted theme CSS located (L7 anchor)'
      : '  ✗ G0 BLOCKED — emitted theme CSS not found; the diagnose stage has no anchor',
  );
  return lines.join('\n');
}

function main(): void {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  let args: IntakeArgs;
  try {
    args = parseArgs(argv);
  } catch (err) {
    process.stderr.write(
      `${(err as Error).message}\n` +
        'Usage: intake-locate --root <repo> [--package <dir>] [--host <dir>] [--reference <dir>] [--out <json>] [--json]\n',
    );
    process.exit(2);
  }

  const root = resolve(process.cwd(), args.root);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    process.stderr.write(`intake-locate: --root is not a directory: ${root}\n`);
    process.exit(2);
  }

  const manifest = locate(args);

  const outPath = args.out ? resolve(process.cwd(), args.out) : join(root, 'intake-paths.json');
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');

  if (json) {
    process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
  } else {
    process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
    process.stdout.write('\n' + summary(manifest) + '\n');
    process.stdout.write(`\n  manifest written → ${rel(root, outPath) || outPath}\n`);
  }

  process.exit(manifest.ok ? 0 : 1);
}

if (import.meta.main) {
  main();
}
