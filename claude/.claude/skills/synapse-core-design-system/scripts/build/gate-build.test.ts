#!/usr/bin/env bun
/**
 * gate-build test — --dry-run (the report-only path) against fixture package.json
 * files. Hermetic: never spawns a real `bun run build`/`tsc`/`test`. It exercises
 * command DISCOVERY (alias resolution, turbo --filter routing, the unresolved-step
 * hole) and arg parsing — the deterministic half that needs no toolchain.
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { discoverSteps, gateBuild, parseArgs, readScripts } from './gate-build.ts';

// A single-package target mirroring TMMAF's real script map.
let soloRoot: string;
// A monorepo-shaped target: turbo.json present + delegated task scripts.
let turboRoot: string;

beforeAll(() => {
  soloRoot = mkdtempSync(join(tmpdir(), 'gate-build-solo-'));
  writeFileSync(
    join(soloRoot, 'package.json'),
    JSON.stringify({
      name: 'tmmaf',
      scripts: {
        build: 'next build',
        typecheck: 'tsc --noEmit',
        test: 'vitest run',
        dev: 'next dev',
      },
    }),
  );

  turboRoot = mkdtempSync(join(tmpdir(), 'gate-build-turbo-'));
  writeFileSync(
    join(turboRoot, 'package.json'),
    JSON.stringify({
      name: 'monorepo',
      // Alias forms (type-check, not typecheck) prove the alias table works.
      scripts: { build: 'turbo run build', 'type-check': 'turbo run type-check', test: 'turbo run test' },
    }),
  );
  writeFileSync(join(turboRoot, 'turbo.json'), JSON.stringify({ tasks: { build: {}, test: {} } }));
});

afterAll(() => {
  rmSync(soloRoot, { recursive: true, force: true });
  rmSync(turboRoot, { recursive: true, force: true });
});

describe('parseArgs', () => {
  test('defaults: all three steps, default tail, dry-run off', () => {
    const a = parseArgs(['--root', '/x']);
    expect(a.root).toBe('/x');
    expect(a.steps).toEqual(['build', 'typecheck', 'test']);
    expect(a.tail).toBe(30);
    expect(a.dryRun).toBe(false);
    expect(a.filter).toBeUndefined();
  });

  test('--filter, --steps, --tail, --dry-run all parse (the nudge-knobs)', () => {
    const a = parseArgs(['--root', '/x', '--filter', '@scope/pkg', '--steps', 'build, test', '--tail', '5', '--dry-run']);
    expect(a.filter).toBe('@scope/pkg');
    expect(a.steps).toEqual(['build', 'test']);
    expect(a.tail).toBe(5);
    expect(a.dryRun).toBe(true);
  });
});

describe('readScripts', () => {
  test('reads the scripts map from a target package.json', () => {
    const scripts = readScripts(soloRoot);
    expect(scripts.build).toBe('next build');
    expect(scripts.typecheck).toBe('tsc --noEmit');
  });
  test('returns {} when there is no package.json', () => {
    expect(readScripts(join(tmpdir(), 'gate-build-nope-does-not-exist'))).toEqual({});
  });
});

describe('discoverSteps', () => {
  test('resolves each step to `bun run <script>` for a solo package', () => {
    const found = discoverSteps(readScripts(soloRoot), ['build', 'typecheck', 'test'], { turbo: false });
    expect(found.map((s) => s.script)).toEqual(['build', 'typecheck', 'test']);
    expect(found.every((s) => s.resolved)).toBe(true);
    expect(found.every((s) => !s.viaTurbo)).toBe(true);
    expect(found[0].command).toEqual(['bun', 'run', 'build']);
  });

  test('typecheck resolves through an alias (type-check) when the canonical name is absent', () => {
    const found = discoverSteps({ 'type-check': 'tsc --noEmit' }, ['typecheck'], { turbo: false });
    expect(found[0].resolved).toBe(true);
    expect(found[0].script).toBe('type-check');
  });

  test('a requested step with no matching script is an unresolved hole (resolved:false)', () => {
    const found = discoverSteps({ build: 'next build' }, ['build', 'test'], { turbo: false });
    expect(found[0].resolved).toBe(true);
    expect(found[1].resolved).toBe(false);
    expect(found[1].command).toEqual([]);
  });

  test('--filter + turbo.json routes each step through `turbo run <task> --filter <pkg>`', () => {
    const found = discoverSteps(readScripts(turboRoot), ['build', 'test'], { turbo: true, filter: '@scope/pkg' });
    expect(found.every((s) => s.viaTurbo)).toBe(true);
    expect(found[0].command).toEqual(['bun', 'run', 'turbo', 'run', 'build', '--filter', '@scope/pkg']);
  });

  test('a --filter with no turbo.json falls back to plain `bun run` (not turbo)', () => {
    const found = discoverSteps(readScripts(soloRoot), ['build'], { turbo: false, filter: '@scope/pkg' });
    expect(found[0].viaTurbo).toBe(false);
    expect(found[0].command).toEqual(['bun', 'run', 'build']);
  });
});

describe('gateBuild --dry-run (report-only, runs nothing)', () => {
  test('solo package: reports the three commands it WOULD run, gate ok, ran nothing', () => {
    const r = gateBuild({ root: soloRoot, steps: ['build', 'typecheck', 'test'], tail: 30, dryRun: true });
    expect(r.dryRun).toBe(true);
    expect(r.turbo).toBe(false);
    expect(r.ok).toBe(true);
    expect(r.steps.every((s) => s.ran === false)).toBe(true);
    expect(r.steps.map((s) => s.command.join(' '))).toEqual([
      'bun run build',
      'bun run typecheck',
      'bun run test',
    ]);
  });

  test('turbo monorepo with --filter: dry-run shows the turbo-routed commands', () => {
    const r = gateBuild({ root: turboRoot, filter: '@scope/pkg', steps: ['build', 'test'], tail: 30, dryRun: true });
    expect(r.turbo).toBe(true);
    expect(r.filter).toBe('@scope/pkg');
    expect(r.steps[0].command).toEqual(['bun', 'run', 'turbo', 'run', 'build', '--filter', '@scope/pkg']);
    expect(r.ok).toBe(true);
  });

  test('an unresolvable requested step surfaces as resolved:false and flags the gate even in dry-run', () => {
    // turboRoot has no `lint` script — dry-run reports the hole AND marks ok:false
    // so a missing command is caught before the real run; nothing is spawned.
    const r = gateBuild({ root: turboRoot, steps: ['build', 'lint'], tail: 30, dryRun: true });
    expect(r.steps[1].resolved).toBe(false);
    expect(r.steps.every((s) => s.ran === false)).toBe(true);
    expect(r.dryRun).toBe(true);
    expect(r.ok).toBe(false);
  });
});
