#!/usr/bin/env bun
// audit-all — run the whole L13/L14 net as ONE command, ONE exit code (the gate).
//
// Why: the audit gate (G7) is "run one command, get zero leaks / zero dangling
// refs / zero cascade-mispaints, severity-tiered". A reviewer should not have to
// remember seven invocations. This orchestrates audits 8–14, plus a contrast
// sub-routine (WCAG over the emitted theme), plus the regen/icon staleness gates
// when those B1 scripts are present, and folds every finding into one report
// with a single nonzero exit if any CRITICAL/HIGH tier fails.
//
// CLI: audit-all --scan <src> --theme <css> [--preset <css>] [--config <audit.json>] [--json]
//
// audit.json (all optional — the bounded nudge-knobs):
//   { "domainWords": ["tournament","federation"], "brandHex": ["#d81e0b"],
//     "brandFont": ["Barlow Condensed"], "requirePrimitives": ["font-display","tabular-nums"],
//     "minPrimitiveFiles": 1, "lookVocab": ["flat",...], "contrastPairs": [["--color-status-error-fg","--color-status-error-500"]],
//     "contrastMin": 4.5 }

import { parseArgs, flagStr } from '../_lib/cli.ts';
import { contrastRatio } from '../_lib/contrast.ts';

const SKILL = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');

interface SubReport {
  audit: string;
  ok: boolean;
  violations: { severity?: string; rule: string; file: string; line: number; detail: string }[];
  skipped?: string;
  [k: string]: unknown;
}

async function runScript(rel: string, args: string[]): Promise<SubReport | null> {
  const path = `${SKILL}/scripts/${rel}`;
  if (!(await Bun.file(path).exists())) return null;
  const proc = Bun.spawn(['bun', path, ...args], { stdout: 'pipe', stderr: 'pipe' });
  const out = await new Response(proc.stdout).text();
  await proc.exited;
  try {
    return JSON.parse(out) as SubReport;
  } catch {
    return { audit: rel, ok: proc.exitCode === 0, violations: [], raw: out.slice(0, 400) };
  }
}

async function loadConfig(path: string | undefined): Promise<Record<string, unknown>> {
  if (!path) return {};
  const f = Bun.file(path);
  if (!(await f.exists())) {
    console.error(`audit-all: --config ${path} not found`);
    process.exit(2);
  }
  return JSON.parse(await f.text());
}

function csv(v: unknown): string | undefined {
  if (Array.isArray(v)) return v.join(',');
  return typeof v === 'string' ? v : undefined;
}

