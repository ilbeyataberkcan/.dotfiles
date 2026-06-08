#!/usr/bin/env bun
/**
 * icon-index — scan a target src tree for Lucide icon usage, diff it against an
 * owned icon registry, and report/repair the gaps.
 *
 * The registry (mirrors components/src/icons/index.ts) is the single source of
 * truth: generic name -> Lucide glyph, with per-glyph named imports kept so the
 * bundler tree-shakes to only the referenced set. This script keeps that index
 * honest as the consuming code changes:
 *
 *   unmapped  a generic name is used in JSX (<Icon name="x"/>, icon="x") but the
 *             registry has no row for it -> it would silently fall back to the
 *             help glyph (L3: components must reach real primitives, not a stub).
 *   dead      a registry row exists but its glyph is referenced nowhere -> a stale
 *             entry inflating the tree-shake set with an unused import.
 *   missing   a Lucide glyph is imported directly from react-icons/lu somewhere
 *             but the registry never tracks it -> the index isn't the source of
 *             truth it claims to be.
 *
 * Reuse-first: the registry is PARSED, never imported, so the script carries no
 * react-icons dependency and runs anywhere Bun does. Target paths arrive as args
 * at runtime; nothing about a specific repo is hardcoded.
 *
 * CLI
 *   icon-index --scan <src> --registry <index.ts> [--json]
 *   icon-index --scan <src> --registry <index.ts> --check        # exit 1 on any gap or stale write
 *   icon-index --scan <src> --registry <index.ts> --write <out>  # regenerate a tree-shaken index
 *   icon-index --registry <index.ts> --add name=LuGlyph --write <out>
 */

import { Glob } from 'bun';

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------

