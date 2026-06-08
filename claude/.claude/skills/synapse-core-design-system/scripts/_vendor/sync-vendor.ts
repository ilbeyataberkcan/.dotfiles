#!/usr/bin/env bun
/**
 * sync-vendor — pin the package's color/codegen math into `_vendor/` so the
 * skill's scripts import the SAME math the package ships, never a fork (L9:
 * "the math has one home"). Run once at setup, and again whenever the source
 * package changes; `--check` fails (exit 1) if the pinned snapshot has drifted
 * from source, which is the maintenance gate.
 *
 * What it pins (all into this directory):
 *   oklch.raw.ts            verbatim source — provenance/drift anchor
 *   utils.raw.ts            verbatim source — provenance/drift anchor
 *   tokens-codegen.raw.ts   verbatim source — provenance/drift anchor
 *   theme-math.ts           RUNTIME-PORTABLE re-export of the three above, with
 *                           imports rewritten so `bun` resolves it standalone
 *                           (culori → the bundled snapshot; cross-module type
 *                           imports → theme-types.ts; the Zod schema → a stub
 *                           used only by the unused createTheme path).
 *   theme-types.ts          minimal local type stubs (the token shapes the math
 *                           references) — keeps theme-math.ts dependency-free.
 *   culori.min.mjs          the bundled, self-contained culori snapshot.
 *   look-vocab.json         the closed 7-token data-cve-look vocabulary (preset.css).
 *   theme-vars.json         the full @theme custom-property name list (preset.css).
 *   VENDOR.json             provenance: source paths + sha256 of each raw pin.
 *
 * Why a raw copy AND a rewritten copy: the raw copies are the drift anchor
 * (byte-compare against source on `--check`); the rewritten `theme-math.ts` is
 * what scripts actually import. Keeping both means the import-rewrite is a pure,
 * inspectable transform of a pinned input, not hidden magic.
 *
 * CLI:
 *   sync-vendor [--from <design-system/src>] [--check] [--json]
 *
 *   --from   path to the cve-design-system `src` dir to pin from. Defaults to
 *            the monorepo location; pass it explicitly when the layout differs.
 *   --check  do not write — compare the on-disk pins to a fresh extraction and
 *            exit 1 on any drift (the regen gate). Prints what drifted.
 *   --json   machine-readable summary.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VENDOR_DIR = dirname(fileURLToPath(import.meta.url));

const DEFAULT_SRC =
  '/home/ilbey/Projects/nvim/synapsys-cve/packages/design-system/src';

interface Args {
  from: string;
  check: boolean;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { from: DEFAULT_SRC, check: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--from' && argv[i + 1]) {
      a.from = resolve(argv[++i]);
    } else if (flag === '--check') {
      a.check = true;
    } else if (flag === '--json') {
      a.json = true;
    }
  }
  return a;
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

/** Source files pinned verbatim (the drift anchors). */
const RAW_PINS = [
  { src: 'theme/oklch.ts', dst: 'oklch.raw.ts' },
  { src: 'theme/utils.ts', dst: 'utils.raw.ts' },
  { src: 'tokens-codegen/index.ts', dst: 'tokens-codegen.raw.ts' },
] as const;

/**
 * Rewrite a raw source file's imports so it resolves standalone under `bun`,
 * WITHOUT touching any logic. Pure string transform on import lines only —
 * deterministic, so re-running on unchanged source is a no-op.
 */
