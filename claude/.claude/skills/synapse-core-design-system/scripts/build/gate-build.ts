#!/usr/bin/env bun
/**
 * gate-build — Stages 5 & 8 build gate (G5/G8).
 *
 * Runs a target's OWN build, type-check, and test commands and returns ONE exit
 * code (0 = all green). It discovers those commands from the target's
 * package.json scripts (and, in a Turborepo, routes through turbo for a
 * workspace --filter), then shells out to them — `bun run build`, `bun run
 * typecheck`, `bun run test` (or `turbo run … --filter <pkg>`). It deliberately
 * does NOT fork a toolchain: no inline `tsc`/`next build`/`vitest` invocation,
 * no assumptions about the framework. The target already encodes how it builds;
 * reuse that (recompose-not-rewrite, L9). A package that renames `test` to
 * `test:ci` keeps working because we read the script map, never a hardcoded name.
 *
 * Output discipline (the graphify rule, SKILL §6): a build/test log is huge and
 * must NEVER land in the agent's context whole. This prints a one-line
 * pass/fail per step; on a FAILURE it prints only a bounded TAIL of that step's
 * combined output (the part that names the error), never the full log.
 *
 * Honesty contract (L13): green here proves the code EXISTS and compiles/tests —
 * never that it paints the design intent. Fidelity is judged at Stage 6 by the
 * review surface + impeccable + the operator, never by this gate and never by a
 * sub-agent (L16).
 *
 *   bun gate-build.ts --root <dir> [--filter <pkg>] [--steps build,typecheck,test]
 *                     [--tail <n>] [--dry-run] [--json]
 *
 * --root      target repo / monorepo root (must contain package.json)
 * --filter    workspace package to gate (Turborepo): routes each step through
 *             `turbo run <task> --filter <pkg>`. Ignored when no turbo.json.
 * --steps     which steps to run, in order (default: build,typecheck,test) — the
 *             nudge-knob; a docs-only package can gate just `build`.
 * --tail      lines of a failed step's output to surface (default 30)
 * --dry-run   discover + report the commands it WOULD run; runs nothing. Exits 0
 *             when every requested step resolved to a script, 1 if one cannot be
 *             discovered (a missing command is worth catching before the real run)
 * --json      emit the result object instead of the human summary
 *
 * Exit 0 = every discovered step ran green (or --dry-run).
 * Exit 1 = a step failed, or a requested step has no discoverable command.
 * Exit 2 = bad usage (no --root, or no package.json at --root).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The three gate steps, each with the script names we accept, best match first. */
const STEP_ALIASES: Record<string, string[]> = {
  build: ['build'],
  typecheck: ['typecheck', 'type-check', 'tsc', 'check-types', 'types'],
  test: ['test', 'test:run', 'test:ci'],
};
const DEFAULT_STEPS = ['build', 'typecheck', 'test'];
const DEFAULT_TAIL = 30;

export interface GateArgs {
  root: string;
  filter?: string;
  steps: string[];
  tail: number;
  dryRun: boolean;
}

export interface DiscoveredStep {
  /** The gate step name (build | typecheck | test). */
  step: string;
  /** The package.json script the alias resolved to, or null if none exists. */
  script: string | null;
  /** The argv that would be spawned (e.g. ['bun','run','build'] or turbo form). */
  command: string[];
  /** False when no script matched — a requested step we cannot satisfy. */
  resolved: boolean;
  /** True when routed through turbo (a --filter + turbo.json target). */
  viaTurbo: boolean;
}

export interface StepResult extends DiscoveredStep {
  ran: boolean;
  exitCode: number | null;
  ok: boolean;
  /** Bounded tail of combined stdout+stderr, present only on failure. */
  tail?: string;
}

export interface GateResult {
  root: string;
  filter: string | null;
  turbo: boolean;
  dryRun: boolean;
  steps: StepResult[];
  ok: boolean;
}

export function parseArgs(argv: string[]): GateArgs {
  const args: GateArgs = {
    root: '',
    steps: [...DEFAULT_STEPS],
    tail: DEFAULT_TAIL,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === '--root' && value) {
      args.root = value;
      i++;
    } else if (flag === '--filter' && value) {
      args.filter = value;
      i++;
    } else if (flag === '--steps' && value) {
      args.steps = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      i++;
    } else if (flag === '--tail' && value) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) args.tail = Math.floor(n);
      i++;
    } else if (flag === '--dry-run') {
      args.dryRun = true;
    }
  }
  return args;
}

/** Read a target's package.json `scripts` map (empty object if none/unreadable). */
export function readScripts(rootDir: string): Record<string, string> {
  const pkgPath = resolve(rootDir, 'package.json');
  if (!existsSync(pkgPath)) return {};
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
    return pkg.scripts ?? {};
  } catch {
    return {};
  }
}

/**
 * Decide each step's command without running it. For every requested step, pick
 * the first alias that exists in `scripts`; if a turbo workspace --filter is
 * active, route through `turbo run <task> --filter <pkg>` (turbo resolves the
 * package's own script — still reuse, not a fork), otherwise `bun run <script>`.
 */
