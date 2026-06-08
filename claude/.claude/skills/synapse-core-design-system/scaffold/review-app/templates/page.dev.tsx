/*
 * /review — the dev-only review surface route (Server Component).
 *
 * This is the ONLY routable file of the surface. It is excluded from production
 * THREE ways (defense in depth):
 *   1. `pageExtensions` ternary in next.config.ts drops `*.dev.tsx` from the prod
 *      build entirely — this file is never compiled in production (primary lever).
 *   2. The shell + all stages live in the private `_components/` folder (leading
 *      underscore) — never routed even if a page file were placed there.
 *   3. The `notFound()` guard below — belt-and-suspenders; it never executes in a
 *      prod build (the file isn't compiled), but if this route ever leaks into a
 *      production bundle it 404s instead of rendering the surface.
 *
 * The shell itself is a client component (theme + engine providers + interaction);
 * this route stays a Server Component and just mounts it past the guard.
 */

import { notFound } from 'next/navigation';
import { ReviewShell } from './_components/ReviewShell';
import './_components/review.css'; // the review-surface chrome (host-style; L17)

export const dynamic = 'force-dynamic';

export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ReviewShell />;
}
