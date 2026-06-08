// Crafted CLEAN fixture for audit-elevation — proves the no-hairline rule does
// NOT false-positive on legitimate elevation-based separation. Every surface
// here separates by shade + shadow + radius + breathing room, outlines appear
// only under state, dividers are single-side seams, and the one resting outline
// is the explicit operator opt-in. audit-elevation must exit 0 on this tree.

import { cva } from 'class-variance-authority';

// Separation = elevation: raised surface + shadow + radius, NO resting border.
export const cardVariants = cva('rounded-md p-6', {
  variants: {
    variant: {
      // Elevation only — shade + shadow + radius. No drawn edge at rest.
      flat: 'bg-surface-raised shadow-sm border border-transparent',
      elevated: 'bg-surface-raised shadow-md hover:shadow-lg',
    },
    // A transparent placeholder that only colors the edge under a STATE — the
    // sanctioned state-only outline (Rule 1).
    selectable: {
      true: 'border border-transparent hover:border-strong focus-visible:border-strong',
      false: '',
    },
  },
});

// A status callout: the TINT is the separation (not a chrome outline).
export const calloutVariants = cva('rounded-md p-4 bg-status-info-surface border border-status-info', {});

// A single-side seam between two stacked surfaces — a divider, NOT a bound.
export const rowVariants = cva('flex items-center gap-4 border-b border-subtle py-4 last:border-b-0', {});

// The ONE permitted resting outline: the operator explicitly asked for it, so it
// carries the opt-in marker on the line and is allowed.
export const legalBox = 'bg-surface border border-default rounded-md p-4'; // cve-allow-hairline
