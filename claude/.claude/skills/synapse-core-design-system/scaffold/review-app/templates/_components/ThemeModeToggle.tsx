'use client';

/*
 * ThemeModeToggle — the custom ☀/☾ toggle for the review chrome.
 *
 * Drives the host's single cve `<ThemeMode>` provider (attribute mode). The review owns
 * NO provider; this toggle calls `useReviewMode().toggle()` (which drives cve
 * `useThemeMode`), so cve `ThemeMode` writes `data-theme` on <html>. That re-resolves the
 * `<ThemeInjector>`-emitted `<style>` block's [data-theme] token blocks for the whole
 * document, so the live specimens AND the `.rv-*` chrome re-paint together — no reload,
 * everything flips. We do NOT use the package `ThemeToggle`: it hard-codes dark-surface
 * Tailwind classes + emoji + a Radix dropdown that assumes dark chrome and would mount
 * its own theme state — the very second-provider problem this avoids.
 *
 * HYDRATION: cve `ThemeMode` resolves the persisted / system preference in a mount effect,
 * so the resolved mode is the one value that legitimately differs between SSR and the
 * post-mount client. `useReviewMode` gates that behind a `mounted` flag and reports the
 * deterministic host default ('light' → ☀) until mount, so the first client render
 * matches the server byte-for-byte. The button stays interactive throughout.
 */

import { useReviewMode } from './useReviewMode';

export function ThemeModeToggle() {
  // Single seam onto the host provider; `mode` is the deterministic 'light' until mount.
  const { mode, toggle } = useReviewMode();
  const isDark = mode === 'dark';
  return (
    <button
      type="button"
      className="rv-mode-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={toggle}
    >
      <span className="rv-mode-icon" aria-hidden>
        {isDark ? '☾' : '☀'}
      </span>
      <span className="rv-mode-label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