/** Contrast sub-routine: WCAG over chosen fg/bg pairs resolved from the emitted theme. */
async function contrastSubroutine(
  themePath: string,
  pairs: [string, string][],
  min: number
): Promise<SubReport> {
  const violations: SubReport['violations'] = [];
  let css = '';
  if (await Bun.file(themePath).exists()) css = await Bun.file(themePath).text();
  const resolve = (name: string): string | null => {
    if (!name.startsWith('--')) return name; // a literal color
    const m = css.match(new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:\\s*([^;]+);`));
    return m ? m[1].trim() : null;
  };
  for (const [fgN, bgN] of pairs) {
    const fg = resolve(fgN);
    const bg = resolve(bgN);
    if (!fg || !bg) {
      violations.push({ severity: 'HIGH', rule: 'contrast-unresolved', file: themePath, line: 0, detail: `cannot resolve ${!fg ? fgN : bgN} in the emitted theme` });
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio === null) {
      violations.push({ severity: 'MEDIUM', rule: 'contrast-unparseable', file: themePath, line: 0, detail: `cannot compute contrast for ${fgN} on ${bgN}` });
    } else if (ratio < min) {
      violations.push({ severity: 'HIGH', rule: 'contrast-below-min', file: themePath, line: 0, detail: `${fgN} on ${bgN} = ${ratio.toFixed(2)}:1, below ${min}:1` });
    }
  }
  return { audit: 'contrast-check', ok: violations.length === 0, violations, pairsChecked: pairs.length };
}

async function main() {
  const { _, flags } = parseArgs(Bun.argv.slice(2));
  const src = flagStr(flags, 'scan') ?? _[0];
  const theme = flagStr(flags, 'theme');
  const preset = flagStr(flags, 'preset');
  const asJson = flags.text !== true;
  if (!src || !theme) {
    console.error('audit-all: --scan <src> and --theme <css> required');
    process.exit(2);
  }
  const cfg = await loadConfig(flagStr(flags, 'config'));

  const reports: SubReport[] = [];
  const skipped: { audit: string; reason: string }[] = [];
  const add = (r: SubReport | null, name: string) => {
    if (r) reports.push(r);
    else skipped.push({ audit: name, reason: 'script not present (B1 not yet shipped)' });
  };

  // ── Audits 8–14 (always present — this wave) ──────────────────────────────
  add(await runScript('audit/audit-leak.ts', [
    '--scan', src,
    ...(cfg.brandHex ? ['--brand-hex', csv(cfg.brandHex)!] : []),
    ...(cfg.brandFont ? ['--brand-font', csv(cfg.brandFont)!] : []),
  ]), 'audit-leak');

  if (cfg.domainWords) {
    add(await runScript('audit/audit-naming.ts', ['--scan', src, '--domain-words', csv(cfg.domainWords)!]), 'audit-naming');
  } else {
    skipped.push({ audit: 'audit-naming', reason: 'no domainWords in config (nothing to enforce)' });
  }

  add(await runScript('audit/audit-token-refs.ts', ['--scan', src, '--theme', theme, ...(preset ? ['--preset', preset] : [])]), 'audit-token-refs');
  add(await runScript('audit/audit-cascade.ts', ['--scan', src]), 'audit-cascade');
  add(await runScript('audit/audit-elevation.ts', ['--scan', src]), 'audit-elevation');
  // Intent-primitives is a COMPONENT-package concern (it asserts components apply
  // the brand's identity utilities). A theme-only or non-component target has no
  // components to census, so it runs only when the config opts in via
  // requirePrimitives — that flag IS the "this is a component package" signal.
  if (cfg.requirePrimitives) {
    add(await runScript('audit/audit-intent-primitives.ts', [
      '--scan', src,
      '--require', csv(cfg.requirePrimitives)!,
      ...(cfg.minPrimitiveFiles ? ['--min-files', String(cfg.minPrimitiveFiles)] : []),
    ]), 'audit-intent-primitives');
  } else {
    skipped.push({ audit: 'audit-intent-primitives', reason: 'no requirePrimitives in config (not a component package)' });
  }
  add(await runScript('audit/audit-look-vocab.ts', ['--scan', src, ...(cfg.lookVocab ? ['--vocab', csv(cfg.lookVocab)!] : [])]), 'audit-look-vocab');

  // ── Contrast sub-routine (inline; reuses the WCAG lib) ────────────────────
  if (Array.isArray(cfg.contrastPairs) && cfg.contrastPairs.length) {
    reports.push(await contrastSubroutine(theme, cfg.contrastPairs as [string, string][], Number(cfg.contrastMin ?? 4.5)));
  } else {
    skipped.push({ audit: 'contrast-check', reason: 'no contrastPairs in config' });
  }

  // ── B1 staleness gates (present only after wave B1 ships) ─────────────────
  if (cfg.seed) {
    add(await runScript('color/emit-theme-css.ts', ['--seed', String(cfg.seed), '--out', theme, '--check']), 'emit-theme-css --check');
  } else {
    skipped.push({ audit: 'emit-theme-css --check', reason: 'no seed in config / B1 not shipped' });
  }
  // The icon registry is also a component-package concern — run the index gate
  // only when the config opts in (iconIndex: true), mirroring requirePrimitives.
  if (cfg.iconIndex) {
    add(await runScript('icons/icon-index.ts', ['--scan', src, '--check']), 'icon-index --check');
  } else {
    skipped.push({ audit: 'icon-index --check', reason: 'iconIndex not enabled in config (not a component package)' });
  }

  // ── Tier + verdict ────────────────────────────────────────────────────────
  const tiers = { CRITICAL: 0, HIGH: 0, MEDIUM: 0 } as Record<string, number>;
  for (const r of reports) {
    for (const v of r.violations ?? []) {
      const sev = (v.severity ?? 'HIGH').toUpperCase();
      if (sev in tiers) tiers[sev]++;
    }
  }
  // Gate G7: any CRITICAL or HIGH fails the run. MEDIUM is reported, not gating.
  const ok = tiers.CRITICAL === 0 && tiers.HIGH === 0;

  const result = {
    audit: 'audit-all',
    ok,
    scan: src,
    theme,
    tiers,
    ran: reports.map((r) => r.audit),
    skipped,
    reports: reports.map((r) => ({ audit: r.audit, ok: r.ok, violations: r.violations ?? [] })),
  };

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`audit-all: ${ok ? 'PASS' : 'FAIL'}  (CRITICAL=${tiers.CRITICAL} HIGH=${tiers.HIGH} MEDIUM=${tiers.MEDIUM})`);
    for (const r of reports) {
      const n = (r.violations ?? []).length;
      console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${r.audit}${n ? ` (${n})` : ''}`);
      for (const v of r.violations ?? []) console.log(`        ${(v.severity ?? 'HIGH')}  ${v.file}:${v.line} [${v.rule}] ${v.detail}`);
    }
    for (const s of skipped) console.log(`  skip ${s.audit} — ${s.reason}`);
  }
  process.exit(ok ? 0 : 1);
}

main();
