/**
 * derive-ramp tests — the ramp must come from the package generators (reuse,
 * not fork) and the monotonic guard must flag the L4 lossy case.
 */
import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import {
  deriveRamp,
  chromaSeries,
  isChromaMonotonic,
} from './derive-ramp.ts';

const CLI = join(import.meta.dir, 'derive-ramp.ts');

describe('derive-ramp', () => {
  test('accent ramp has all 10 steps as oklch strings', () => {
    const ramp = deriveRamp('#d81e0b', 'accent');
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(ramp[String(step)]).toMatch(/^oklch\(/);
    }
  });

  test('neutral ramp has the 13-step scale', () => {
    const ramp = deriveRamp('#d81e0b', 'neutral');
    expect(Object.keys(ramp).filter((k) => /^\d+$/.test(k)).length).toBe(13);
  });

  test('#d81e0b accent ramp is NOT monotonic (reproduces L4)', () => {
    const chroma = chromaSeries(deriveRamp('#d81e0b', 'accent'));
    expect(isChromaMonotonic(chroma)).toBe(false);
  });

  test('a clean unimodal series passes the guard', () => {
    expect(isChromaMonotonic([0.02, 0.1, 0.2, 0.25, 0.2, 0.1])).toBe(true);
  });

  test('a dip-then-rise series fails the guard', () => {
    expect(isChromaMonotonic([0.02, 0.2, 0.18, 0.25, 0.1])).toBe(false);
  });

  test('CLI --check-monotonic --json reports monotonic:false for #d81e0b', () => {
    const r = spawnSync(
      'bun',
      [CLI, '#d81e0b', '--kind', 'accent', '--check-monotonic', '--json'],
      { encoding: 'utf8' },
    );
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).monotonic).toBe(false);
  });
});
