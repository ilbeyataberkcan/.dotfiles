/*
 * det-id — deterministic, UUID-format ids for the review surface (the hydration fix).
 *
 * THE BUG IT FIXES (a-now): the stages minted specimen / node / wrapper ids with
 * `crypto.randomUUID()` DURING RENDER (directly, and inside `useMemo` — which does
 * NOT persist server→client). The server render produced one set of ids and the
 * first client render produced a different set, so every `data-rv-id` and every CVE
 * node `id` (the engine stamps `id={node.id}` on the painted element) diverged →
 * React's "a tree hydrated but some attributes … didn't match" console error.
 *
 * THE FIX: derive each id DETERMINISTICALLY from a STABLE key (the specimen's
 * captureId, the font role, the screen id, the node's tree path). The same key yields
 * the same id on the server and the client, so the markup matches byte-for-byte and
 * the hydration error is gone — WITHOUT changing what the ids identify.
 *
 * UUID FORMAT IS REQUIRED: CVE `BaseNodeSchema.id` is `z.string().uuid()` (RFC 4122),
 * so `detId` must emit a VALID UUID string — not just any stable token. We hash the
 * key (FNV-1a, 128 bits across four 32-bit lanes), then format the digest as a
 * version-4 / variant-RFC4122 UUID. It is deterministic, collision-resistant enough
 * for a per-surface specimen catalog, and passes `z.string().uuid()`.
 *
 * No dependency, no Web Crypto, no async — pure string math, identical on both
 * runtimes. (`crypto.randomUUID()` stays correct for RUNTIME-only ids that never SSR,
 * e.g. the `anno_…` id minted in feedback-store when the operator drops a pin.)
 */

/** FNV-1a 32-bit over a seed string — fast, deterministic, dependency-free. */
function fnv1a(input: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    // h *= 16777619 (FNV prime) in 32-bit space, avoiding float precision loss.
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** 32-bit lane → 8 lowercase hex chars. */
function hex8(n: number): string {
  return (n >>> 0).toString(16).padStart(8, '0');
}

/**
 * A deterministic, RFC-4122-shaped (version 4, variant 10xx) UUID string derived
 * from `key`. Same key in → same UUID out, on every runtime. Distinct keys collide
 * only on a full 128-bit hash collision (irrelevant at catalog scale).
 *
 * Use a STABLE key that identifies the thing (e.g. `node/${captureId}`,
 * `font/${role}`, `screen/${id}`, or a tree path) — NEVER an index that can shift.
 */
export function detId(key: string): string {
  // Four independent FNV-1a lanes (different seeds) → 128 bits of digest.
  const a = fnv1a(key, 0x811c9dc5);
  const b = fnv1a(key, 0x1000193 ^ a);
  const c = fnv1a(key, 0x85ebca6b ^ b);
  const d = fnv1a(key, 0xc2b2ae35 ^ c);
  const h = hex8(a) + hex8(b) + hex8(c) + hex8(d); // 32 hex chars

  // Stamp the version (4) + variant (8|9|a|b) nibbles so it validates as a UUID.
  const v4 = '4' + h.slice(13, 16); // time-hi-and-version: '4' + 3 hex
  const variantNibble = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  const clk = variantNibble + h.slice(17, 20); // clock-seq: variant + 3 hex

  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${v4}-${clk}-${h.slice(20, 32)}`;
}