interface Args {
  scan?: string;
  registry?: string;
  write?: string;
  check: boolean;
  json: boolean;
  add: Array<{ name: string; glyph: string }>;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { check: false, json: false, add: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--scan':
        out.scan = argv[++i];
        break;
      case '--registry':
        out.registry = argv[++i];
        break;
      case '--write':
        out.write = argv[++i];
        break;
      case '--check':
        out.check = true;
        break;
      case '--json':
        out.json = true;
        break;
      case '--add': {
        const spec = argv[++i] ?? '';
        const eq = spec.indexOf('=');
        if (eq < 0) {
          throw new Error(`--add expects name=LuGlyph, got "${spec}"`);
        }
        out.add.push({ name: spec.slice(0, eq), glyph: spec.slice(eq + 1) });
        break;
      }
      default:
        throw new Error(`unknown arg: ${a}`);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// registry parsing (parse, don't import — keeps the script react-icons-free)
// ---------------------------------------------------------------------------

interface Registry {
  /** generic name -> glyph identifier (e.g. "alert-triangle" -> "LuTriangleAlert") */
  entries: Map<string, string>;
  /** the FALLBACK_ICON glyph, if declared */
  fallback?: string;
}

const GLYPH_RE = /^Lu[A-Z][A-Za-z0-9]*$/;

/**
 * Pull `name: Glyph` rows out of the `iconRegistry` object literal and the
 * `FALLBACK_ICON` declaration. Tolerant of quoted ('alert-triangle') and bare
 * (box) keys; ignores comments and the `satisfies` tail.
 */
function parseRegistry(source: string): Registry {
  const entries = new Map<string, string>();

  const objMatch = source.match(/iconRegistry\s*=\s*\{([\s\S]*?)\}\s*satisfies/);
  const body = objMatch ? objMatch[1] : '';
  const rowRe = /(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:\s*(Lu[A-Za-z0-9]+)/g;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(body)) !== null) {
    const name = m[1] ?? m[2] ?? m[3];
    const glyph = m[4];
    if (name) entries.set(name, glyph);
  }

  const fb = source.match(/FALLBACK_ICON[^=]*=\s*(Lu[A-Za-z0-9]+)/);
  return { entries, fallback: fb ? fb[1] : undefined };
}

// ---------------------------------------------------------------------------
// usage scanning
// ---------------------------------------------------------------------------

interface Usage {
  /** generic names referenced via name=/icon= props */
  names: Set<string>;
  /** Lucide glyphs imported directly from react-icons/lu */
  directGlyphs: Set<string>;
}

const SCAN_EXTS = ['ts', 'tsx', 'js', 'jsx'];

/**
 * Read every source file under `src` and collect (a) generic icon names passed
 * to `name=`/`icon=` props and (b) `Lu*` identifiers imported from
 * `react-icons/lu`. The registry file itself is skipped so its own imports don't
 * masquerade as usage.
 */
async function scanUsage(src: string, registryPath?: string): Promise<Usage> {
  const names = new Set<string>();
  const directGlyphs = new Set<string>();

  // name="x" / name='x' / icon="x" — generic lowercase/kebab/camel identifiers.
  const namePropRe = /(?:name|icon)\s*=\s*['"]([a-z][A-Za-z0-9-]*)['"]/g;
  // import { LuFoo, LuBar } from 'react-icons/lu'
  const importRe = /import\s*\{([^}]*)\}\s*from\s*['"]react-icons\/lu['"]/g;

  const registryAbs = registryPath ? resolvePath(registryPath) : undefined;

  for (const ext of SCAN_EXTS) {
    const glob = new Glob(`**/*.${ext}`);
    for await (const rel of glob.scan({ cwd: src, dot: false })) {
      const abs = `${src.replace(/\/$/, '')}/${rel}`;
      if (registryAbs && resolvePath(abs) === registryAbs) continue;
      if (rel.includes('node_modules/')) continue;
      const text = await Bun.file(abs).text();

      let nm: RegExpExecArray | null;
      while ((nm = namePropRe.exec(text)) !== null) names.add(nm[1]);

      let im: RegExpExecArray | null;
      while ((im = importRe.exec(text)) !== null) {
        for (const raw of im[1].split(',')) {
          const id = raw.trim().split(/\s+as\s+/)[0].trim();
          if (GLYPH_RE.test(id)) directGlyphs.add(id);
        }
      }
    }
  }

  return { names, directGlyphs };
}

function resolvePath(p: string): string {
  return p.startsWith('/') ? p : `${process.cwd()}/${p}`;
}

// ---------------------------------------------------------------------------
// diff
// ---------------------------------------------------------------------------

interface Report {
  unmapped: string[]; // generic names used but absent from the registry
  dead: string[]; // registry names whose glyph is referenced nowhere
  missing: string[]; // Lu* glyphs imported directly but untracked by the registry
  mappedNames: number;
  glyphs: number;
}

function diff(registry: Registry, usage: Usage): Report {
  const registryGlyphs = new Set(registry.entries.values());

  const unmapped = [...usage.names].filter((n) => !registry.entries.has(n)).sort();

  // A registry row is live if its NAME is used as a prop, or its GLYPH is
  // imported directly. The fallback glyph is always live (resolveIcon default).
  const liveGlyphs = new Set(usage.directGlyphs);
  for (const [name, glyph] of registry.entries) {
    if (usage.names.has(name)) liveGlyphs.add(glyph);
  }
  if (registry.fallback) liveGlyphs.add(registry.fallback);

  const dead = [...registry.entries.entries()]
    .filter(([name, glyph]) => !usage.names.has(name) && !liveGlyphs.has(glyph))
    .map(([name]) => name)
    .sort();

  const missing = [...usage.directGlyphs].filter((g) => !registryGlyphs.has(g)).sort();

  return {
    unmapped,
    dead,
    missing,
    mappedNames: registry.entries.size,
    glyphs: registryGlyphs.size,
  };
}

// ---------------------------------------------------------------------------
// codegen (regenerate a tree-shaken index)
// ---------------------------------------------------------------------------

/**
 * Emit an icon-index.ts mirroring the components convention: per-glyph named
 * imports (tree-shakeable), an `iconRegistry` object `satisfies`-checked against
 * `Record<string, IconType>`, a `FALLBACK_ICON`, the `IconName` union, and
 * `resolveIcon`. Names are sorted for a stable, diff-friendly output.
 */
function generateIndex(registry: Registry): string {
  const fallback = registry.fallback ?? 'LuCircleHelp';
  const usedGlyphs = new Set<string>([...registry.entries.values(), fallback]);
  const imports = [...usedGlyphs].sort().join(',\n  ');

  const rows = [...registry.entries.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, glyph]) => {
      const key = /^[a-z][\w]*$/i.test(name) && !name.includes('-') ? name : `'${name}'`;
      return `  ${key}: ${glyph},`;
    })
    .join('\n');

