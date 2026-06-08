#!/usr/bin/env bun
// audit-cascade — base radius must not co-exist with a sharp-variant radius (L13).
//
// Why: build + tsc + 1635 tests all passed while two cva radius variants painted
// the WRONG corner. In Tailwind v4 the cascade is source-order, not
// specificity-order: a base `rounded-md` emitted later in the stylesheet beats a
// variant's `rounded-none`, so the sharp variant silently rounds. Type/existence
// gates can't see computed CSS cascade. The structural tell is a single class
// list (a cva base, or one element) carrying BOTH a round radius utility AND a
// sharp one — they fight, and base wins. The sanctioned way to go sharp is the
// `data-cve-look~="sharp"` escape (targets `> *`, wins on specificity), so a
// look-driven sharp is allowed; a utility-vs-utility clash is the bug.
//
// CLI: audit-cascade --scan <src> [--json]
// Out: file:line where a round + sharp radius collide in one class list; exit 1.

import { parseArgs, flagStr, readSources, classRuns, sliceBalanced, lineAt, emit, type Violation } from '../_lib/cli.ts';

// Round radii (anything that paints a non-zero corner) vs sharp radii (zero/xs).
const SIDE = '(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?';
const ROUND = new RegExp(`\\brounded${SIDE}-(?:sm|md|lg|xl|2xl|3xl|full)\\b|\\brounded${SIDE}\\b(?!-)`);
const SHARP = new RegExp(`\\brounded${SIDE}-(?:none|xs)\\b`);

async function main() {
  const { _, flags } = parseArgs(Bun.argv.slice(2));
  const src = flagStr(flags, 'scan') ?? _[0];
  const asJson = flags.text !== true;
  if (!src) {
    console.error('audit-cascade: --scan <src> required');
    process.exit(2);
  }

  const files = await readSources(src, { globs: ['**/*.ts', '**/*.tsx'], includeTests: flags['include-tests'] === true });
  const violations: Violation[] = [];

  for (const f of files) {
    // (a) Same-run clash — round + sharp inside ONE contiguous class run.
    for (const run of classRuns(f.text)) {
      // The escape hatch: sharpness via data-cve-look wins on `> *` specificity,
      // so it's the sanctioned mechanism, not a utility-vs-utility clash.
      if (/data-cve-look/.test(run.text)) continue;
      if (ROUND.test(run.text) && SHARP.test(run.text)) {
        violations.push({
          file: f.path,
          line: lineAt(f.text, run.index),
          rule: 'radius-cascade-clash',
          detail: `a round radius and a sharp radius (none/xs) share one class list — in Tailwind v4 source-order, base beats the variant and the corner paints wrong; drive sharpness via data-cve-look~="sharp"`,
          severity: 'HIGH',
        });
      }
    }
    // (b) cva base-vs-variant clash — the canonical L13 shape: a ROUND radius in
    // the cva base string and a SHARP radius in any variant string. They live in
    // separate literals but MERGE at runtime, and base wins the cascade. This is
    // exactly the case green tests can't see.
    for (const cva of f.text.matchAll(/\bcva\s*\(/g)) {
      const openParen = (cva.index ?? 0) + cva[0].length - 1;
      const block = sliceBalanced(f.text, openParen);
      if (!block) continue;
      const blockStart = openParen + 1; // absolute index of block.text[0]
      const base = block.text.match(/^[\s(]*(['"`])([\s\S]*?)\1/);
      const baseStr = base ? base[2] : '';
      if (!ROUND.test(baseStr) || /data-cve-look/.test(baseStr)) continue;
      // Any variant string in the same cva carrying a sharp radius clashes.
      for (const vs of block.text.matchAll(/(['"`])([^'"`]*\brounded[^'"`]*)\1/g)) {
        const variantStr = vs[2];
        if (variantStr === baseStr) continue;
        if (/data-cve-look/.test(variantStr)) continue;
        if (SHARP.test(variantStr)) {
          violations.push({
            file: f.path,
            line: lineAt(f.text, blockStart + (vs.index ?? 0)),
            rule: 'cva-base-variant-radius-clash',
            detail: `the cva base sets a round radius while a variant sets a sharp one (${SHARP.exec(variantStr)?.[0]}) — they merge at runtime and the base wins the Tailwind v4 cascade; move sharpness to data-cve-look~="sharp" or drop the base radius`,
            severity: 'HIGH',
          });
          break;
        }
      }
    }
  }

  emit({ audit: 'audit-cascade', ok: violations.length === 0, scanned: files.length, violations }, asJson);
}

main();
