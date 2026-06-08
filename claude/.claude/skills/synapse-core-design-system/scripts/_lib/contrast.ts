// Self-contained OKLCH → sRGB → WCAG-contrast helper.
//
// The package's real OKLCH math (oklch.ts) leans on culori, which is not
// available from the skill store. For the contrast sub-routine of audit-all we
// only need the forward OKLCH→sRGB path plus the WCAG luminance formula, so we
// inline the standard matrices (Björn Ottosson's OKLab) rather than fork the
// package. _vendor/sync-vendor.ts (wave B1) pins the package's color source for
// the derive/emit scripts; this helper is the audit-only WCAG gate (L1/L4/L9).

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

/** Parse an `oklch(l c h)` or `oklch(l c h / a)` CSS string. Returns null if not oklch(). */
export function parseOklchCss(css: string): Oklch | null {
  const m = css
    .trim()
    .match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\s*\)$/i);
  if (!m) return null;
  let l = parseFloat(m[1]);
  if (m[1].endsWith('%')) l /= 100;
  const c = parseFloat(m[2]);
  const h = parseFloat(m[3]);
  if ([l, c, h].some((n) => Number.isNaN(n))) return null;
  return { l, c, h };
}

/** Parse a `#rgb`/`#rrggbb` hex string to linear-friendly sRGB [0,1] triplet, or null. */
export function parseHex(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

// OKLab → linear sRGB (Ottosson). Input OKLCH is converted to OKLab first.
function oklchToLinearSrgb(o: Oklch): [number, number, number] {
  const hr = (o.h * Math.PI) / 180;
  const a = Math.cos(hr) * o.c;
  const b = Math.sin(hr) * o.c;
  const L = o.l;

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;
  return [r, g, bl];
}

function srgbCompandToLinear(c: number): number {
  // Inverse of the sRGB gamma — input is gamma-encoded [0,1], output linear.
  const cc = Math.min(Math.max(c, 0), 1);
  return cc <= 0.04045 ? cc / 12.92 : ((cc + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance from a CSS color (oklch() or hex). null if unparseable. */
export function relativeLuminance(css: string): number | null {
  const ok = parseOklchCss(css);
  let linear: [number, number, number] | null = null;
  if (ok) {
    linear = oklchToLinearSrgb(ok); // already linear-light
  } else {
    const hex = parseHex(css);
    if (hex) linear = hex.map(srgbCompandToLinear) as [number, number, number];
  }
  if (!linear) return null;
  const [r, g, b] = linear.map((v) => Math.min(Math.max(v, 0), 1));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two CSS colors. Returns null if either is unparseable. */
export function contrastRatio(fg: string, bg: string): number | null {
  const lf = relativeLuminance(fg);
  const lb = relativeLuminance(bg);
  if (lf === null || lb === null) return null;
  const hi = Math.max(lf, lb);
  const lo = Math.min(lf, lb);
  return (hi + 0.05) / (lo + 0.05);
}
