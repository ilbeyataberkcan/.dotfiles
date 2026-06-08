#!/usr/bin/env bun
// append-learning — append an L-format entry to the learnings ledger (Stage 9).
//
// Why: the skill self-improves only if each engagement's lessons land in the
// ledger in the SAME shape the existing ones use (## L<N> — <title> / **Bit
// us:** … / **Encode:** …), so the next run's digest can read them. This is a
// deterministic file op: it computes the next L-number by scanning existing
// headings, formats the entry, and appends idempotently (a duplicate title is a
// no-op, so re-running Stage 9 never double-writes).
//
// CLI: append-learning --ledger <LEARNINGS.md> --title "…" --bit "…" --encode "…" [--dry-run] [--json]
// Out: the appended entry + its assigned L-number; exit 0 on success/no-op.

import { parseArgs, flagStr } from '../_lib/cli.ts';

function nextLNumber(text: string): number {
  let max = 0;
  for (const m of text.matchAll(/^##\s*L(\d+)\b/gm)) {
    const n = parseInt(m[1], 10);
    if (n > max) max = n;
  }
  return max + 1;
}

async function main() {
  const { flags } = parseArgs(Bun.argv.slice(2));
  const ledgerPath = flagStr(flags, 'ledger');
  const title = flagStr(flags, 'title');
  const bit = flagStr(flags, 'bit');
  const encode = flagStr(flags, 'encode');
  const asJson = flags.text !== true;
  const dryRun = flags['dry-run'] === true;
  if (!ledgerPath || !title || !encode) {
    console.error('append-learning: --ledger <path> --title "…" --encode "…" required (--bit optional)');
    process.exit(2);
  }

  const file = Bun.file(ledgerPath);
  const existing = (await file.exists()) ? await file.text() : '# Learnings Ledger\n';

  // Idempotent: if an entry with this exact title already exists, do nothing.
  const titleEsc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`^##\\s*L\\d+\\s*—\\s*${titleEsc}\\s*$`, 'm').test(existing)) {
    const out = { tool: 'append-learning', status: 'noop', reason: 'an entry with this title already exists', title };
    console.log(asJson ? JSON.stringify(out, null, 2) : `append-learning: no-op — "${title}" already in ledger`);
    process.exit(0);
  }

  const n = nextLNumber(existing);
  const parts = [`## L${n} — ${title}`];
  if (bit) parts.push(`**Bit us:** ${bit}`);
  parts.push(`**Encode:** ${encode}`);
  const entry = `\n${parts.join('\n')}\n`;

  if (!dryRun) {
    const sep = existing.endsWith('\n') ? '' : '\n';
    await Bun.write(ledgerPath, existing + sep + entry);
  }

  const out = { tool: 'append-learning', status: dryRun ? 'dry-run' : 'appended', lNumber: n, title, entry: entry.trim() };
  console.log(asJson ? JSON.stringify(out, null, 2) : `append-learning: ${dryRun ? '[dry-run] would append' : 'appended'} L${n} — ${title}`);
  process.exit(0);
}

main();
