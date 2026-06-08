// Shared CLI helpers for the audit/learn scripts.
// Reuse-first, zero deps beyond Bun built-ins: target inputs (src, theme css,
// brand values) always arrive as path/string ARGS at runtime, never hardcoded.

import { Glob } from 'bun';

export interface ParsedArgs {
  /** Positional (non-flag) args, in order. */
  _: string[];
  /** Flag values: --key value → { key: "value" }; bare --key → { key: true }. */
  flags: Record<string, string | true>;
}

/** Minimal, dependency-free flag parser. `--k v`, `--k=v`, and bare `--k` all work. */
export function parseArgs(argv: string[]): ParsedArgs {
  const _: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const body = tok.slice(2);
      const eq = body.indexOf('=');
      if (eq !== -1) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
          flags[body] = next;
          i++;
        } else {
          flags[body] = true;
        }
      }
    } else {
      _.push(tok);
    }
  }
  return { _, flags };
}

/** Read a flag as string, or undefined. `--list a,b` and repeated forms collapse to the raw string. */
export function flagStr(flags: Record<string, string | true>, key: string): string | undefined {
  const v = flags[key];
  return typeof v === 'string' ? v : undefined;
}

/** Read a comma-or-space separated flag into a trimmed, non-empty array. */
export function flagList(flags: Record<string, string | true>, key: string): string[] {
  const v = flagStr(flags, key);
  if (!v) return [];
  return v
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface SourceFile {
  path: string;
  text: string;
}

const DEFAULT_GLOBS = ['**/*.ts', '**/*.tsx', '**/*.css'];
const SKIP_DIR = /(^|\/)(node_modules|dist|build|coverage|\.next|\.turbo|__snapshots__|__tests__|__mocks__)(\/|$)/;
const TEST_FILE = /\.(test|spec|stories)\.[cm]?[jt]sx?$/;

export interface ReadOpts {
  globs?: string[];
  /** Include test/spec/story files. Audits exclude them by default — tests
   *  deliberately exercise locales/leaks (the tr-TR round-trip), so scanning
   *  them produces false positives that aren't real package defaults. */
  includeTests?: boolean;
}

/**
 * Walk a --src directory and read matching source files.
 * Skips build output, vendored deps, and (by default) test files so an audit
 * scans authored package source only.
 */
export async function readSources(
  srcDir: string,
  optsOrGlobs?: string[] | ReadOpts
): Promise<SourceFile[]> {
  const opts: ReadOpts = Array.isArray(optsOrGlobs) ? { globs: optsOrGlobs } : (optsOrGlobs ?? {});
  const globs = opts.globs ?? DEFAULT_GLOBS;
  const root = srcDir.replace(/\/$/, '');
  const seen = new Set<string>();
  const out: SourceFile[] = [];
  for (const g of globs) {
    const glob = new Glob(g);
    for await (const rel of glob.scan({ cwd: root, onlyFiles: true, dot: false })) {
      if (SKIP_DIR.test('/' + rel)) continue;
      if (!opts.includeTests && TEST_FILE.test(rel)) continue;
      const abs = `${root}/${rel}`;
      if (seen.has(abs)) continue;
      seen.add(abs);
      const text = await Bun.file(abs).text();
      out.push({ path: abs, text });
    }
  }
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}

/**
 * Blank out comments and string/JSDoc bodies that aren't real code, preserving
 * line numbers (replace content with spaces, keep newlines). Leak/naming audits
 * scan code intent, not doc examples — a JSDoc `@example` showing `currency:
 * 'USD'` is host usage, not a baked package default.
 */
export function stripComments(text: string): string {
  let out = '';
  let i = 0;
  const n = text.length;
  const keepLines = (s: string) => s.replace(/[^\n]/g, ' ');
  while (i < n) {
    const two = text.slice(i, i + 2);
    if (two === '//') {
      let j = i;
      while (j < n && text[j] !== '\n') j++;
      out += keepLines(text.slice(i, j));
      i = j;
    } else if (two === '/*') {
      let j = i + 2;
      while (j < n && text.slice(j, j + 2) !== '*/') j++;
      j = Math.min(j + 2, n);
      out += keepLines(text.slice(i, j));
      i = j;
    } else {
      out += text[i];
      i++;
    }
  }
  return out;
}

export interface ClassRun {
  /** The contiguous run of whitespace-separated class tokens. */
  text: string;
  /** Byte offset of the run's start in the source. */
  index: number;
}

// A single Tailwind/utility class token: optional variants (hover:, md:, group-…:,
// data-[…]:), an optional `!`/`-` prefix, the base, and an optional arbitrary
// value `[…]` or opacity `/40`. Adjacent tokens separated only by spaces form a
// run; anything else (a quote, `${`, `<`, newline-in-JSX, `=`) ends the run.
const CLASS_TOKEN = /(?:[a-z][a-z0-9-]*:|data-\[[^\]]*\]:|aria-\[[^\]]*\]:|group-[a-z-]+:|peer-[a-z-]+:|supports-\[[^\]]*\]:|\*:)*!?-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:\/[0-9]+)?(?:\[[^\]]*\])?/;

