/**
 * scaffold-seed tests — the generated literal must cover every slot-group
 * (present or commented) and pin values to the digest. Guards L11 (the contract
 * exposes every slot) and the determinism contract (same digest → same output).
 */
import { describe, expect, test } from 'bun:test';
import { scaffold } from './scaffold-seed.ts';

describe('scaffold-seed', () => {
  test('skeleton (no digest) still documents every slot-group', () => {
    const ts = scaffold({}, 'themeSeed');
    for (const slot of [
      'primary',
      'accents',
      'status',
      'fonts',
      'borderRadius',
      'shadows',
      'motion',
      'spacing',
      'typography',
      'defaultMode',
    ]) {
      expect(ts).toContain(slot);
    }
    expect(ts).toContain('export const themeSeed: ThemeSeed');
  });

  test('supplied values become active slots pinned to the source', () => {
    const ts = scaffold(
      {
        meta: { source: 'TMMAF DS', defaultMode: 'light' },
        primary: '#070708',
        accents: { primary: '#d81e0b', secondary: '#1e90ff' },
        borderRadius: { md: '8px' },
        fonts: { sans: { family: 'Inter' } },
      },
      'tmmafSeed',
    );
    expect(ts).toContain(`primary: '#d81e0b'`);
    expect(ts).toContain(`secondary: '#1e90ff'`);
    expect(ts).toContain(`borderRadius: {`);
    expect(ts).toContain(`md: '8px'`);
    expect(ts).toContain(`sans: { family: 'Inter' }`);
    expect(ts).toContain(`defaultMode: 'light'`);
    expect(ts).toContain('// TMMAF DS');
    expect(ts).toContain('export const tmmafSeed: ThemeSeed');
  });

  test('absent groups are emitted as commented placeholders, not dropped', () => {
    const ts = scaffold({ primary: '#000' }, 'themeSeed');
    // status/shadows/spacing absent → present but commented out.
    expect(ts).toMatch(/\/\/ status:/);
    expect(ts).toMatch(/\/\/ shadows:/);
    expect(ts).toMatch(/\/\/ spacing:/);
  });

  test('deterministic — same digest yields byte-identical output', () => {
    const digest = { primary: '#070708', accents: { primary: '#d81e0b' } };
    expect(scaffold(digest, 'themeSeed')).toBe(scaffold(digest, 'themeSeed'));
  });
});
