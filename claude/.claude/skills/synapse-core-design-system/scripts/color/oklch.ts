#!/usr/bin/env bun
/**
 * oklch — convert any CSS color string to OKLCH and back, using the SAME
 * conversion the package ships (imported from the `_vendor` snapshot, never
 * re-derived — L9). This is the primitive every other color step builds on:
 * the digest stage runs it on each reference hex, the derive stage runs it on
 * the brand anchor.
 *
 * Run it instead of computing OKLCH by hand — hand-math drifts from the
 * package's culori conversion and wastes tokens.
 *
 * CLI:
 *   oklch <color> [--to css|obj] [--from-oklch] [--json]
 *
 *   <color>       hex / rgb / hsl / oklch(...) string, OR (with --from-oklch)
 *                 an oklch() string to parse back to channels.
 *   --to css      print the oklch() CSS string (default).
 *   --to obj      print the {l,c,h} channels.
 *   --from-oklch  treat <color> as an oklch() string and parse to {l,c,h}.
 *   --json        emit JSON: { input, l, c, h, css }.
 *
 * Examples:
 *   oklch "#d81e0b"                  → oklch(0.5637 0.218 30.27)
 *   oklch "#d81e0b" --to obj --json  → {"input":"#d81e0b","l":0.5637…,"css":"oklch(…)"}
 *   oklch "oklch(0.56 0.22 30)" --from-oklch --to obj
 */
import {
  colorToOklch,
  oklchToCSS,
  parseOklch,
  type OklchColor,
} from '../_vendor/theme-math.ts';

interface Args {
  color: string | null;
  to: 'css' | 'obj';
  fromOklch: boolean;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { color: null, to: 'css', fromOklch: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--to' && (argv[i + 1] === 'css' || argv[i + 1] === 'obj')) {
      a.to = argv[++i] as 'css' | 'obj';
    } else if (flag === '--from-oklch') {
      a.fromOklch = true;
    } else if (flag === '--json') {
      a.json = true;
    } else if (!flag.startsWith('--') && a.color === null) {
      a.color = flag;
    }
  }
  return a;
}

export function convert(input: string, fromOklch: boolean): OklchColor {
  return fromOklch ? parseOklch(input) : colorToOklch(input);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!args.color) {
    console.error('Usage: oklch <color> [--to css|obj] [--from-oklch] [--json]');
    process.exit(1);
  }

  let ok: OklchColor;
  try {
    ok = convert(args.color, args.fromOklch);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
  }

  const css = oklchToCSS(ok);

  if (args.json) {
    console.log(JSON.stringify({ input: args.color, l: ok.l, c: ok.c, h: ok.h, css }));
    return;
  }
  if (args.to === 'obj') {
    console.log(JSON.stringify(ok));
  } else {
    console.log(css);
  }
}

if (import.meta.main) {
  main();
}
