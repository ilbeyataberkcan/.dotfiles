#!/usr/bin/env bun
/**
 * scaffold-seed — turn a digest into a complete, typed `ThemeSeed` literal.
 *
 * Why this is a script, not hand-authoring: the seed contract has 13 slot-
 * groups (colors, fonts, geometry, elevation, motion, scale, …), and the whole
 * point of the digest→seed step is that EVERY group is present and accounted
 * for — a present-but-empty group documents "the reference says nothing here, so
 * the package default stands" rather than silently dropping it (L1: a theme is
 * not a palette; L11: the contract exposes every slot). Emitting the literal by
 * hand reliably forgets a group. Generating it guarantees coverage and pins each
 * value to the digest line it came from, so review is a diff against the source.
 *
 * Determinism: the same digest.json always yields the same literal — fixed slot
 * order, fixed comments, fixed fallbacks. The ONLY variability is the digest's
 * own extracted values (the nudge-knob: what the reference actually specifies).
 *
 * CLI:
 *   scaffold-seed --out <theme-seed.ts> [--from <digest.json>] [--name <ident>]
 *
 *   --out <path>     where to write the generated seed module.
 *   --from <path>    the digest.json (see shape below). If omitted, emits a
 *                    fully-commented skeleton with every slot stubbed — the
 *                    starting point an operator fills from the reference.
 *   --name <ident>   the exported const name (default: `themeSeed`).
 *
 * digest.json shape (all fields optional — absent → the slot is emitted as a
 * commented placeholder so the contract stays visible):
 *   {
 *     "meta":     { "source": "TMMAF design system", "defaultMode": "light" },
 *     "primary":  "#070708",
 *     "accents":  { "primary": "#d81e0b", "secondary": "...", "tertiary": "..." },
 *     "status":   { "success": "...", "warning": "...", "error": "...", "info": "..." },
 *     "fonts":    { "sans": {"family":"Inter"}, "mono": {...}, "display": {...} },
 *     "borderRadius": { "md": "8px", ... },
 *     "shadows":  { "brand": "0 0 24px ...", ... },
 *     "motion":   { "easing": { "emphasis": "..." }, "duration": { ... } },
 *     "spacing":  { "5": "16px", ... },
 *     "typography": { "scale": {...}, "weights": {...}, "tracking": {...} }
 *   }
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface Digest {
  meta?: { source?: string; defaultMode?: 'dark' | 'light' };
  primary?: string;
  accents?: { primary?: string; secondary?: string; tertiary?: string };
  status?: Record<string, string>;
  fonts?: Record<string, { family?: string; source?: string; weights?: number[] }>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
  motion?: { easing?: Record<string, string>; duration?: Record<string, string> };
  spacing?: Record<string, string>;
  typography?: {
    scale?: Record<string, string>;
    weights?: Record<string, string>;
    tracking?: Record<string, string>;
  };
}

interface Args {
  out: string | null;
  from: string | null;
  name: string;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { out: null, from: null, name: 'themeSeed' };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--out' && argv[i + 1]) a.out = argv[++i];
    else if (flag === '--from' && argv[i + 1]) a.from = argv[++i];
    else if (flag === '--name' && argv[i + 1]) a.name = argv[++i];
  }
  return a;
}

const q = (s: string): string => `'${s.replace(/'/g, "\\'")}'`;

/** Emit a nested object literal of string values, or a commented stub if empty. */
function objectBlock(
  obj: Record<string, string> | undefined,
  indent: string,
): { line: string; commented: boolean } {
  const entries = Object.entries(obj ?? {}).filter(([, v]) => v != null);
  if (entries.length === 0) {
    return { line: '', commented: true };
  }
  const body = entries
    .map(([k, v]) => `${indent}  ${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : q(k)}: ${q(v)},`)
    .join('\n');
  return { line: `{\n${body}\n${indent}}`, commented: false };
}

/**
 * Render one top-level slot-group. When the digest supplies values, the slot is
 * active; when it doesn't, the slot is emitted commented so the literal still
 * documents every group of the contract (L11) and an operator sees exactly what
 * the reference left to the package default.
 */
function slot(
  key: string,
  obj: Record<string, string> | undefined,
  sourceNote: string,
): string {
  const { line, commented } = objectBlock(obj, '  ');
  if (commented) {
    return `  // ${key}: { … },  // ${sourceNote} — reference specifies nothing; package default stands`;
  }
  return `  ${key}: ${line},  // ${sourceNote}`;
}

