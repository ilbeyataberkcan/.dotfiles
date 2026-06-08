/**
 * oklch tests — the conversion primitive must round-trip and match the package
 * math. The headline case (#d81e0b) is the golden-fixture anchor.
 */
import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { convert } from './oklch.ts';
import { oklchToCSS } from '../_vendor/theme-math.ts';

const CLI = join(import.meta.dir, 'oklch.ts');

describe('oklch', () => {
  test('#d81e0b converts to the package OKLCH', () => {
    const ok = convert('#d81e0b', false);
    expect(ok.l).toBeCloseTo(0.5637, 3);
    expect(ok.c).toBeCloseTo(0.218, 3);
    expect(ok.h).toBeCloseTo(30.27, 1);
  });

  test('#d81e0b round-trips hex → oklch CSS → channels', () => {
    const ok = convert('#d81e0b', false);
    const css = oklchToCSS(ok);
    const back = convert(css, true);
    // The CSS form rounds to 4/2 dp; re-parsing must land back within that
    // rounding, not drift.
    expect(back.l).toBeCloseTo(ok.l, 3);
    expect(back.c).toBeCloseTo(ok.c, 3);
    expect(back.h).toBeCloseTo(ok.h, 1);
  });

  test('CLI emits JSON with input + channels + css', () => {
    const r = spawnSync('bun', [CLI, '#d81e0b', '--json'], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.input).toBe('#d81e0b');
    expect(j.css).toBe('oklch(0.5637 0.218 30.27)');
  });

  test('CLI rejects an invalid color', () => {
    const r = spawnSync('bun', [CLI, 'not-a-color'], { encoding: 'utf8' });
    expect(r.status).toBe(1);
  });
});
