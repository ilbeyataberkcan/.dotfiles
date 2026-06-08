#!/usr/bin/env bun
/**
 * host-regen test — dry-run (--no-regen) against a fixture host dir.
 *
 * Hermetic: never spawns a real `tokens:generate`. Builds a throwaway host
 * dir with an emitted `app/theme.generated.css` and exercises the grep half
 * (the proof-it-landed gate), plus arg parsing and the missing-token failure.
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { hostRegen, parseArgs } from './host-regen.ts';

let hostDir: string;

beforeAll(() => {
  hostDir = mkdtempSync(join(tmpdir(), 'host-regen-fixture-'));
  mkdirSync(join(hostDir, 'app'), { recursive: true });
  // A minimal emitted CSS carrying the default seeded tokens host-regen greps for.
  writeFileSync(
    join(hostDir, 'app', 'theme.generated.css'),
    [
      ':root {',
      '  --color-neutral-500: oklch(0.48 0.034 106.67);',
      '  --color-accent-primary-500: oklch(0.53 0.188 30.27);',
      '}',
      '',
    ].join('\n'),
  );
});

afterAll(() => {
  rmSync(hostDir, { recursive: true, force: true });
});

describe('parseArgs', () => {
  test('defaults: regen on, default out + expected tokens', () => {
    const a = parseArgs(['--host', '/x']);
    expect(a.host).toBe('/x');
    expect(a.out).toBe('app/theme.generated.css');
    expect(a.regen).toBe(true);
    expect(a.expect).toEqual(['--color-accent-primary-500', '--color-neutral-500']);
  });

  test('--no-regen flips regen off; --expect overrides the token list (nudge-knob)', () => {
    const a = parseArgs(['--host', '/x', '--no-regen', '--expect', '--foo, --bar']);
    expect(a.regen).toBe(false);
    expect(a.expect).toEqual(['--foo', '--bar']);
  });
});

describe('hostRegen dry-run (grep half)', () => {
  test('passes when every seeded token is present in the emitted CSS', () => {
    const r = hostRegen({
      host: hostDir,
      out: 'app/theme.generated.css',
      expect: ['--color-accent-primary-500', '--color-neutral-500'],
      regen: false,
    });
    expect(r.ok).toBe(true);
    expect(r.regenerated).toBe(false);
    expect(r.regenExitCode).toBeNull();
    expect(r.missing).toEqual([]);
    expect(r.present).toContain('--color-accent-primary-500');
  });

  test('fails when a seeded token did not land (stale / unwidened CSS)', () => {
    const r = hostRegen({
      host: hostDir,
      out: 'app/theme.generated.css',
      expect: ['--color-brand-missing-999'],
      regen: false,
    });
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(['--color-brand-missing-999']);
  });

  test('fails when the emitted CSS is absent entirely', () => {
    const r = hostRegen({
      host: hostDir,
      out: 'app/does-not-exist.css',
      expect: ['--color-neutral-500'],
      regen: false,
    });
    expect(r.ok).toBe(false);
    expect(r.missing).toContain('--color-neutral-500');
  });
});