export function discoverSteps(
  scripts: Record<string, string>,
  steps: string[],
  opts: { filter?: string; turbo: boolean }
): DiscoveredStep[] {
  const useTurbo = opts.turbo && !!opts.filter;
  return steps.map((step) => {
    const aliases = STEP_ALIASES[step] ?? [step];
    const script = aliases.find((name) => name in scripts) ?? null;
    if (!script) {
      return { step, script: null, command: [], resolved: false, viaTurbo: false };
    }
    const command = useTurbo
      ? ['bun', 'run', 'turbo', 'run', script, '--filter', opts.filter!]
      : ['bun', 'run', script];
    return { step, script, command, resolved: true, viaTurbo: useTurbo };
  });
}

/** Keep the last `n` non-empty-trimmed lines of a log (the part that names the error). */
function tailLines(text: string, n: number): string {
  const lines = text.replace(/\s+$/, '').split('\n');
  return lines.slice(Math.max(0, lines.length - n)).join('\n');
}

/** Run one discovered step from the target root; capture (don't stream) its log. */
function runStep(rootDir: string, ds: DiscoveredStep, tail: number): StepResult {
  if (!ds.resolved) {
    return { ...ds, ran: false, exitCode: null, ok: false };
  }
  const [cmd, ...rest] = ds.command;
  const proc = spawnSync(cmd, rest, { cwd: rootDir, encoding: 'utf8', stdio: 'pipe' });
  if (proc.error) {
    return {
      ...ds,
      ran: true,
      exitCode: 1,
      ok: false,
      tail: `failed to spawn: ${proc.error.message}`,
    };
  }
  const code = proc.status ?? 1;
  const ok = code === 0;
  const log = `${proc.stdout ?? ''}${proc.stderr ?? ''}`;
  return {
    ...ds,
    ran: true,
    exitCode: code,
    ok,
    ...(ok ? {} : { tail: tailLines(log, tail) }),
  };
}

/** Compose the gate: discover every step, then (unless dry-run) run them in order. */
export function gateBuild(args: GateArgs): GateResult {
  const rootDir = resolve(process.cwd(), args.root);
  const turbo = existsSync(resolve(rootDir, 'turbo.json'));
  const scripts = readScripts(rootDir);
  const discovered = discoverSteps(scripts, args.steps, { filter: args.filter, turbo });

  let steps: StepResult[];
  if (args.dryRun) {
    // Report-only: nothing is spawned. A requested step that resolved to a real
    // script reads as ok (it WOULD run); a requested-but-undiscoverable step
    // surfaces as resolved:false → not ok, so a dry-run still flags a missing
    // command before the operator commits to the real (expensive) run.
    steps = discovered.map((ds) => ({ ...ds, ran: false, exitCode: null, ok: ds.resolved }));
  } else {
    steps = discovered.map((ds) => runStep(rootDir, ds, args.tail));
  }

  const ok = steps.every((s) => s.ok);
  return {
    root: rootDir,
    filter: args.filter ?? null,
    turbo,
    dryRun: args.dryRun,
    steps,
    ok,
  };
}

function report(result: GateResult, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  const lines: string[] = [];
  const scope = result.filter ? ` · filter ${result.filter}${result.turbo ? ' (turbo)' : ''}` : '';
  lines.push(`gate-build — ${result.root}${scope}${result.dryRun ? '  [dry-run]' : ''}`);
  for (const s of result.steps) {
    if (!s.resolved) {
      lines.push(`  ✗ ${s.step.padEnd(10)} no script found (tried ${(STEP_ALIASES[s.step] ?? [s.step]).join(', ')})`);
      continue;
    }
    const verb = result.dryRun ? 'would run' : s.ok ? 'ok' : `FAIL (exit ${s.exitCode})`;
    lines.push(`  ${result.dryRun ? '·' : s.ok ? '✓' : '✗'} ${s.step.padEnd(10)} ${verb}  →  ${s.command.join(' ')}`);
  }
  // Failure tail(s): bounded, never the full log.
  if (!result.dryRun) {
    for (const s of result.steps) {
      if (s.ran && !s.ok && s.tail) {
        lines.push(`  ── ${s.step} output (tail) ──`);
        for (const l of s.tail.split('\n')) lines.push(`  ${l}`);
      }
    }
  }
  lines.push(result.ok ? (result.dryRun ? '  ✓ commands discovered' : '  ✓ build gate green') : '  ✗ build gate failed');
  process.stdout.write(`${lines.join('\n')}\n`);
}

function main(): void {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const args = parseArgs(argv);
  if (!args.root) {
    process.stderr.write(
      'Usage: gate-build.ts --root <dir> [--filter <pkg>] [--steps build,typecheck,test] [--tail <n>] [--dry-run] [--json]\n'
    );
    process.exit(2);
  }
  if (!existsSync(resolve(process.cwd(), args.root, 'package.json'))) {
    process.stderr.write(`gate-build: no package.json at --root ${args.root}\n`);
    process.exit(2);
  }
  const result = gateBuild(args);
  report(result, json);
  process.exit(result.ok ? 0 : 1);
}

if (import.meta.main) {
  main();
}
