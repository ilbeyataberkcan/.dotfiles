/*
 * review-chrome.js — the interactive behaviour of the review surface.
 *
 * This file is shipped verbatim by `build-review-surface.ts` (the generator) into
 * the output dir alongside review.html + review.css. It is INERT until the page
 * loads; it never fetches, never phones home — the operator's verdict serialises
 * to a downloadable/copyable feedback.json with NO backend (L16: the human is the
 * authority, and their feedback must travel as a plain file the fix step reads).
 *
 * It owns four things the static markup can't express on its own:
 *   1. Mode tabs        SOLO ⇄ MOCKUP  (+ theme / viewport / reduced-motion / filter)
 *   2. Wipe divider     drag the A/B handle to sweep rendered over reference
 *   3. Lightbox         click any pane to zoom to ~90vw/90vh
 *   4. Checklist        per-unit ✅/⚠️/❌ + note  →  feedback.json (download/copy)
 *
 * Everything it touches is namespaced under .rv-* / .dz-* and data-* attributes
 * the generator stamps; it reads the embedded manifest (window.__REVIEW__) for the
 * unit/axis catalogue so the serializer is complete and order-stable.
 */
(function () {
  "use strict";

  // The generator inlines the manifest here as <script>window.__REVIEW__ = {...}</script>
  // before this file loads. Fall back to DOM scraping if absent so the surface still works.
  var MANIFEST = (window.__REVIEW__ || {});
  var root = document.querySelector(".rv-root") || document.documentElement;

  // localStorage key is per-surface so two open surfaces don't clobber each other.
  var STORE_KEY = "rv-feedback:" + (MANIFEST.surfaceId || location.pathname);

  /* ── tiny helpers ───────────────────────────────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts || false); }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* ─────────────────────────────────────────────────────────────────────────
   * 1. CHROME — mode tabs, theme, viewport, reduced-motion, specimen filter
   * ──────────────────────────────────────────────────────────────────────── */
  function setMode(mode) {
    $all(".rv-mode").forEach(function (m) {
      m.classList.toggle("is-active", m.getAttribute("data-mode-panel") === mode);
    });
    $all('[data-chrome="mode"] .rv-seg').forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-value") === mode));
    });
    root.setAttribute("data-mode", mode);
    // Some controls only make sense in MOCKUP (viewport) vs SOLO (theme-solo) — toggle visibility.
    var vp = $('[data-chrome="viewport"]');
    if (vp) vp.hidden = mode !== "mockup";
  }

  function setTheme(theme) {
    // theme ∈ {paired, light, dark}. "paired" shows both stacked (the default).
    root.setAttribute("data-theme", theme);
    $all('[data-chrome="theme"] .rv-seg').forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-value") === theme));
    });
  }

  function setViewport(vp) {
    root.setAttribute("data-viewport", vp);
    $all('[data-chrome="viewport"] .rv-seg').forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-value") === vp));
    });
  }

  function bindChrome() {
    on($('[data-chrome="mode"]'), "click", function (e) {
      var b = e.target.closest(".rv-seg"); if (b) setMode(b.getAttribute("data-value"));
    });
    on($('[data-chrome="theme"]'), "click", function (e) {
      var b = e.target.closest(".rv-seg"); if (b) setTheme(b.getAttribute("data-value"));
    });
    on($('[data-chrome="viewport"]'), "click", function (e) {
      var b = e.target.closest(".rv-seg"); if (b) setViewport(b.getAttribute("data-value"));
    });
    on($('[data-chrome="reduced-motion"]'), "change", function (e) {
      root.setAttribute("data-reduced-motion", String(e.target.checked));
    });
    // Specimen filter: hide units whose key/label/category don't match the query.
    on($('[data-chrome="filter"]'), "input", function (e) {
      var q = e.target.value.trim().toLowerCase();
      $all(".rv-unit").forEach(function (u) {
        var hay = (u.getAttribute("data-search") || u.textContent || "").toLowerCase();
        u.hidden = q !== "" && hay.indexOf(q) === -1;
      });
    });
    // Sensible defaults: paired theme, SOLO mode, desktop.
    setMode(root.getAttribute("data-mode") || "solo");
    setTheme(root.getAttribute("data-theme") || "paired");
    setViewport(root.getAttribute("data-viewport") || "desktop");
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 2. WIPE DIVIDER — the single best, un-fakeable drift check (L16).
   *    Each unit carries view modes split | wipe | fade. In wipe, dragging the
   *    handle sets --rv-wipe (a %) which CSS clips the rendered layer to.
   * ──────────────────────────────────────────────────────────────────────── */
  function setUnitView(unit, view) {
    var split = $(".rv-split", unit);
    if (!split) return;
    split.setAttribute("data-view", view);
    $all(".rv-unit__views .rv-seg", unit).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-value") === view));
    });
  }

  function bindWipe(unit) {
    var split = $(".rv-split", unit);
    var handle = $(".rv-wipe-handle", unit);
    if (!split || !handle) return;

    var dragging = false;
    function pct(clientX) {
      var r = split.getBoundingClientRect();
      return clamp(((clientX - r.left) / r.width) * 100, 0, 100);
    }
    function apply(p) { split.style.setProperty("--rv-wipe", p + "%"); }

    function down(e) {
      if (split.getAttribute("data-view") !== "wipe") return;
      dragging = true;
      handle.setPointerCapture && e.pointerId != null && handle.setPointerCapture(e.pointerId);
      apply(pct(e.clientX != null ? e.clientX : (e.touches && e.touches[0].clientX)));
      e.preventDefault();
    }
    function move(e) {
      if (!dragging) return;
      apply(pct(e.clientX != null ? e.clientX : (e.touches && e.touches[0].clientX)));
    }
    function up() { dragging = false; }

    on(handle, "pointerdown", down);
    on(window, "pointermove", move);
    on(window, "pointerup", up);
    // Fallback for environments without Pointer Events.
    on(handle, "mousedown", down);
    on(window, "mousemove", move);
    on(window, "mouseup", up);
    on(handle, "touchstart", down, { passive: false });
    on(window, "touchmove", move, { passive: false });
    on(window, "touchend", up);

    // Keyboard nudge for accessibility / precise alignment.
    handle.tabIndex = 0;
    on(handle, "keydown", function (e) {
      var cur = parseFloat(getComputedStyle(split).getPropertyValue("--rv-wipe")) || 50;
      if (e.key === "ArrowLeft") { apply(clamp(cur - 2, 0, 100)); e.preventDefault(); }
      if (e.key === "ArrowRight") { apply(clamp(cur + 2, 0, 100)); e.preventDefault(); }
    });

    // Per-unit view switcher (split / wipe / fade).
    on($(".rv-unit__views", unit), "click", function (e) {
      var b = e.target.closest(".rv-seg"); if (b) setUnitView(unit, b.getAttribute("data-value"));
    });
    // Opacity-fade slider, when present.
    on($('[data-fade-slider]', unit), "input", function (e) {
      split.style.setProperty("--rv-fade", String(parseFloat(e.target.value) / 100));
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 3. LIGHTBOX — click any zoomable pane to inspect at ~90vw/90vh.
   * ──────────────────────────────────────────────────────────────────────── */
  function bindLightbox() {
    var box = $(".rv-lightbox");
    if (!box) return;
    var stage = $(".rv-lightbox__stage", box);

    function open(node) {
      stage.innerHTML = "";
      // Clone the pane content so the live one keeps its state.
      stage.appendChild(node.cloneNode(true));
      box.classList.add("is-open");
    }
    function close() { box.classList.remove("is-open"); stage.innerHTML = ""; }

    on(document, "click", function (e) {
      var z = e.target.closest(".rv-zoomable");
      if (z && !box.classList.contains("is-open")) {
        // Don't hijack clicks on the checklist controls living inside a unit.
        if (e.target.closest(".rv-check") || e.target.closest(".rv-wipe-handle")) return;
        open(z);
      }
    });
    on($(".rv-lightbox__close", box), "click", close);
    on(box, "click", function (e) { if (e.target === box) close(); });
    on(document, "keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 4. CHECKLIST → feedback.json  (NO backend — the operator's verdict is a file)
   *    State shape, stable + complete from the manifest:
   *      { surfaceId, generatedAt, ratedAt, units: {
   *          <captureId>: { axes: { voice:'ok'|'warn'|'bad'|null, ... }, note } } }
   * ──────────────────────────────────────────────────────────────────────── */
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch (_) { return null; }
  }
  function blankState() {
    var units = {};
    (MANIFEST.units || scrapeUnitIds()).forEach(function (id) {
      units[id] = { axes: blankAxes(), note: "" };
    });
    return {
      surfaceId: MANIFEST.surfaceId || location.pathname,
      generatedAt: MANIFEST.generatedAt || null,
      ratedAt: null,
      units: units,
    };
  }
  function blankAxes() {
    var a = {};
    AXES().forEach(function (ax) { a[ax] = null; });
    return a;
  }
  // Fixed, intent-derived axes (RESEARCH §5). The generator may extend via manifest.axes.
  function AXES() {
    return MANIFEST.axes || [
      "voice", "elevation", "media-drama", "rhythm", "color-budget", "both-mode-parity",
    ];
  }
  function scrapeUnitIds() {
    return $all(".rv-unit[data-capture-id]").map(function (u) {
      return u.getAttribute("data-capture-id");
    });
  }

  var state = loadState() || blankState();

  function persist() {
    state.ratedAt = new Date().toISOString();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
    refreshProgress();
  }

  function bindChecklist() {
    // Verdict buttons.
    on(document, "click", function (e) {
      var btn = e.target.closest(".rv-verdict button");
      if (!btn) return;
      var unitEl = btn.closest(".rv-unit");
      var axisEl = btn.closest(".rv-axis");
      if (!unitEl || !axisEl) return;
      var id = unitEl.getAttribute("data-capture-id");
      var axis = axisEl.getAttribute("data-axis");
      var v = btn.getAttribute("data-v"); // ok | warn | bad
      if (!state.units[id]) state.units[id] = { axes: blankAxes(), note: "" };
      // Toggle off if re-clicking the active verdict.
      var cur = state.units[id].axes[axis];
      state.units[id].axes[axis] = cur === v ? null : v;
      // Repaint the group's pressed state.
      $all(".rv-verdict button", axisEl).forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === state.units[id].axes[axis]));
      });
      persist();
    });
    // Annotation notes.
    on(document, "input", function (e) {
      var ta = e.target.closest(".rv-check__note");
      if (!ta) return;
      var unitEl = ta.closest(".rv-unit");
      if (!unitEl) return;
      var id = unitEl.getAttribute("data-capture-id");
      if (!state.units[id]) state.units[id] = { axes: blankAxes(), note: "" };
      state.units[id].note = ta.value;
      persist();
    });
    // Rehydrate the UI from saved state on load.
    Object.keys(state.units).forEach(function (id) {
      var unitEl = $('.rv-unit[data-capture-id="' + cssEscape(id) + '"]');
      if (!unitEl) return;
      var u = state.units[id];
      Object.keys(u.axes || {}).forEach(function (axis) {
        var axisEl = $('.rv-axis[data-axis="' + cssEscape(axis) + '"]', unitEl);
        if (!axisEl) return;
        $all(".rv-verdict button", axisEl).forEach(function (b) {
          b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === u.axes[axis]));
        });
      });
      var note = $(".rv-check__note", unitEl);
      if (note) note.value = u.note || "";
    });
  }

  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&");
  }

  /* Progress + export dock. */
  function ratedCount() {
    var n = 0;
    Object.keys(state.units).forEach(function (id) {
      var ax = state.units[id].axes || {};
      var touched = Object.keys(ax).some(function (k) { return ax[k] != null; }) ||
        (state.units[id].note || "").trim() !== "";
      if (touched) n++;
    });
    return n;
  }
  function refreshProgress() {
    var el = $('[data-dock="progress"]');
    if (!el) return;
    var total = Object.keys(state.units).length;
    el.innerHTML = "<b>" + ratedCount() + "</b> / " + total + " units rated";
  }

  function serialize() {
    state.ratedAt = new Date().toISOString();
    return JSON.stringify(state, null, 2);
  }
  function download() {
    var blob = new Blob([serialize()], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "feedback.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("feedback.json downloaded");
  }
  function copy() {
    var text = serialize();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast("feedback.json copied"); });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("feedback.json copied"); } catch (_) {}
      ta.remove();
    }
  }
  function toast(msg) {
    var t = $(".rv-toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-shown");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("is-shown"); }, 1800);
  }

  function bindDock() {
    on($('[data-dock="download"]'), "click", download);
    on($('[data-dock="copy"]'), "click", copy);
    refreshProgress();
  }

  /* ── boot ───────────────────────────────────────────────────────────────── */
  function init() {
    bindChrome();
    $all(".rv-unit").forEach(bindWipe);
    bindLightbox();
    bindChecklist();
    bindDock();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