/**
 * Extract maximal runs of contiguous class tokens (a real class list as a
 * browser sees it). Matching whole string literals is unsafe for JSX template
 * strings — a backtick `className={`…`}` with `${}` interpolations makes a flat
 * literal regex swallow several unrelated class lists at once, so a `rounded-md`
 * on one element looks like it shares a list with a `rounded-none` ten lines
 * down (a false cascade clash). Token-runs are the correct unit: a clash is real
 * only inside ONE uninterrupted whitespace-separated run.
 */
export function classRuns(text: string): ClassRun[] {
  const runs: ClassRun[] = [];
  // Whitespace (incl. newlines) joins tokens of ONE class list — a multiline
  // `className="\n a \n b \n"` is a single list. The token regex never matches a
  // quote, `<`, `{`, `=` or `$`, so a run still breaks at an element/expression
  // boundary; newlines alone don't merge two separate className attributes.
  const re = new RegExp(`(?:${CLASS_TOKEN.source})(?:\\s+(?:${CLASS_TOKEN.source}))+`, 'g');
  for (const m of text.matchAll(re)) {
    // Require at least two utility-shaped tokens with a namespace separator so we
    // don't pick up prose ("the quick brown fox").
    if (/-/.test(m[0]) && /\b(?:flex|grid|rounded|bg|text|border|shadow|p|px|py|m|mx|my|w|h|gap|font|ring|items|justify|absolute|relative|inline|block|hidden|uppercase|leading|tracking|transition|hover|focus|data)\b/.test(m[0])) {
      runs.push({ text: m[0], index: m.index ?? 0 });
    }
  }
  return runs;
}

/**
 * Slice a balanced (...) group starting at the open-paren at `openIndex`.
 * Quote- and comment-aware so a `)` inside a string/comment doesn't end it early.
 * Returns the inner text (without the outer parens) or null if unbalanced.
 */
export function sliceBalanced(text: string, openIndex: number): { text: string; end: number } | null {
  if (text[openIndex] !== '(') return null;
  let depth = 0;
  let quote: string | null = null;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (ch === '/' && text[i + 1] === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i++; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return { text: text.slice(openIndex + 1, i), end: i };
    }
  }
  return null;
}

/** 1-based line number for a string offset — for file:line violation reports. */
export function lineAt(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

export interface Violation {
  file: string;
  line: number;
  rule: string;
  detail: string;
  /** CRITICAL | HIGH | MEDIUM — drives audit-all severity tiering. */
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface AuditResult {
  audit: string;
  ok: boolean;
  scanned: number;
  violations: Violation[];
  /** Optional extra fields a specific audit wants to surface in its JSON. */
  [k: string]: unknown;
}

/**
 * Print the result as JSON and exit nonzero on violation.
 * The single output contract every audit shares: machines parse JSON, the
 * exit code is the gate (L8/L13/L14 — a silent failure is the bug we guard).
 */
export function emit(result: AuditResult, asJson = true): never {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`${result.audit}: ${result.ok ? 'ok' : 'FAIL'} (${result.scanned} files, ${result.violations.length} violations)`);
    for (const v of result.violations) {
      console.log(`  ${v.severity ?? 'HIGH'}  ${v.file}:${v.line}  [${v.rule}] ${v.detail}`);
    }
  }
  process.exit(result.ok ? 0 : 1);
}
