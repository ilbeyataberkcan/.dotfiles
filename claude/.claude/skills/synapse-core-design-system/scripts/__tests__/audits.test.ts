// Audit-suite tests (Bun). Two assertions per audit:
//   1) CLEAN: run against the CURRENT committed cve packages → exit 0.
//   2) FIRES: run against the crafted bad fixture → nonzero exit + a violation.
// This proves the gates don't false-positive on good code AND actually catch the
// finding they were built for (the failure mode of a prose-only rule, L2).

import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'bun';

const SKILL = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const S = (rel: string) => `${SKILL}/scripts/${rel}`;
const FIX = `${SKILL}/scripts/_fixtures/bad-package`;

// The CURRENT committed source trees (READ-ONLY ground truth).
const CVE = '/home/ilbey/Projects/nvim/synapsys-cve/packages';
const COMP = `${CVE}/components/src`;
const DS = `${CVE}/design-system/src`;
const PRESET = `${DS}/preset.css`;
const FIX_THEME = `${FIX}/theme/theme.generated.css`;

function run(rel: string, args: string[]): { code: number; json: any; raw: string } {
  const r = spawnSync(['bun', S(rel), ...args], { stdout: 'pipe', stderr: 'pipe' });
  const raw = r.stdout.toString() + r.stderr.toString();
  let json: any = null;
  try { json = JSON.parse(r.stdout.toString()); } catch { /* non-JSON (usage) */ }
  return { code: r.exitCode ?? 0, json, raw };
}

// Packages are clean enough that every audit should exit 0 EXCEPT one genuine,
// still-committed L14 leak in PriceDisplay.tsx (locale default 'en-US'). The
// audit is correct to fire there; we assert that exact, single finding so the
// test documents the live defect instead of masking it.
describe('audit-leak', () => {
  test('FIRES on bad fixture (tr-TR, ₺, baked currency)', () => {
    const { code, json } = run('audit/audit-leak.ts', ['--scan', `${FIX}/components`, '--brand-hex', '#d81e0b']);
    expect(code).toBe(1);
    const rules = json.violations.map((v: any) => v.rule);
    expect(rules).toContain('baked-locale');
    expect(rules).toContain('currency-glyph');
    expect(rules).toContain('baked-currency');
  });
  test('design-system/src is clean', () => {
    const { code } = run('audit/audit-leak.ts', ['--scan', DS, '--brand-hex', '#d81e0b', '--brand-font', 'Barlow Condensed']);
    expect(code).toBe(0);
  });
  test('components/src — only the known live PriceDisplay en-US default fires', () => {
    const { json } = run('audit/audit-leak.ts', ['--scan', COMP, '--brand-hex', '#d81e0b', '--brand-font', 'Barlow Condensed']);
    expect(json.violations.length).toBe(1);
    expect(json.violations[0].file).toContain('PriceDisplay.tsx');
    expect(json.violations[0].rule).toBe('baked-locale');
  });
});

describe('audit-naming', () => {
  test('FIRES on bad fixture (tournamentBracket, FederationFeeBadge)', () => {
    const { code, json } = run('audit/audit-naming.ts', ['--scan', `${FIX}/components`, '--domain-words', 'tournament,federation,wrestler']);
    expect(code).toBe(1);
    expect(json.violations.length).toBeGreaterThan(0);
  });
  test('components/src clean against a TMMAF denylist', () => {
    const { code } = run('audit/audit-naming.ts', ['--scan', COMP, '--domain-words', 'tournament,federation,wrestler,bout']);
    expect(code).toBe(0);
  });
});

describe('audit-token-refs', () => {
  test('FIRES on bad fixture (text-status-error-fg, shadow-signal, var unresolved)', () => {
    const { code, json } = run('audit/audit-token-refs.ts', ['--scan', `${FIX}/components`, '--theme', FIX_THEME]);
    expect(code).toBe(1);
    const rules = json.violations.map((v: any) => v.rule);
    expect(rules).toContain('unresolved-utility');
    expect(rules).toContain('unresolved-var');
  });
  test('components/src resolves against preset.css', () => {
    const { code } = run('audit/audit-token-refs.ts', ['--scan', COMP, '--theme', PRESET]);
    expect(code).toBe(0);
  });
  test('design-system/src resolves against preset.css', () => {
    const { code } = run('audit/audit-token-refs.ts', ['--scan', DS, '--theme', PRESET]);
    expect(code).toBe(0);
  });
});

describe('audit-cascade', () => {
  test('FIRES on bad fixture (rounded-md + rounded-none in one list)', () => {
    const { code, json } = run('audit/audit-cascade.ts', ['--scan', `${FIX}/components`]);
    expect(code).toBe(1);
    expect(json.violations[0].rule).toBe('radius-cascade-clash');
  });
  test('components/src clean', () => {
    expect(run('audit/audit-cascade.ts', ['--scan', COMP]).code).toBe(0);
  });
});

