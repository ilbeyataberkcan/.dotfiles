#!/usr/bin/env bun
/**
 * derive-ramp — expand a single brand anchor into the package's full color
 * ramp, reusing the SAME generators the package ships (via `generateTheme` on
 * the `_vendor` snapshot — L9, no forked curve math), and report whether the
 * resulting chroma is monotonic.
 *
 * Why the monotonic check exists (L4): deriving a whole ramp from one hex is
 * lossy. When the anchor's own chroma is spliced into the algorithmic
 * lightness/chroma curve, the chroma can dip and then rise again across the
 * ramp (a visible "muddy" step). A curated ramp climbs to a peak and descends
 * cleanly. `--check-monotonic` surfaces this so the ONE place your judgment is
 * needed — picking a curated override anchor — is flagged, not guessed.
 *
 * The script does NOT decide for you; it derives the algorithmic ramp and tells
 * you if it's lossy. Everything mechanical (the OKLCH math, the step expansion,
 * the CSS strings) is the package's job, executed here, not re-derived.
 *
 * CLI:
 *   derive-ramp <anchorHex> [--kind accent|status|neutral] [--check-monotonic] [--json]
 *
 *   <anchorHex>         the brand anchor color (hex / rgb / hsl / oklch).
 *   --kind accent       (default) 10-step accent ramp.
 *   --kind status       10-step status ramp (+ surface + fg), via the error slot.
 *   --kind neutral      13-step neutral scale derived from the anchor hue.
 *   --check-monotonic   add a chroma-monotonicity verdict to the output.
 *   --json              emit JSON: { kind, anchor, ramp, monotonic?, chroma? }.
 *
 * Example:
 *   derive-ramp "#d81e0b" --kind accent --check-monotonic --json
 *     → { …, "monotonic": false }   (reproduces the L4 lossy-ramp finding)
 */
import {
  generateTheme,
  parseOklch,
  type ThemeSeed,
} from '../_vendor/theme-math.ts';

type Kind = 'accent' | 'status' | 'neutral';

interface Args {
  anchor: string | null;
  kind: Kind;
  checkMonotonic: boolean;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    anchor: null,
    kind: 'accent',
    checkMonotonic: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--kind') {
      const k = argv[++i];
      if (k === 'accent' || k === 'status' || k === 'neutral') a.kind = k;
    } else if (flag === '--check-monotonic') {
      a.checkMonotonic = true;
    } else if (flag === '--json') {
      a.json = true;
    } else if (!flag.startsWith('--') && a.anchor === null) {
      a.anchor = flag;
    }
  }
  return a;
}

/**
 * Derive the requested ramp by reusing the package's own generators: build a
 * full theme from a seed that places the anchor in the slot whose ramp we want,
 * then read that ramp out. This is the package's exact derivation — no curve
 * math is duplicated here.
 */
export function deriveRamp(anchor: string, kind: Kind): Record<string, string> {
  const seed: ThemeSeed = { primary: anchor, accents: { primary: anchor } };
  if (kind === 'accent') {
    return generateTheme(seed).colors.accents.primary as Record<string, string>;
  }
  if (kind === 'status') {
    const seeded: ThemeSeed = { ...seed, status: { error: anchor } };
    return generateTheme(seeded).colors.status.error as Record<string, string>;
  }
  // neutral — the anchor hue threads the 13-step neutral scale.
  return generateTheme(seed).colors.neutrals as Record<string, string>;
}

/** The numeric ramp-step keys in order, color-channel entries only. */
function rampStepKeys(ramp: Record<string, string>): string[] {
  return Object.keys(ramp)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b));
}

/** Pull the chroma channel out of each step's oklch() string, in step order. */
export function chromaSeries(ramp: Record<string, string>): number[] {
  return rampStepKeys(ramp).map((k) => parseOklch(ramp[k]).c);
}

/**
 * A curated ramp rises to a single peak then descends (unimodal). The
 * algorithmic ramp is non-monotonic when chroma dips and later rises again —
 * i.e. it has more than one "up" run, which paints a muddy mid-step (L4).
 *
 * Verdict: true (clean) iff the chroma series is unimodal — non-decreasing up
 * to its max index, then non-increasing after it. A tiny epsilon absorbs
 * rounding noise so equal-looking steps don't read as a false dip.
 */
export function isChromaMonotonic(chroma: number[]): boolean {
  if (chroma.length < 3) return true;
  const eps = 1e-4;
  let peak = 0;
  for (let i = 1; i < chroma.length; i++) {
    if (chroma[i] > chroma[peak]) peak = i;
  }
  for (let i = 1; i <= peak; i++) {
    if (chroma[i] < chroma[i - 1] - eps) return false; // dip before the peak
  }
  for (let i = peak + 1; i < chroma.length; i++) {
    if (chroma[i] > chroma[i - 1] + eps) return false; // rise after the peak
  }
  return true;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!args.anchor) {
    console.error(
      'Usage: derive-ramp <anchorHex> [--kind accent|status|neutral] [--check-monotonic] [--json]',
    );
    process.exit(1);
  }

  let ramp: Record<string, string>;
  try {
    ramp = deriveRamp(args.anchor, args.kind);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
  }

  const result: {
    kind: Kind;
    anchor: string;
    ramp: Record<string, string>;
    monotonic?: boolean;
    chroma?: number[];
  } = { kind: args.kind, anchor: args.anchor, ramp };

  if (args.checkMonotonic) {
    const chroma = chromaSeries(ramp);
    result.chroma = chroma;
    result.monotonic = isChromaMonotonic(chroma);
  }

  if (args.json) {
    console.log(JSON.stringify(result));
    return;
  }

  console.log(`${args.kind} ramp from ${args.anchor}:`);
  for (const [k, v] of Object.entries(ramp)) {
    console.log(`  ${k.padEnd(8)} ${v}`);
  }
  if (args.checkMonotonic) {
    console.log(
      result.monotonic
        ? '\n✓ chroma monotonic (unimodal) — algorithmic ramp is clean'
        : '\n⚠ chroma NOT monotonic — algorithmic ramp is lossy (L4); pick a curated override anchor',
    );
  }
}

if (import.meta.main) {
  main();
}
