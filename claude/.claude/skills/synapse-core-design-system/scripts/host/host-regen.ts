#!/usr/bin/env bun
/**
 * host-regen — Stage 8 (host adoption) thin wrapper.
 *
 * Runs a target host's own `tokens:generate` (the host-side emit-theme-css:
 * the host's package.json script that invokes the codegen CLI on `theme-seed.ts`),
 * then greps the freshly-written `theme.generated.css` to confirm the seeded
 * brand tokens actually landed. A stale or default CSS — a regen that silently
 * no-op'd — fails the grep, so this is the host counterpart of
 * `emit-theme-css --check`: regen + proof-it-reached-CSS in one gate (L9).
 *
 * It deliberately does NOT import the skill's `color/emit-theme-css.ts`. The
 * host owns its emit path (TMMAF resolves the codegen CLI from `node_modules`,
 * cve-test-host from a workspace `../../packages/...`); re-deriving that here
 * would fork it. Reuse-first means delegating to the host's `tokens:generate`,
 * never hardcoding the codegen invocation (L9, recompose-not-rewrite).
 *
 *   bun host-regen.ts --host <hostDir> [--out <css>] [--expect tok,tok] [--no-regen] [--json]
 *
 * --host       host repo root (must contain package.json with a tokens:generate script)
 * --out        generated CSS path, relative to --host (default app/theme.generated.css)
 * --expect     comma-separated token substrings that MUST be present post-regen
 *              (default: --color-accent-primary-500, --color-neutral-500 — the
 *              brand hue lands in accent-primary, the widened neutral in neutral-500)
 * --no-regen   skip `tokens:generate`, only grep an already-written CSS (test/dry-run)
 * --json       emit the result object instead of the human summary
 *
 * Exit 0 = regen ran (unless --no-regen) AND every expected token is present.
 * Exit 1 = regen failed, the CSS is missing, or a seeded token did not land.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface HostRegenArgs {
  host: string;
  out: string;
  expect: string[];
  regen: boolean;
}

export interface HostRegenResult {
  host: string;
  cssPath: string;
  regenerated: boolean;
  regenExitCode: number | null;
  present: string[];
  missing: string[];
  ok: boolean;
}

const DEFAULT_OUT = 'app/theme.generated.css';
const DEFAULT_EXPECT = ['--color-accent-primary-500', '--color-neutral-500'];

export function parseArgs(argv: string[]): HostRegenArgs {
  const args: HostRegenArgs = {
    host: '',
    out: DEFAULT_OUT,
    expect: [...DEFAULT_EXPECT],
    regen: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === '--host' && value) {
      args.host = value;
      i++;
    } else if (flag === '--out' && value) {
      args.out = value;
      i++;
    } else if (flag === '--expect' && value) {
      args.expect = value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      i++;
    } else if (flag === '--no-regen') {
      args.regen = false;
    }
  }
  return args;
}

/** Run the host's own `tokens:generate` from its repo root. */
function runTokensGenerate(hostDir: string): number {
  const proc = spawnSync('bun', ['run', 'tokens:generate'], {
    cwd: hostDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (proc.error) {
    process.stderr.write(`host-regen: failed to spawn tokens:generate — ${proc.error.message}\n`);
    return 1;
  }
  if (proc.stderr) process.stderr.write(proc.stderr);
  return proc.status ?? 1;
}

/** Compose: (optionally) regenerate, then grep the seeded tokens out of the emitted CSS. */
export function hostRegen(args: HostRegenArgs): HostRegenResult {
  const hostDir = resolve(process.cwd(), args.host);
  const cssPath = resolve(hostDir, args.out);

  let regenExitCode: number | null = null;
  if (args.regen) {
    regenExitCode = runTokensGenerate(hostDir);
  }

  const present: string[] = [];
  const missing: string[] = [];
  let css = '';
  if (existsSync(cssPath)) {
    css = readFileSync(cssPath, 'utf8');
    for (const tok of args.expect) {
      (css.includes(tok) ? present : missing).push(tok);
    }
  } else {
    // No CSS to grep — every expected token is missing.
    missing.push(...args.expect);
  }

  const regenOk = !args.regen || regenExitCode === 0;
  const ok = regenOk && existsSync(cssPath) && missing.length === 0;

  return {
    host: hostDir,
    cssPath,
    regenerated: args.regen,
    regenExitCode,
    present,
    missing,
    ok,
  };
}

function report(result: HostRegenResult, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  const lines: string[] = [];
  lines.push(`host-regen — ${result.host}`);
  if (result.regenerated) {
    lines.push(`  tokens:generate exit ${result.regenExitCode}`);
  } else {
    lines.push(`  tokens:generate skipped (--no-regen)`);
  }
  lines.push(`  css: ${result.cssPath}`);
  if (result.present.length) lines.push(`  landed: ${result.present.join(', ')}`);
  if (result.missing.length) lines.push(`  MISSING: ${result.missing.join(', ')}`);
  lines.push(result.ok ? '  ✓ seeded tokens reached CSS' : '  ✗ seeded tokens did not land');
  process.stdout.write(`${lines.join('\n')}\n`);
}

function main(): void {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const args = parseArgs(argv);
  if (!args.host) {
    process.stderr.write('Usage: host-regen.ts --host <hostDir> [--out <css>] [--expect t,t] [--no-regen] [--json]\n');
    process.exit(1);
  }
  const result = hostRegen(args);
  report(result, json);
  process.exit(result.ok ? 0 : 1);
}

if (import.meta.main) {
  main();
}