export function scaffold(digest: Digest, name: string): string {
  const source = digest.meta?.source ?? '<unknown reference>';
  const defaultMode = digest.meta?.defaultMode;

  const lines: string[] = [];
  lines.push(`/**`);
  lines.push(` * ThemeSeed — scaffolded by scaffold-seed.ts from the digest of ${source}.`);
  lines.push(` *`);
  lines.push(` * Every slot-group of the seed contract is represented: active groups carry`);
  lines.push(` * the reference's extracted values; commented groups mark where the reference`);
  lines.push(` * says nothing and the package default stands. Feed this to emit-theme-css to`);
  lines.push(` * produce the three-block theme CSS.`);
  lines.push(` */`);
  lines.push(`import type { ThemeSeed } from '@synapsys-integrated/cve-design-system';`);
  lines.push(``);
  lines.push(`export const ${name}: ThemeSeed = {`);

  // 1 — primary (required by the contract).
  lines.push(
    `  primary: ${q(digest.primary ?? '#070708')},  // ${source} · base/canvas anchor (drives the neutral hue)`,
  );

  // 2 — accents map (primary required).
  const acc = digest.accents ?? {};
  const accLines: string[] = [`  accents: {`];
  accLines.push(`    primary: ${q(acc.primary ?? '#4845ff')},  // ${source} · signal accent`);
  if (acc.secondary) accLines.push(`    secondary: ${q(acc.secondary)},  // ${source} · secondary accent`);
  else accLines.push(`    // secondary: '…',  // ${source} — none; omit to skip the slot`);
  if (acc.tertiary) accLines.push(`    tertiary: ${q(acc.tertiary)},  // ${source} · tertiary accent`);
  else accLines.push(`    // tertiary: '…',  // ${source} — none; omit to skip the slot`);
  accLines.push(`  },`);
  lines.push(...accLines);

  // 3 — status slots.
  lines.push(slot('status', digest.status, `${source} · semantic status anchors`));

  // 4 — fonts (nested family objects).
  const fonts = digest.fonts ?? {};
  const fontEntries = Object.entries(fonts).filter(([, v]) => v && v.family);
  if (fontEntries.length > 0) {
    lines.push(`  fonts: {`);
    for (const [face, def] of fontEntries) {
      const parts = [`family: ${q(def.family!)}`];
      if (def.source) parts.push(`source: ${q(def.source)}`);
      if (def.weights) parts.push(`weights: [${def.weights.join(', ')}]`);
      lines.push(`    ${face}: { ${parts.join(', ')} },  // ${source}`);
    }
    lines.push(`  },`);
  } else {
    lines.push(`  // fonts: { sans: { family: '…' } },  // ${source} — reference specifies nothing`);
  }

  // 5 — borderRadius (geometry).
  lines.push(slot('borderRadius', digest.borderRadius, `${source} · geometry / corner radius`));

  // 6 — shadows (elevation).
  lines.push(slot('shadows', digest.shadows, `${source} · elevation ramp + signature glow`));

  // 7 — motion (easing + duration; nested).
  const motion = digest.motion ?? {};
  const easing = objectBlock(motion.easing, '    ');
  const duration = objectBlock(motion.duration, '    ');
  if (!easing.commented || !duration.commented) {
    lines.push(`  motion: {`);
    if (!easing.commented) lines.push(`    easing: ${easing.line},  // ${source} · easing curves`);
    if (!duration.commented) lines.push(`    duration: ${duration.line},  // ${source} · duration ramp`);
    lines.push(`  },`);
  } else {
    lines.push(`  // motion: { easing: { emphasis: '…' } },  // ${source} — reference specifies nothing`);
  }

  // 8 — spacing.
  lines.push(slot('spacing', digest.spacing, `${source} · spacing scale`));

  // 9 — typography (scale/weights/tracking; nested).
  const typo = digest.typography ?? {};
  const scale = objectBlock(typo.scale, '    ');
  const weights = objectBlock(typo.weights, '    ');
  const tracking = objectBlock(typo.tracking, '    ');
  if (!scale.commented || !weights.commented || !tracking.commented) {
    lines.push(`  typography: {`);
    if (!scale.commented) lines.push(`    scale: ${scale.line},  // ${source} · type scale`);
    if (!weights.commented) lines.push(`    weights: ${weights.line},  // ${source} · named weights`);
    if (!tracking.commented) lines.push(`    tracking: ${tracking.line},  // ${source} · letter-spacing`);
    lines.push(`  },`);
  } else {
    lines.push(`  // typography: { scale: { … } },  // ${source} — reference specifies nothing`);
  }

  // 10 — defaultMode.
  if (defaultMode) {
    lines.push(`  defaultMode: ${q(defaultMode)},  // ${source} · light-first vs dark-first`);
  } else {
    lines.push(`  // defaultMode: 'light',  // ${source} — unset → package default ('dark')`);
  }

  lines.push(`};`);
  lines.push(``);
  return lines.join('\n');
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!args.out) {
    console.error('Usage: scaffold-seed --out <theme-seed.ts> [--from <digest.json>] [--name <ident>]');
    process.exit(1);
  }

  let digest: Digest = {};
  if (args.from) {
    const p = resolve(process.cwd(), args.from);
    if (!existsSync(p)) {
      console.error(`✗ digest not found: ${p}`);
      process.exit(1);
    }
    try {
      digest = JSON.parse(readFileSync(p, 'utf8')) as Digest;
    } catch (err) {
      console.error(`✗ invalid digest JSON: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  const ts = scaffold(digest, args.name);
  const outPath = resolve(process.cwd(), args.out);
  writeFileSync(outPath, ts);
  console.log(`✓ scaffolded ${args.out} (${ts.split('\n').length} lines)`);
}

if (import.meta.main) {
  main();
}