  return `/**
 * Icon index — the single owned source of truth for icon name -> component.
 *
 * Generated by synapse-core-design-system icon-index. Per-icon named imports
 * keep the set tree-shakeable: only referenced glyphs ship. Regenerate with
 * \`icon-index --registry <this> --write <this>\` after editing usage or adding
 * a glyph via \`--add name=LuGlyph\`.
 */

import type { IconType } from 'react-icons';
import {
  ${imports},
} from 'react-icons/lu';

export const iconRegistry = {
${rows}
} satisfies Record<string, IconType>;

/** Fallback glyph for an unrecognized name. */
export const FALLBACK_ICON: IconType = ${fallback};

/** Typed union of every registered icon name (host-reachable contract). */
export type IconName = keyof typeof iconRegistry;

/** Resolve a name to its component, falling back to the help glyph. */
export function resolveIcon(name: string): IconType {
  return (iconRegistry as Record<string, IconType>)[name] ?? FALLBACK_ICON;
}
`;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const args = parseArgs(Bun.argv.slice(2));

  if (!args.registry) {
    process.stderr.write('icon-index: --registry <index.ts> is required\n');
    return 2;
  }

  const registrySource = await Bun.file(args.registry).text();
  const registry = parseRegistry(registrySource);

  // --add folds new rows into the registry before any diff/write.
  for (const { name, glyph } of args.add) {
    if (!GLYPH_RE.test(glyph)) {
      process.stderr.write(`icon-index: "${glyph}" is not a Lucide glyph (expected Lu<Name>)\n`);
      return 2;
    }
    registry.entries.set(name, glyph);
  }

  // --write regenerates the tree-shaken index from the (possibly --add'd) registry.
  if (args.write) {
    const next = generateIndex(registry);
    const target = args.write;
    const prior = (await Bun.file(target).exists()) ? await Bun.file(target).text() : '';
    const stale = prior.trim() !== next.trim();

    if (args.check) {
      // In --check mode --write is a staleness gate: never mutate, just verdict.
      if (stale) {
        process.stderr.write(`icon-index: ${target} is stale — re-run --write to regenerate\n`);
        return 1;
      }
    } else {
      await Bun.write(target, next);
    }
  }

  // --scan diffs usage against the registry.
  if (args.scan) {
    const usage = await scanUsage(args.scan, args.registry);
    const report = diff(registry, usage);

    if (args.json) {
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    } else {
      const lines = [
        `icon-index scan — ${args.scan}`,
        `  registry: ${report.mappedNames} names -> ${report.glyphs} glyphs`,
        `  unmapped (used, no registry row): ${report.unmapped.length}${report.unmapped.length ? '  ' + report.unmapped.join(', ') : ''}`,
        `  dead     (registry row, unused):  ${report.dead.length}${report.dead.length ? '  ' + report.dead.join(', ') : ''}`,
        `  missing  (Lu* imported, untracked): ${report.missing.length}${report.missing.length ? '  ' + report.missing.join(', ') : ''}`,
      ];
      process.stdout.write(lines.join('\n') + '\n');
    }

    const clean = report.unmapped.length === 0 && report.dead.length === 0 && report.missing.length === 0;
    if (args.check && !clean) return 1;
  }

  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`icon-index: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(2);
  });
