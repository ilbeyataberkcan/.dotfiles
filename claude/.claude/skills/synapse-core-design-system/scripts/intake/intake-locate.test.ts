#!/usr/bin/env bun
/**
 * intake-locate test — hermetic, against a throwaway temp fixture tree.
 *
 * Builds a tiny two-half repo in a tmpdir (a HOST app + a sibling design-system
 * PACKAGE source + a reference image dir) and asserts the locator finds every
 * ground-truth artifact the pipeline needs, applies its preference heuristics
 * (authored `src/` over `dist/`; densest image dir; components registry over
 * core's), and FAILS G0 when the emitted theme CSS is absent (the L7 anchor that
 * gates the diagnose stage). Never touches a real repo.
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { locate, parseArgs, type IntakeManifest } from './intake-locate.ts';

let root: string;

/** Write a file, creating parent dirs. */
function put(rel: string, body = '') {
  const abs = join(root, rel);
  mkdirSync(abs.slice(0, abs.lastIndexOf('/')), { recursive: true });
  writeFileSync(abs, body);
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'intake-locate-fixture-'));

  // --- HOST half: the app that consumes the design system ---
  put('host/app/theme.generated.css', ':root { --color-neutral-500: oklch(0.48 0.034 106); }');
  put('host/app/globals.css', "@import 'tailwindcss';\n@import './theme.generated.css';");
  put('host/lib/theme-seed.ts', 'export const themeSeed = { primary: "#070708" };');
  put('host/app/showcase/page.tsx', 'export default function Showcase() { return null; }');

  // --- PACKAGE half: the design-system source ---
  put('pkg/design-system/src/preset.css', '@theme { --radius-md: 8px; }');
  put('pkg/design-system/src/tokens-codegen/cli.ts', '// codegen entry');
  put('pkg/components/src/registries/index.ts', 'export const registry = {};');
  put('pkg/core/src/registries/index.ts', 'export const coreRegistry = {};'); // decoy: prefer components'
  put('pkg/components/src/icons/index.ts', 'export const iconRegistry = {};');

  // dist copies that MUST be skipped in favour of authored src.
  put('pkg/design-system/dist/preset.css', '/* built */');
  put('pkg/components/dist/registries/index.js', '/* built */');

  // --- REFERENCE half: mockup images, with a sparse decoy dir + a dense real one ---
  put('docs/ds/uploads/hero.png');
  put('docs/ds/ui_kits/registration.png');
  put('docs/ds/ui_kits/dashboard.png');
  put('docs/ds/ui_kits/profile.png'); // ui_kits is the densest → should win
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('parseArgs', () => {
  test('--root required; flags collect package/host/reference/out', () => {
    const a = parseArgs(['--root', '/r', '--package', '/p', '--host', '/h', '--reference', '/ref', '--out', '/o.json']);
    expect(a.root).toBe('/r');
    expect(a.package).toBe('/p');
    expect(a.host).toBe('/h');
    expect(a.reference).toBe('/ref');
    expect(a.out).toBe('/o.json');
  });

  test('missing --root throws (cannot scan nothing)', () => {
    expect(() => parseArgs(['--package', '/p'])).toThrow('--root is required');
  });
});

describe('locate — full discovery against the fixture tree', () => {
  let m: IntakeManifest;
  beforeAll(() => {
    m = locate({ root });
  });

  test('G0 met: the emitted theme CSS (L7 anchor) is found in the host', () => {
    expect(m.ok).toBe(true);
    expect(m.emittedThemeCss.path).toBe(join(root, 'host/app/theme.generated.css'));
  });

  test('host root inferred from the emitted CSS (parent of app/)', () => {
    expect(m.hostRoot).toBe(join(root, 'host'));
  });

  test('package root inferred from the codegen CLI location', () => {
    expect(m.packageRoot).toBe(join(root, 'pkg/design-system'));
  });

  test('locates the seed, codegen, globals, showcase', () => {
    expect(m.themeSeed.path).toBe(join(root, 'host/lib/theme-seed.ts'));
    expect(m.codegenCli.path).toBe(join(root, 'pkg/design-system/src/tokens-codegen/cli.ts'));
    expect(m.hostGlobals.path).toBe(join(root, 'host/app/globals.css'));
    expect(m.showcase.path).toBe(join(root, 'host/app/showcase/page.tsx'));
  });

  test('prefers the components registry over core/ (renderable surface)', () => {
    expect(m.registry.path).toBe(join(root, 'pkg/components/src/registries/index.ts'));
  });

  test('locates the icons index', () => {
    expect(m.iconsIndex.path).toBe(join(root, 'pkg/components/src/icons/index.ts'));
  });

  test('preset.css resolves to authored src, never the dist copy (SKIP works)', () => {
    expect(m.presetCss.path).toBe(join(root, 'pkg/design-system/src/preset.css'));
    expect(m.presetCss.path).not.toContain('/dist/');
  });

  test('reference assets resolve to the densest image directory', () => {
    expect(m.referenceAssets.path).toBe(join(root, 'docs/ds/ui_kits'));
    expect(m.referenceAssets.via).toContain('3 files');
  });
});

describe('hints scope the search', () => {
  test('--host / --package hints pin the roots directly', () => {
    const m = locate({ root, host: 'host', package: 'pkg/design-system' });
    expect(m.hostRoot).toBe(join(root, 'host'));
    expect(m.packageRoot).toBe(join(root, 'pkg/design-system'));
    expect(m.emittedThemeCss.path).toBe(join(root, 'host/app/theme.generated.css'));
  });

  test('--reference narrows asset search to the given dir', () => {
    const m = locate({ root, reference: 'docs/ds/uploads' });
    expect(m.referenceAssets.path).toBe(join(root, 'docs/ds/uploads'));
  });
});

describe('G0 gate — emitted CSS is the hard dependency', () => {
  test('a tree with NO emitted theme CSS fails G0 (ok=false), other artifacts still reported', () => {
    const bare = mkdtempSync(join(tmpdir(), 'intake-locate-bare-'));
    try {
      mkdirSync(join(bare, 'app'), { recursive: true });
      writeFileSync(join(bare, 'app', 'globals.css'), '@import "tailwindcss";');
      const m = locate({ root: bare });
      expect(m.ok).toBe(false);
      expect(m.emittedThemeCss.path).toBeNull();
      // a non-anchor artifact that DOES exist is still located despite G0 failing.
      expect(m.hostGlobals.path).toBe(join(bare, 'app', 'globals.css'));
    } finally {
      rmSync(bare, { recursive: true, force: true });
    }
  });
});
