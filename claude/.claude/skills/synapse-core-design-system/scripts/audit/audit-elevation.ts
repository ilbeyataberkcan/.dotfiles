#!/usr/bin/env bun
// audit-elevation — separation = ELEVATION (shade + shadow + radius + breathing
// room), never a resting outline; and NO HAIRLINES by default.
//
// Why: the design voice is "separation = elevation". A resting element that
// draws a visible border as its separation reads as a boxed-in wireframe, not a
// lofted surface — the exact correction the package made. The earlier carve-out
// ("a named hairline look is allowed") is REMOVED: once one hairline is a
// sanctioned resting look it spreads and the elevation language dies by a
// thousand cuts. So a resting outline is now a violation FULL STOP, and so is
// any HAIRLINE token (variant="hairline" / data-cve-look~="hairline" /
// look:["hairline"] / a `hairline:` cva key / a resting `border` + border-subtle
// used as a bound). The ONLY escapes: (1) the edge sits under a STATE prefix
// (hover/focus/active/selected — outlines are state-only); (2) the operator
// explicitly opted in and marked the line `cve-allow-hairline`. Single-side
// seams (border-b/border-t dividers between two stacked surfaces) are NOT bounds
// and stay out of scope — the ban targets encapsulating resting outlines.
//
// CLI: audit-elevation --scan <src> [--json]
// Out: file:line of resting outlines + hairline tokens; exit 1.

import { parseArgs, flagStr, readSources, classRuns, lineAt, emit, type Violation } from '../_lib/cli.ts';

// A full (four-side) resting border — the encapsulating-outline shape the
// elevation rule forbids on a resting surface. Out of scope:
//   • single-side edges (border-b underline, border-t divider) — internal seams;
//   • semantic borders (status/accent/*-fg) — they carry meaning, not chrome;
//   • variant-prefixed borders (hover:/data-state:/…) — those are states.
const FULL_BORDER = /(?:^|\s)border\b(?!-[trblxytsel])(?:\s|$|[^-:])/; // `border` not `border-x`, not a `*:border` variant
// A neutral resting border COLOR used as a bound. `border-subtle` is now in the
// list: a subtle hairline IS the banned thing, not the sanctioned escape. A
// shadow/raised surface no longer licenses it — a resting drawn neutral edge is
// banned regardless of elevation (the hairline is the thing, not the surface).
const NEUTRAL_BORDER_COLOR = /\bborder-(?:subtle|default|strong|neutral-\d+)\b/;
const TRANSPARENT_BORDER = /\bborder-transparent\b/;
// A tinted/colored background IS the separation — a status callout, accent panel.
const HAS_TINT_BG = /\bbg-(?:status|accent)-/;
// A border carried only under a state/typography variant is not resting chrome —
// outlines ARE allowed under state (Rule 1: state-only). This is the escape.
const VARIANT_PREFIXED_BORDER = /(?:hover|focus|focus-visible|active|disabled|selected|group-[a-z-]+|peer-[a-z-]+|aria-selected|aria-\[[^\]]+\]|data-\[[^\]]+\]|data-state|prose-[a-z]+):border/;
// Hallmarks of an editable FORM CONTROL (input/select/textarea), which
// conventionally carries a resting border — not a content surface to flag.
const FORM_CONTROL = /\b(?:focus:ring|focus-visible:ring|placeholder:|focus:border|appearance-none|resize-y|resize-none|caret-)/;
// The explicit operator opt-in. A hairline/resting outline is permitted ONLY
// when the operator asked for it AND the line carries this marker — so every
// exception is visible and auditable, never a silent default.
const ALLOW_OPT_IN = /cve-allow-hairline/;

// HAIRLINE TOKENS — banned everywhere by default (not just on flat surfaces).
// A line matching one of these is a hairline-as-resting-look, the thing the ban
// removed. `~=`/`^=`/`*=`/`=` cover the space-list and plain forms of the attr.
const HAIRLINE_TOKENS: Array<{ re: RegExp; how: string }> = [
  { re: /\bvariant\s*=\s*["']hairline["']/, how: 'variant="hairline"' },
  { re: /\bdata-cve-look\b[~^*$|]?=\s*["'][^"']*\bhairline\b/, how: 'data-cve-look~="hairline"' },
  { re: /\blook\s*:\s*\[[^\]]*["']hairline["']/, how: 'look:["hairline"]' },
  { re: /^\s*hairline\s*:/, how: 'a `hairline:` cva variant key' },
];

async function main() {
  const { _, flags } = parseArgs(Bun.argv.slice(2));
  const src = flagStr(flags, 'scan') ?? _[0];
  const asJson = flags.text !== true;
  if (!src) {
    console.error('audit-elevation: --scan <src> required');
    process.exit(2);
  }

  const files = await readSources(src, { globs: ['**/*.ts', '**/*.tsx'], includeTests: flags['include-tests'] === true });
  const violations: Violation[] = [];

  const lines = (t: string) => t.split('\n');
  for (const f of files) {
    const fileLines = lines(f.text);

    // 1 · HAIRLINE TOKENS — line-scoped, banned regardless of surface/elevation.
    fileLines.forEach((lineText, i) => {
      if (ALLOW_OPT_IN.test(lineText)) return; // explicit operator opt-in
      for (const { re, how } of HAIRLINE_TOKENS) {
        if (re.test(lineText)) {
          violations.push({
            file: f.path,
            line: i + 1,
            rule: 'hairline-banned',
            detail: `${how} is a hairline (a resting drawn edge) — hairlines are banned by default; separate by elevation (shade + shadow + radius + breathing room). The only permitted hairline is one the operator explicitly asked for, marked \`cve-allow-hairline\` on the line.`,
            severity: 'MEDIUM',
          });
          break; // one finding per line is enough
        }
      }
    });

    // 2 · RESTING OUTLINE as a bound — a full neutral resting border used as the
    //     boundary, ANYWHERE (a shadow/raised surface no longer excuses it; the
    //     hairline is the banned thing). State prefixes and the opt-in escape.
    for (const run of classRuns(f.text)) {
      const lit = run.text;
      if (FORM_CONTROL.test(lit)) continue;           // inputs carry a resting border by convention
      const lineText = fileLines[lineAt(f.text, run.index) - 1] ?? '';
      if (ALLOW_OPT_IN.test(lineText)) continue;      // explicit operator opt-in
      const hasRestingBound =
        FULL_BORDER.test(lit) && NEUTRAL_BORDER_COLOR.test(lit) && !TRANSPARENT_BORDER.test(lit) && !VARIANT_PREFIXED_BORDER.test(lit);
      if (!hasRestingBound) continue;
      if (HAS_TINT_BG.test(lit)) continue;            // a tint IS the separation (status callout, accent panel)

      violations.push({
        file: f.path,
        line: lineAt(f.text, run.index),
        rule: 'outline-only-resting-surface',
        detail: `a visible resting border is the separation here — surfaces separate by elevation (shade + shadow + radius + breathing room), not an encapsulating outline. Outlines are STATE-ONLY (hover/focus/active/selected); a resting hairline is banned unless the operator explicitly opts in (\`cve-allow-hairline\`).`,
        severity: 'MEDIUM',
      });
    }
  }

  emit({ audit: 'audit-elevation', ok: violations.length === 0, scanned: files.length, violations }, asJson);
}

main();
