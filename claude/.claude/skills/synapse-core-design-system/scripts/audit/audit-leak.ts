#!/usr/bin/env bun
// audit-leak — brand/locale leak grep over a neutral package's defaults (L13, L14).
//
// Why: green build + tsc + 1635 tests all passed while PriceDisplay/ProductCard
// baked `toLocaleString('tr-TR')` + `currency: '₺'`, and a CTA carried a brand
// hex/font. Type/existence gates can't see a brand smuggled into a "neutral"
// package via a formatter default or a literal. This is the grep that can (L14:
// neutral packages format with host-fed locale/currency, never baked symbols).
//
// CLI: audit-leak --scan <src> [--brand-hex "#d81e0b,#..."] [--brand-font "Barlow Condensed,..."] [--json]
// Out: file:line violations; exit 1 on any leak.

import { parseArgs, flagStr, flagList, readSources, stripComments, lineAt, emit, type Violation } from '../_lib/cli.ts';

// Hard-coded locale/currency leak signatures — these are universal neutrality
// failures, not brand-specific, so they need no flag.
const LEAK_PATTERNS: { rule: string; severity: 'CRITICAL' | 'HIGH'; re: RegExp; detail: (m: string) => string }[] = [
  // A baked BCP-47 locale string inside a formatter (the tr-TR finding).
  { rule: 'baked-locale', severity: 'CRITICAL', re: /(['"`])(?:[a-z]{2})-[A-Z]{2}\1/g, detail: (m) => `baked locale literal ${m} — format with host-fed locale (Intl.NumberFormat(undefined))` },
  // toLocaleString with an explicit locale arg (smuggles tr-TR even via a var).
  { rule: 'toLocaleString-locale', severity: 'HIGH', re: /toLocaleString\(\s*['"`][^'"`]+['"`]/g, detail: (m) => `${m} pins a locale in a neutral default — pass undefined and let the host decide` },
  // A baked currency code or symbol.
  { rule: 'baked-currency', severity: 'CRITICAL', re: /currency\s*:\s*(['"`])(?:[A-Z]{3}|[₺$€£¥₹])\1/g, detail: (m) => `${m} bakes a currency into a neutral package — currency is a host-override value` },
  // Bare currency glyphs in string literals (₺ ₹ € £ ¥ $ next to a value/var).
  { rule: 'currency-glyph', severity: 'HIGH', re: /(['"`])\s*[₺₹€£¥]\s*\1|(['"`])[₺₹€£¥]\$\{/g, detail: (m) => `currency glyph in a literal ${m} — the host supplies the symbol` },
];

async function main() {
  const { _, flags } = parseArgs(Bun.argv.slice(2));
  const src = flagStr(flags, 'scan') ?? _[0];
  const asJson = flags.text !== true; // JSON by default; --text for the human summary
  if (!src) {
    console.error('audit-leak: --scan <src> required');
    process.exit(2);
  }

  // Brand specifics are target-supplied (never hardcoded): the brand's own hexes
  // and display fonts must not appear in a NEUTRAL package's source.
  const brandHexes = flagList(flags, 'brand-hex').map((h) => h.toLowerCase());
  const brandFonts = flagList(flags, 'brand-font');

  const files = await readSources(src, { includeTests: flags['include-tests'] === true });
  const violations: Violation[] = [];

  for (const f of files) {
    // Scan code, not doc examples — a JSDoc @example showing `currency: 'USD'`
    // demonstrates host usage; only a baked default in real code is a leak.
    const code = stripComments(f.text);
    for (const p of LEAK_PATTERNS) {
      for (const m of code.matchAll(p.re)) {
        violations.push({ file: f.path, line: lineAt(code, m.index ?? 0), rule: p.rule, detail: p.detail(m[0]), severity: p.severity });
      }
    }
    // Brand hex anywhere in a default (case-insensitive literal match).
    for (const hex of brandHexes) {
      const re = new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      for (const m of code.matchAll(re)) {
        violations.push({ file: f.path, line: lineAt(code, m.index ?? 0), rule: 'brand-hex-in-default', detail: `brand color ${m[0]} hardcoded — brand color belongs in the host seed, not the neutral package`, severity: 'CRITICAL' });
      }
    }
    // Brand display font name appearing in a default.
    for (const font of brandFonts) {
      const re = new RegExp(font.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      for (const m of code.matchAll(re)) {
        violations.push({ file: f.path, line: lineAt(code, m.index ?? 0), rule: 'brand-font-in-default', detail: `brand font "${m[0]}" hardcoded — font family belongs in the host seed`, severity: 'CRITICAL' });
      }
    }
  }

  emit({ audit: 'audit-leak', ok: violations.length === 0, scanned: files.length, violations }, asJson);
}

main();
