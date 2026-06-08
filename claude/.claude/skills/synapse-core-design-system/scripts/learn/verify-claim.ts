#!/usr/bin/env bun
// verify-claim — re-verify a "still-live" review claim against committed source (L15).
//
// Why: an adversarial reviewer flagged a radius cascade as "still live in the
// working tree" — but it had already been fixed and committed. The agent carried
// the prior-wave note forward without re-checking and nearly burned a fix cycle
// on a dead blocker. Before any finding that references a prior fix drives work,
// re-verify it: grep the CURRENT committed source for the claimed pattern. Found
// → still live (exit 1, do the work). Not found → already resolved (exit 0,
// drop the stale blocker).
//
// CLI: verify-claim --scan <src> --pattern "<regex>" [--expect present|absent] [--files glob,glob] [--json]
// Out: matches with file:line; exit reflects the claim's truth vs --expect.

import { parseArgs, flagStr, flagList, readSources, lineAt } from '../_lib/cli.ts';

async function main() {
  const { _, flags } = parseArgs(Bun.argv.slice(2));
  const src = flagStr(flags, 'scan') ?? _[0];
  const pattern = flagStr(flags, 'pattern') ?? _[1];
  const asJson = flags.text !== true;
  // What the claim asserts: 'present' = "the bug is still live" (a hit confirms
  // it); 'absent' = "this was fixed" (a hit refutes it). Default: present.
  const expect = (flagStr(flags, 'expect') ?? 'present').toLowerCase();
  const globs = flagList(flags, 'files');
  if (!src || !pattern) {
    console.error('verify-claim: --scan <src> and --pattern <regex> required');
    process.exit(2);
  }

  let re: RegExp;
  try {
    re = new RegExp(pattern, 'g');
  } catch (e) {
    console.error(`verify-claim: invalid --pattern: ${(e as Error).message}`);
    process.exit(2);
  }

  const files = await readSources(src, { globs: globs.length ? globs : undefined, includeTests: flags['include-tests'] === true });
  const matches: { file: string; line: number; text: string }[] = [];
  for (const f of files) {
    for (const m of f.text.matchAll(re)) {
      matches.push({ file: f.path, line: lineAt(f.text, m.index ?? 0), text: m[0].slice(0, 120) });
    }
  }

  const present = matches.length > 0;
  // Claim holds iff observation matches expectation.
  const claimHolds = expect === 'present' ? present : !present;
  const result = {
    tool: 'verify-claim',
    pattern,
    expect,
    observed: present ? 'present' : 'absent',
    claimHolds,
    stillLive: expect === 'present' ? present : !present, // is the underlying issue live?
    scanned: files.length,
    matchCount: matches.length,
    matches: matches.slice(0, 50),
  };

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`verify-claim: pattern ${present ? 'FOUND' : 'not found'} (${matches.length} matches); claim (expect=${expect}) ${claimHolds ? 'HOLDS' : 'STALE'}`);
    for (const m of matches.slice(0, 50)) console.log(`  ${m.file}:${m.line}  ${m.text}`);
  }
  // Exit 1 when the underlying issue is still live (act on it); 0 when resolved.
  process.exit(result.stillLive ? 1 : 0);
}

main();