function portablize(raw: string, kind: 'oklch' | 'utils' | 'codegen'): string {
  let out = raw;

  // culori → the bundled snapshot living beside theme-math.ts.
  out = out.replace(
    /from ['"]culori['"]/g,
    `from './culori.min.mjs'`,
  );

  // Cross-module TYPE imports → the local stubs. These are type-only at source,
  // so collapsing several module paths onto one stub file is sound.
  out = out.replace(
    /from ['"]\.\.\/tokens\/index\.js['"]/g,
    `from './theme-types.ts'`,
  );
  out = out.replace(
    /from ['"]\.\/types\.js['"]/g,
    `from './theme-types.ts'`,
  );

  if (kind === 'utils') {
    // `ThemeTokensSchema` is only reached by createTheme(), which the scripts
    // never call. Point it at a local stub so the module still resolves.
    out = out.replace(
      /from ['"]\.\/schemas\.js['"]/g,
      `from './theme-types.ts'`,
    );
  }

  if (kind === 'codegen') {
    // The codegen pulls the theme + utils functions from sibling modules; in the
    // vendor dir they all live in theme-math.ts. Rewrite the relative imports to
    // self-references so the concatenated module is internally consistent.
    out = out.replace(
      /from ['"]\.\.\/theme\/oklch\.js['"]/g,
      `from './theme-math.ts'`,
    );
    out = out.replace(
      /from ['"]\.\.\/theme\/types\.js['"]/g,
      `from './theme-types.ts'`,
    );
    out = out.replace(
      /from ['"]\.\.\/theme\/utils\.js['"]/g,
      `from './theme-math.ts'`,
    );
    // Drop the `./index.js` self-import inside cli (not used here) — codegen
    // index re-exports nothing problematic; leave other imports intact.
  }

  return out;
}

/**
 * The local type stubs the portable math references. These mirror the exact
 * shapes in `tokens/index.ts` + `theme/types.ts` that the math touches. They
 * are types only (erased at runtime), plus a no-op `ThemeTokensSchema` so the
 * (unused) createTheme path resolves.
 */
const THEME_TYPES_TS = `/**
 * VENDORED type stubs — generated by sync-vendor.ts. Do not edit by hand.
 *
 * Local mirror of the token shapes that theme-math.ts references, so the
 * vendored math resolves standalone (no monorepo). Types only — erased at
 * runtime. Source of truth: cve-design-system tokens/index.ts + theme/types.ts.
 */

export type ColorRamp10 = {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string;
};

export interface SpacingTokens {
  0: string; 1: string; 2: string; 3: string; 4: string; 5: string; 6: string;
  7: string; 8: string; 9: string; 10: string; 11: string; 12: string; 13: string;
}

export interface BorderRadiusTokens {
  xs: string; sm: string; md: string; lg: string; xl: string;
  '2xl': string; full: string;
}

export interface ShadowTokens {
  xs: string; sm: string; md: string; lg: string; xl: string;
  glowSm: string; glowMd: string; brand?: string;
}

export interface MotionTokens {
  easing: { standard: string; entrance: string; exit: string; emphasis?: string };
  duration: { instant: string; fast: string; base: string; slow: string; slower: string };
}

// The full ThemeTokens shape is structurally large; the math indexes into it by
// path (colors.*, typography.*, etc.). A permissive interface keeps the vendored
// math type-checking without dragging the whole token tree in.
export interface ThemeTokens {
  colors: any;
  typography: any;
  spacing: SpacingTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  motion: MotionTokens;
}

export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };
export type PartialThemeTokens = DeepPartial<ThemeTokens>;

/**
 * No-op stand-in for the package's Zod ThemeTokensSchema. Only the unused
 * createTheme() path references it; the scripts use the codegen path, which
 * never validates here. Kept so utils.ts resolves its import.
 */
export const ThemeTokensSchema = {
  parse<T>(value: T): T {
    return value;
  },
};
`;

/**
 * Build the portable theme-math.ts by concatenating the rewritten oklch + utils
 * + codegen sources. Order matters: oklch (no intra-vendor deps) → utils
 * (imports oklch types only) → codegen (imports both). Self-imports between them
 * are dropped since everything lands in one module; duplicate `import type`
 * lines pointing at the local stub are de-duplicated.
 */
function buildThemeMath(
  oklchRaw: string,
  utilsRaw: string,
  codegenRaw: string,
): string {
  const header = `/**
 * VENDORED theme math — generated by sync-vendor.ts from cve-design-system.
 * Do NOT edit by hand; re-run sync-vendor to refresh. This is the SINGLE home
 * of the color/codegen math the skill's scripts import (L9). The raw, verbatim
 * sources are pinned beside this file (*.raw.ts) as the drift anchor.
 *
 * Concatenation order: oklch → utils → tokens-codegen. Cross-module imports
 * were rewritten to local references by sync-vendor's \`portablize\`.
 */
import { parse, converter } from './culori.min.mjs';
import { ThemeTokensSchema } from './theme-types.ts';
import type {
  BorderRadiusTokens,
  ColorRamp10,
  MotionTokens,
  ShadowTokens,
  SpacingTokens,
  ThemeTokens,
  PartialThemeTokens,
} from './theme-types.ts';
`;

  // Strip every import statement from the three bodies — we hoist a single,
  // de-duplicated import block above. This avoids duplicate-symbol clashes
  // (e.g. each file importing PartialThemeTokens) and self-import cycles.
  const stripImports = (s: string): string =>
    s
      .replace(/^import\s+(?:type\s+)?\{[\s\S]*?\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^import\s+(?:type\s+)?[\w*\s,{}]+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');

  const oklchBody = stripImports(oklchRaw);
  const utilsBody = stripImports(utilsRaw);
  const codegenBody = stripImports(codegenRaw);

  return [
    header,
    '\n// ─────────── oklch.ts ───────────\n',
    oklchBody,
    '\n// ─────────── utils.ts ───────────\n',
    utilsBody,
    '\n// ─────────── tokens-codegen/index.ts ───────────\n',
    codegenBody,
    '',
  ].join('\n');
}

/** Extract the closed look-vocab token set from preset.css. */
function extractLookVocab(presetCss: string): string[] {
  const tokens = new Set<string>();
  const re = /\[data-cve-look~="([a-z]+)"\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(presetCss)) !== null) {
    tokens.add(m[1]);
  }
  return [...tokens].sort();
}

/** Extract the full @theme custom-property name list from preset.css. */
function extractThemeVars(presetCss: string): string[] {
  const vars = new Set<string>();
  const re = /^\s*(--[a-z0-9-]+)\s*:/gim;
  let m: RegExpExecArray | null;
  while ((m = re.exec(presetCss)) !== null) {
    vars.add(m[1]);
  }
  return [...vars].sort();
}

interface VendorArtifact {
  name: string;
  content: string;
  /** raw pins compare byte-for-byte; derived files compare by content too. */
}

function extractAll(srcDir: string): VendorArtifact[] {
  const artifacts: VendorArtifact[] = [];

  const rawContents: Record<string, string> = {};
  for (const pin of RAW_PINS) {
    const p = join(srcDir, pin.src);
    if (!existsSync(p)) {
      throw new Error(`Source not found: ${p} (pass --from <design-system/src>)`);
    }
    const content = readFileSync(p, 'utf8');
    rawContents[pin.dst] = content;
    artifacts.push({ name: pin.dst, content });
  }

  const themeMath = buildThemeMath(
    portablize(rawContents['oklch.raw.ts'], 'oklch'),
    portablize(rawContents['utils.raw.ts'], 'utils'),
    portablize(rawContents['tokens-codegen.raw.ts'], 'codegen'),
  );
  artifacts.push({ name: 'theme-math.ts', content: themeMath });
  artifacts.push({ name: 'theme-types.ts', content: THEME_TYPES_TS });

  // The bundled, self-contained culori snapshot.
  const culoriSrc = join(
    srcDir,
    '../node_modules/culori/bundled/culori.min.mjs',
  );
  const culoriAlt = join(
    srcDir,
    '../../../node_modules/culori/bundled/culori.min.mjs',
  );
  const culoriPath = existsSync(culoriSrc)
    ? culoriSrc
    : existsSync(culoriAlt)
      ? culoriAlt
      : null;
  if (!culoriPath) {
    throw new Error(
      `culori bundled snapshot not found near ${srcDir} — looked at ${culoriSrc} and ${culoriAlt}`,
    );
  }
  artifacts.push({
    name: 'culori.min.mjs',
    content: readFileSync(culoriPath, 'utf8'),
  });

  // preset.css derivatives: look vocab + @theme var list.
  const presetPath = join(srcDir, 'preset.css');
  if (!existsSync(presetPath)) {
    throw new Error(`preset.css not found at ${presetPath}`);
  }
  const presetCss = readFileSync(presetPath, 'utf8');
  artifacts.push({
    name: 'look-vocab.json',
    content: JSON.stringify(
      {
        _source: 'cve-design-system preset.css — data-cve-look escape-hatch',
        _note: 'Closed vocabulary. Any look token outside this set is a violation.',
        vocab: extractLookVocab(presetCss),
      },
      null,
      2,
    ) + '\n',
  });
  artifacts.push({
    name: 'theme-vars.json',
    content: JSON.stringify(
      {
        _source: 'cve-design-system preset.css — @theme + mode blocks',
        _note: 'Every custom property the preset declares. audit-token-refs resolves var(--…) against this set.',
        vars: extractThemeVars(presetCss),
      },
      null,
      2,
    ) + '\n',
  });

  return artifacts;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  let artifacts: VendorArtifact[];
  try {
    artifacts = extractAll(args.from);
  } catch (err) {
    console.error(`✗ sync-vendor: ${(err as Error).message}`);
    process.exit(1);
  }

  if (args.check) {
    const drifted: string[] = [];
    for (const art of artifacts) {
      const p = join(VENDOR_DIR, art.name);
      const onDisk = existsSync(p) ? readFileSync(p, 'utf8') : null;
      if (onDisk === null || sha256(onDisk) !== sha256(art.content)) {
        drifted.push(art.name);
      }
    }
    if (args.json) {
      console.log(JSON.stringify({ ok: drifted.length === 0, drifted }, null, 2));
    } else if (drifted.length === 0) {
      console.log('✓ vendor snapshot in sync with source');
    } else {
      console.error(`✗ vendor drift in: ${drifted.join(', ')} — re-run sync-vendor without --check`);
    }
    process.exit(drifted.length === 0 ? 0 : 1);
  }

  mkdirSync(VENDOR_DIR, { recursive: true });
  const written: Array<{ name: string; sha256: string; bytes: number }> = [];
  for (const art of artifacts) {
    writeFileSync(join(VENDOR_DIR, art.name), art.content);
    written.push({
      name: art.name,
      sha256: sha256(art.content),
      bytes: Buffer.byteLength(art.content),
    });
  }

  const provenance = {
    pinnedAt: new Date().toISOString(),
    from: args.from,
    rawPins: RAW_PINS.map((p) => p.src),
    artifacts: written,
  };
  writeFileSync(
    join(VENDOR_DIR, 'VENDOR.json'),
    JSON.stringify(provenance, null, 2) + '\n',
  );

  if (args.json) {
    console.log(JSON.stringify(provenance, null, 2));
  } else {
    console.log(`✓ pinned ${written.length} artifacts into ${VENDOR_DIR}`);
    for (const w of written) {
      console.log(`  ${w.name.padEnd(24)} ${w.bytes} bytes`);
    }
  }
}

main();
