#!/usr/bin/env bun
// audit-naming — domain-word denylist over a neutral package's public names (L2).
//
// Why: a neutral package earns reuse by naming things by FUNCTION, not by the
// brand/domain it was first built for. A `FederationCard` or `tournamentFee`
// prop bakes one customer into a package meant for many; the name is the leak.
// Standing Rule 1 (the naming map): exported identifiers, component names, prop
// keys, and CVA variant keys must not contain a domain word from the denylist.
//
// CLI: audit-naming --scan <src> --domain-words "tournament,federation,wrestler,..." [--json]
// Out: identifier:line violations; exit 1 on any domain word in a public name.

import { parseArgs, flagStr, flagList, readSources, lineAt, emit, type Violation } from '../_lib/cli.ts';

// Public-surface declaration sites: where a domain word does real damage.
const DECL_PATTERNS = [
  { rule: 'exported-name', re: /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g },
  { rule: 'exported-spec', re: /export\s*\{\s*([^}]+)\}/g, split: true },
  { rule: 'prop-key', re: /^\s*([A-Za-z_$][\w$]*)\s*:/gm },
  { rule: 'cva-variant-key', re: /variants\s*:\s*\{([\s\S]*?)\n\s*\}/g },
];

/** Split an identifier into lowercase sub-words across camelCase/snake/kebab. */
function subWords(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_$-]+/)
    .map((s) => s.toLowerCase())
    .filter(Boolean);
}

async function main() {
  const { _, flags } = parseArgs(Bun.argv.slice(2));
  const src = flagStr(flags, 'scan') ?? _[0];
  const asJson = flags.text !== true;
  const words = flagList(flags, 'domain-words');
  if (!src) {
    console.error('audit-naming: --scan <src> required');
    process.exit(2);
  }
  if (words.length === 0) {
    // No denylist supplied → nothing to enforce; exit clean (the operator owns
    // the per-brand denylist as a nudge-knob).
    emit({ audit: 'audit-naming', ok: true, scanned: 0, violations: [], note: 'no --domain-words supplied; nothing to check' }, asJson);
  }
  const deny = new Set(words.map((w) => w.toLowerCase()));

  const files = await readSources(src, ['**/*.ts', '**/*.tsx']);
  const violations: Violation[] = [];

  for (const f of files) {
    for (const dp of DECL_PATTERNS) {
      for (const m of f.text.matchAll(dp.re)) {
        const captured = m[1] ?? '';
        const names = (dp as { split?: boolean }).split
          ? captured.split(',').map((s) => s.split(/\s+as\s+/)[0].trim())
          : [captured];
        for (const name of names) {
          if (!name) continue;
          const hit = subWords(name).find((w) => deny.has(w));
          if (hit) {
            violations.push({
              file: f.path,
              line: lineAt(f.text, m.index ?? 0),
              rule: dp.rule,
              detail: `"${name}" contains the domain word "${hit}" — name a neutral primitive by function, not by the first customer's domain`,
              severity: 'HIGH',
            });
          }
        }
      }
    }
  }

  emit({ audit: 'audit-naming', ok: violations.length === 0, scanned: files.length, violations }, asJson);
}

main();