describe('audit-elevation', () => {
  const GOOD = `${SKILL}/scripts/_fixtures/good-elevation`;
  // Two distinct findings now: a resting outline used as a bound (anywhere, even
  // on a raised/shadowed surface), AND any hairline token. The prior "a named
  // hairline look is allowed" carve-out is REMOVED — hairlines are banned by
  // default; the only resting outline permitted is an explicit operator opt-in.
  test('FIRES on bad fixture (resting outline + banned hairline token)', () => {
    const { code, json } = run('audit/audit-elevation.ts', ['--scan', `${FIX}/components`]);
    expect(code).toBe(1);
    const rules = json.violations.map((v: any) => v.rule);
    expect(rules).toContain('outline-only-resting-surface');
    expect(rules).toContain('hairline-banned');
  });
  // The no-hairline rule must NOT false-positive on legitimate elevation: a
  // crafted clean tree (elevation-only surfaces, state-only outlines, single-side
  // divider seams, and one explicitly opted-in resting outline) exits 0.
  test('clean fixture passes (elevation-only + state-only + opt-in)', () => {
    expect(run('audit/audit-elevation.ts', ['--scan', GOOD]).code).toBe(0);
  });
  // components/src carries live hairlines (the Card `hairline:` variant + many
  // border-subtle/default resting bounds) — under the new global no-hairline rule
  // those are real violations. We assert the fire + the exact known token so the
  // test documents the live defect instead of masking it (same posture as the
  // PriceDisplay leak). These purge as the design-intent realization lands.
  test('components/src — live hairline/resting-outline defects fire under the rule', () => {
    const { code, json } = run('audit/audit-elevation.ts', ['--scan', COMP]);
    expect(code).toBe(1);
    const rules = json.violations.map((v: any) => v.rule);
    expect(rules).toContain('hairline-banned');
    expect(json.violations.some((v: any) => v.file.includes('Card.tsx'))).toBe(true);
  });
  // design-system/src likewise carries a live resting neutral outline (the
  // ThemeToggle dropdown content) — also a real defect under the global rule.
  test('design-system/src — live ThemeToggle resting outline fires', () => {
    const { code, json } = run('audit/audit-elevation.ts', ['--scan', DS]);
    expect(code).toBe(1);
    expect(json.violations.some((v: any) => v.file.includes('ThemeToggle.tsx'))).toBe(true);
  });
});

describe('audit-intent-primitives', () => {
  test('FIRES on bad fixture (font-display 0/required — the 0/45)', () => {
    const { code, json } = run('audit/audit-intent-primitives.ts', ['--scan', `${FIX}/components`, '--require', 'font-display,tabular-nums,uppercase,ease-emphasis']);
    expect(code).toBe(1);
    expect(json.counts['font-display']).toBe(0);
  });
  test('components/src applies the required primitives', () => {
    const { code } = run('audit/audit-intent-primitives.ts', ['--scan', COMP, '--require', 'font-display,tabular-nums,uppercase,ease-emphasis']);
    expect(code).toBe(0);
  });
});

describe('audit-look-vocab', () => {
  test('FIRES on bad fixture (look token "glossy" outside the closed set)', () => {
    const { code, json } = run('audit/audit-look-vocab.ts', ['--scan', `${FIX}/components`]);
    expect(code).toBe(1);
    expect(json.violations[0].detail).toContain('glossy');
  });
  test('components/src clean', () => {
    expect(run('audit/audit-look-vocab.ts', ['--scan', COMP]).code).toBe(0);
  });
  test('design-system/src clean', () => {
    expect(run('audit/audit-look-vocab.ts', ['--scan', DS]).code).toBe(0);
  });
});

describe('verify-claim', () => {
  test('reports a live pattern (exit 1) when present', () => {
    const { code, json } = run('learn/verify-claim.ts', ['--scan', `${FIX}/components`, '--pattern', 'rounded-none', '--expect', 'present']);
    expect(code).toBe(1);
    expect(json.stillLive).toBe(true);
  });
  test('reports a resolved pattern (exit 0) when absent', () => {
    const { code, json } = run('learn/verify-claim.ts', ['--scan', `${FIX}/components`, '--pattern', 'this-pattern-does-not-exist-anywhere', '--expect', 'present']);
    expect(code).toBe(0);
    expect(json.stillLive).toBe(false);
  });
});

describe('append-learning', () => {
  test('dry-run computes the next L-number and formats the entry', () => {
    const ledger = '/home/ilbey/Projects/nvim/tmmaf/.planning/design-drift-remediation/LEARNINGS.md';
    const { code, json } = run('learn/append-learning.ts', ['--ledger', ledger, '--title', 'TEST ENTRY (dry-run, never written)', '--bit', 'x', '--encode', 'y', '--dry-run']);
    expect(code).toBe(0);
    expect(json.status).toBe('dry-run');
    expect(json.lNumber).toBe(18); // ledger has L1..L17
    expect(json.entry).toContain('## L18 —');
  });
});

describe('audit-all', () => {
  test('FIRES on bad fixture, one nonzero exit, tiers populated', () => {
    const cfg = `${FIX}/audit.json`;
    const { code, json } = run('audit/audit-all.ts', ['--scan', `${FIX}/components`, '--theme', FIX_THEME, '--config', cfg]);
    expect(code).toBe(1);
    expect(json.ok).toBe(false);
    expect(json.tiers.CRITICAL + json.tiers.HIGH).toBeGreaterThan(0);
    // It actually ran the sub-audits (not just skipped everything).
    expect(json.ran).toContain('audit-leak');
    expect(json.ran).toContain('audit-cascade');
  });
  test('design-system/src passes audit-all (clean tree, no gating findings)', () => {
    const cfg = `${FIX}/audit-clean.json`;
    const { code, json } = run('audit/audit-all.ts', ['--scan', DS, '--theme', PRESET, '--config', cfg]);
    expect(json.tiers.CRITICAL).toBe(0);
    expect(json.tiers.HIGH).toBe(0);
    expect(code).toBe(0);
  });
});
