#!/usr/bin/env bun
// audit-look-vocab — the data-cve-look escape hatch stays a CLOSED vocabulary.
//
// Why: the one sanctioned new-CSS exception is a 7-token look vocabulary
// (flat, hairline, sunken, sharp, bleed, stack, inline), each rule naming a
// FUNCTION/SHAPE, never a brand value, and each targeting the single wrapped
// root. An eighth token would be an open escape hatch — a place for arbitrary
// CSS (and a brand value) to slip back in, defeating the Tailwind-composition
// constraint. So every look token a component declares (`look:[…]`, `__look`,
// `data-cve-look="…"`) must be in the closed set; an unknown token is exit 1.
//
// CLI: audit-look-vocab --scan <src> [--vocab flat,hairline,sunken,sharp,bleed,stack,inline] [--json]
// Out: file:line of any look token outside the closed set; exit 1.

import { parseArgs, flagStr, flagList, readSources, stripComments, lineAt, emit, type Violation } from '../_lib/cli.ts';

// The closed 7-token vocabulary (preset.css escape-hatch helpers).
const DEFAULT_VOCAB = ['flat', 'hairline', 'sunken', 'sharp', 'bleed', 'stack', 'inline'];

// Where look tokens are DECLARED on a component: a `look`/`__look` array prop, or
// the emitted `data-cve-look="t1 t2"` attribute. The `~=` selector form in
// preset.css DEFINES the vocabulary (it's the source of truth, not a usage), so
// it must not be flagged — only the `=` assignment form is a declaration. A
// placeholder `<tokens>` inside a comment is excluded by stripping comments.
const DECLARATIONS = [
  { rule: 'data-cve-look-attr', re: /data-cve-look\s*=\s*(['"`])([^'"`]*)\1/g, group: 2 },
  { rule: 'look-prop-array', re: /\b(?:__look|look)\s*:\s*\[([^\]]*)\]/g, group: 1 },
];

/** A token must look like a real word, not a comment placeholder like <tokens>. */
const VALID_TOKEN = /^[a-z][a-z0-9-]*$/i;

function tokensFrom(payload: string): string[] {
  return payload
    .split(/[\s,]+/)
    .map((t) => t.replace(/['"`]/g, '').trim())
    .filter(Boolean);
}

async function main() {
  const { _, flags } = parseArgs(Bun.argv.slice(2));
  const src = flagStr(flags, 'scan') ?? _[0];
  const asJson = flags.text !== true;
  // The vocabulary itself is the nudge-knob: a brand could sanction more look
  // tokens (with matching preset CSS), but the SET stays closed and explicit.
  const vocab = new Set((flagList(flags, 'vocab').length ? flagList(flags, 'vocab') : DEFAULT_VOCAB).map((t) => t.toLowerCase()));
  if (!src) {
    console.error('audit-look-vocab: --scan <src> required');
    process.exit(2);
  }

  const files = await readSources(src, { globs: ['**/*.ts', '**/*.tsx', '**/*.css'], includeTests: flags['include-tests'] === true });
  const violations: Violation[] = [];

  for (const f of files) {
    // Strip comments so a preset placeholder like `data-cve-look="<tokens>"` in a
    // doc block isn't read as a real declaration. Line numbers are preserved.
    const code = stripComments(f.text);
    for (const d of DECLARATIONS) {
      for (const m of code.matchAll(d.re)) {
        const payload = m[d.group] ?? '';
        for (const tok of tokensFrom(payload)) {
          if (!VALID_TOKEN.test(tok)) continue; // not a real token (e.g. a placeholder)
          if (!vocab.has(tok.toLowerCase())) {
            violations.push({
              file: f.path,
              line: lineAt(code, m.index ?? 0),
              rule: 'look-token-outside-vocab',
              detail: `look token "${tok}" is not in the closed set {${[...vocab].join(', ')}} — an unknown token opens the escape hatch to arbitrary CSS/brand values`,
              severity: 'HIGH',
            });
          }
        }
      }
    }
  }

  emit({ audit: 'audit-look-vocab', ok: violations.length === 0, scanned: files.length, violations, vocab: [...vocab] }, asJson);
}

main();
