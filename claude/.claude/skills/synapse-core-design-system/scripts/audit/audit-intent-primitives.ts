#!/usr/bin/env bun
// audit-intent-primitives — the identity primitives must actually be applied,
// or a correct theme never shows (L3, the "0/45" census).
//
// Why: tmmaf correctly emitted `--font-display: Barlow Condensed`, but ZERO
// components used `font-display`; uppercase in 2, tabular-nums in 1. The seeded
// identity was dead on arrival because no component reached for it. A theme can
// be perfect in the token layer and invisible in the rendered layer. This audit
// counts how many files apply each required identity primitive and fails when a
// required primitive is under-applied (below --min-files), surfacing the gap as
// "applied N / required ≥ M" — the same census that exposed the 0/45.
//
// CLI: audit-intent-primitives --scan <src> --require font-display,tabular-nums,uppercase,ease-emphasis [--min-files 1] [--json]
// Out: per-primitive application count; exit 1 if any required primitive is under-applied.

import { parseArgs, flagStr, flagList, readSources, emit, type Violation } from '../_lib/cli.ts';

// How each named primitive is detected in source (className utility or CSS).
const DETECTORS: Record<string, RegExp> = {
  'font-display': /\bfont-display\b/,
  'tabular-nums': /\btabular-nums\b|font-variant-numeric:\s*tabular-nums/,
  uppercase: /\buppercase\b/,
  'ease-emphasis': /\bease-emphasis\b|var\(--ease-emphasis\)/,
  'tracking-wide': /\btracking-wide\b/,
  'tracking-tight': /\btracking-tight\b/,
  'font-mono': /\bfont-mono\b/,
  'rounded-xs': /\brounded(?:-[trblxy])?-xs\b/,
  'rounded-none': /\brounded(?:-[trblxy])?-none\b/,
};

async function main() {
  const { _, flags } = parseArgs(Bun.argv.slice(2));
  const src = flagStr(flags, 'scan') ?? _[0];
  const asJson = flags.text !== true;
  // Required primitives are a NUDGE-KNOB: the digest declares which identity
  // primitives this brand promised (REPORT-B §3 / digest.json). Default to the
  // four the engagement named so the audit is useful out of the box.
  const required = flagList(flags, 'require');
  const reqList = required.length ? required : ['font-display', 'tabular-nums', 'uppercase', 'ease-emphasis'];
  const minFiles = Math.max(1, parseInt(flagStr(flags, 'min-files') ?? '1', 10) || 1);
  if (!src) {
    console.error('audit-intent-primitives: --scan <src> required');
    process.exit(2);
  }

  const files = await readSources(src, { globs: ['**/*.ts', '**/*.tsx', '**/*.css'], includeTests: flags['include-tests'] === true });
  const counts: Record<string, number> = {};
  const knownReq: string[] = [];
  const unknownReq: string[] = [];
  for (const p of reqList) {
    if (DETECTORS[p]) {
      knownReq.push(p);
      counts[p] = 0;
    } else {
      unknownReq.push(p);
    }
  }

  for (const f of files) {
    for (const p of knownReq) {
      if (DETECTORS[p].test(f.text)) counts[p]++;
    }
  }

  const violations: Violation[] = [];
  for (const p of knownReq) {
    if (counts[p] < minFiles) {
      violations.push({
        file: src,
        line: 0,
        rule: 'under-applied-primitive',
        detail: `identity primitive "${p}" applied in ${counts[p]} file(s), required in ≥ ${minFiles} — the seeded identity is dead on arrival if no component reaches for it (L3)`,
        severity: 'HIGH',
      });
    }
  }
  // An unknown required primitive is an operator-config error, not a pass.
  for (const p of unknownReq) {
    violations.push({ file: src, line: 0, rule: 'unknown-primitive', detail: `required primitive "${p}" has no detector — add it to DETECTORS or correct the --require list`, severity: 'MEDIUM' });
  }

  emit({ audit: 'audit-intent-primitives', ok: violations.length === 0, scanned: files.length, violations, counts, required: reqList, minFiles }, asJson);
}

main();
