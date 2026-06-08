// Crafted bad fixture — every audit should fire on at least one line here.
// (This is the FAILING tree; the clean packages are the PASSING tree.)

import { cva } from 'class-variance-authority';

// L13 cascade clash: a round radius + a sharp radius in ONE class list — the
// base rounded-md fights the sharp utility in the same run → wrong corner.
export const cardVariants = cva('rounded-md p-4 rounded-none bg-surface-raised', {
  variants: {
    edge: {
      sharp: 'rounded-none border border-default bg-surface-raised',
    },
    // L12 elevation: outline-only resting surface (visible border, no shadow/raise).
    boxed: 'bg-surface border border-default rounded-md',
    // Rule 1: a hairline cva key — banned by default (resting drawn edge).
    hairline: 'bg-surface-raised border border-subtle shadow-xs rounded-md',
    // unknown look token (escape-hatch outside the closed 7-token vocab).
    fancy: 'data-cve-look="glossy"',
  },
});

// L8 token-ref: text-status-error-fg has no token in the crafted theme.
// L14 leak: a baked tr-TR locale + a ₺ currency glyph + a brand default.
export function FederationFeeBadge({ price }: { price: number }) {
  const label = price.toLocaleString('tr-TR'); // baked locale leak
  const symbol = '₺'; // currency glyph leak
  return (
    <span
      className="text-status-error-fg shadow-signal bg-status-error-surface"
      style={{ color: 'var(--color-status-error-fg)' }} // unresolved var, no fallback
    >
      {symbol}
      {label}
    </span>
  );
}

// L2 naming: an exported name carrying a domain word.
export const tournamentBracket = { currency: 'TRY' }; // baked currency
