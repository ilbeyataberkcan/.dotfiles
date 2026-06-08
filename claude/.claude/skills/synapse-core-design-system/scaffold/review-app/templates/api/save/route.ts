/*
 * DEV-ONLY save route — writes the live review document to <route>/review-feedback.json.
 *
 * The review surface is localStorage-first; this route is the ONE deliberate path that
 * persists the operator's annotations back to disk so the skill can read them. It exists
 * only so the "Save feedback" button writes the file directly instead of forcing a manual
 * browser-download drop. It is STRICTLY guarded:
 *
 *   - It refuses in production (NODE_ENV === 'production' → 404). The route must not ship
 *     as a live write endpoint on a deployed host.
 *   - It writes ONLY on this explicit POST. It never reads, resets, or touches the file on
 *     mount/import — importing this module has no side effects on review-feedback.json.
 *   - It validates the posted body against the synapse-review/2 shape BEFORE writing, so a
 *     malformed payload is rejected (400) rather than clobbering real annotations.
 *
 * feedback-store.saveToDisk() POSTs here first and falls back to a browser download when
 * the route is absent or refuses (non-dev / error). This file is emitted ONLY when the
 * scaffold runs with --dev-save-route; a generic host stays download-only.
 *
 * SCAFFOLD PARAMS (substituted on copy):
 *   __ROUTE_REL__  — the route dir, target-relative (e.g. app/review).
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const dynamic = 'force-dynamic';

const REVIEW_SCHEMA = 'synapse-review/2';

/** The on-disk target: <project>/<route>/review-feedback.json (cwd is the host root). */
const FEEDBACK_PATH = join(process.cwd(), '__ROUTE_REL__', 'review-feedback.json');

function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Minimal structural validation of the synapse-review/2 document. We don't re-validate
 *  every annotation field (the store already shapes them); we guard the load-bearing
 *  invariants so a stray/empty body can never overwrite the operator's file. */
function isReviewFeedback(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (b.schema !== REVIEW_SCHEMA) return false;
  if (typeof b.surfaceId !== 'string') return false;
  if (typeof b.round !== 'number') return false;
  if (!b.stages || typeof b.stages !== 'object') return false;
  if (!Array.isArray(b.annotations)) return false;
  if (!b.summary || typeof b.summary !== 'object') return false;
  return true;
}

export async function POST(request: Request): Promise<Response> {
  // Guard 1: never a live write endpoint in production.
  if (isProd()) {
    return new Response('Not found', { status: 404 });
  }

  // Guard 2: parse + validate the body before any write.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid JSON body' }, { status: 400 });
  }
  if (!isReviewFeedback(body)) {
    return Response.json(
      { ok: false, error: `body is not a ${REVIEW_SCHEMA} document` },
      { status: 400 },
    );
  }

  // Deliberate write: pretty JSON, trailing newline (matches the scaffold init + serialize).
  try {
    const serialized = JSON.stringify(body, null, 2) + '\n';
    await writeFile(FEEDBACK_PATH, serialized, 'utf8');
    return Response.json({ ok: true, path: FEEDBACK_PATH });
  } catch (err) {
    return Response.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
