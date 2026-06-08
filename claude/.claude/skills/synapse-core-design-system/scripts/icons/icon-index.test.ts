#!/usr/bin/env bun
/**
 * icon-index tests — drive the CLI against a tiny on-disk fixture and assert the
 * three diff classes (unmapped / dead / missing), the --check exit gate, the
 * --write tree-shaken codegen, and --add.
 *
 * The fixture is written into a fresh temp dir each run so the test is hermetic
 * and never touches the real registry.
 */

import { afterAll, beforeAll, expect, test } from 'bun:test';
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(import.meta.dir, 'icon-index.ts');
let root = '';

// A tiny registry: `check` is mapped+used, `dead-glyph` is mapped but never used.
const FIXTURE_REGISTRY = `import type { IconType } from 'react-icons';
import { LuCheck, LuMail, LuCircleHelp } from 'react-icons/lu';

export const iconRegistry = {
  check: LuCheck,
  'dead-glyph': LuMail,
} satisfies Record<string, IconType>;

export const FALLBACK_ICON: IconType = LuCircleHelp;
export type IconName = keyof typeof iconRegistry;
export function resolveIcon(name: string): IconType {
  return (iconRegistry as Record<string, IconType>)[name] ?? FALLBACK_ICON;
}
`;

// Consumer src: uses generic name "check" (mapped) and "rocket" (UNMAPPED), and
// imports LuZap directly (MISSING from registry). "dead-glyph" is referenced by
// neither name nor glyph -> DEAD.
const FIXTURE_COMPONENT = `import { LuZap } from 'react-icons/lu';
import { Icon } from './Icon';

export function Demo() {
  return (
    <div>
      <Icon name="check" />
      <Icon icon="rocket" />
      <LuZap />
    </div>
  );
}
`;

async function run(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(['bun', SCRIPT, ...args], { stdout: 'pipe', stderr: 'pipe' });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const code = await proc.exited;
  return { code, stdout, stderr };
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'icon-index-'));
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(join(root, 'registry.ts'), FIXTURE_REGISTRY);
  await writeFile(join(root, 'src', 'Demo.tsx'), FIXTURE_COMPONENT);
});

afterAll(async () => {
  if (root) await rm(root, { recursive: true, force: true });
});

test('scan --json classifies unmapped, dead, and missing', async () => {
  const { code, stdout } = await run([
    '--scan', join(root, 'src'),
    '--registry', join(root, 'registry.ts'),
    '--json',
  ]);
  expect(code).toBe(0); // no --check -> always exit 0
  const report = JSON.parse(stdout);
  expect(report.unmapped).toEqual(['rocket']);
  expect(report.dead).toEqual(['dead-glyph']);
  expect(report.missing).toEqual(['LuZap']);
  expect(report.mappedNames).toBe(2);
});

test('--check exits 1 when the scan finds gaps', async () => {
  const { code } = await run([
    '--scan', join(root, 'src'),
    '--registry', join(root, 'registry.ts'),
    '--check',
  ]);
  expect(code).toBe(1);
});

test('--check exits 0 on a clean tree', async () => {
  const clean = await mkdtemp(join(tmpdir(), 'icon-index-clean-'));
  await mkdir(join(clean, 'src'), { recursive: true });
  await writeFile(join(clean, 'registry.ts'), FIXTURE_REGISTRY);
  // Only the mapped name + the dead-glyph's name and the fallback in play.
  await writeFile(
    join(clean, 'src', 'Ok.tsx'),
    `import { Icon } from './Icon';\nexport const A = () => <><Icon name="check" /><Icon name="dead-glyph" /></>;\n`,
  );
  const { code } = await run([
    '--scan', join(clean, 'src'),
    '--registry', join(clean, 'registry.ts'),
    '--check',
  ]);
  expect(code).toBe(0);
  await rm(clean, { recursive: true, force: true });
});

test('--write regenerates a tree-shaken, satisfies-checked index', async () => {
  const out = join(root, 'generated.ts');
  const { code } = await run([
    '--registry', join(root, 'registry.ts'),
    '--write', out,
  ]);
  expect(code).toBe(0);
  const text = await readFile(out, 'utf8');
  // Per-glyph named imports only for glyphs actually in the registry + fallback.
  expect(text).toContain("from 'react-icons/lu'");
  expect(text).toContain('LuCheck');
  expect(text).toContain('LuMail');
  expect(text).toContain('LuCircleHelp'); // fallback carried through
  expect(text).not.toContain('LuZap'); // untracked glyph never imported
  expect(text).toContain('satisfies Record<string, IconType>');
  // kebab keys get quoted, bare keys stay bare.
  expect(text).toContain("'dead-glyph': LuMail,");
  expect(text).toContain('check: LuCheck,');
});

test('--write + --check is a staleness gate (exit 1, no mutation)', async () => {
  const stale = join(root, 'stale.ts');
  await writeFile(stale, '// out of date\n');
  const { code } = await run([
    '--registry', join(root, 'registry.ts'),
    '--write', stale,
    '--check',
  ]);
  expect(code).toBe(1);
  expect(await readFile(stale, 'utf8')).toBe('// out of date\n'); // untouched
});

test('--add folds a new mapping into the written index', async () => {
  const out = join(root, 'added.ts');
  const { code } = await run([
    '--registry', join(root, 'registry.ts'),
    '--add', 'rocket=LuRocket',
    '--write', out,
  ]);
  expect(code).toBe(0);
  const text = await readFile(out, 'utf8');
  expect(text).toContain('rocket: LuRocket,');
  expect(text).toContain('LuRocket');
});

test('--add rejects a non-Lucide glyph', async () => {
  const { code, stderr } = await run([
    '--registry', join(root, 'registry.ts'),
    '--add', 'rocket=NotAGlyph',
    '--write', join(root, 'never.ts'),
  ]);
  expect(code).toBe(2);
  expect(stderr).toContain('not a Lucide glyph');
});
