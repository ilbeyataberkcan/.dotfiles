/**
 * emit-theme-css tests — generates the three-block CSS and gates staleness.
 * These guard L9: the seed and the generated CSS move together.
 */
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stripHeader } from './emit-theme-css.ts';

const CLI = join(import.meta.dir, 'emit-theme-css.ts');
let dir: string;
let seed: string;
let out: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'emit-css-'));
  seed = join(dir, 'seed.ts');
  out = join(dir, 'theme.generated.css');
  writeFileSync(
    seed,
    `export const themeSeed = { primary: '#070708', accents: { primary: '#d81e0b' }, defaultMode: 'light' };\n`,
  );
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('emit-theme-css', () => {
  test('write emits all three CSS blocks', () => {
    const r = spawnSync('bun', [CLI, '--seed', seed, '--out', out], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    const css = require('node:fs').readFileSync(out, 'utf8');
    expect(css).toContain(':root {');
    expect(css).toContain('[data-theme="light"] {');
    expect(css).toContain('[data-theme="dark"] {');
  });

  test('--check passes when CSS matches the seed', () => {
    const r = spawnSync('bun', [CLI, '--seed', seed, '--out', out, '--check'], { encoding: 'utf8' });
    expect(r.status).toBe(0);
  });

  test('--check fails (exit 1) when CSS is stale', () => {
    appendFileSync(out, '\n--color-injected-drift: red;\n');
    const r = spawnSync('bun', [CLI, '--seed', seed, '--out', out, '--check'], { encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/STALE/);
  });

  test('stripHeader removes the generated banner only', () => {
    const withBanner = '/* Generated at 2026 … */\n\n:root { --x: 1; }';
    expect(stripHeader(withBanner)).toBe(':root { --x: 1; }');
  });
});
