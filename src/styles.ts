/**
 * Component CSS, ported from `design/unicode-picker.html` and scoped to the
 * shadow root. Design tokens are frozen on `:host`; the dark theme is applied
 * via `:host([data-theme='dark'])` and, for `auto`, a `prefers-color-scheme`
 * query.
 */
export const css = /* css */ `
:host {
  --bg:      oklch(97.5% 0.005 250);
  --surface: oklch(100% 0 0);
  --fg:      oklch(22% 0.02 240);
  --muted:   oklch(50% 0.018 240);
  --border:  oklch(89.5% 0.008 240);
  --accent:  oklch(50% 0.15 145);
  --accent-ink: oklch(99% 0 0);
  --accent-soft: color-mix(in oklab, var(--accent) 12%, transparent);
  --shadow: 0 8px 28px rgba(15, 22, 34, 0.10);
  --mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace;
  --glyph: system-ui, -apple-system, 'Segoe UI', 'Segoe UI Symbol', 'Noto Sans Symbols 2', 'Noto Sans Symbols', sans-serif;

  /* NB: do not set 'display' here — that would override the UA rule that hides
     a closed popover ([popover]:not(:popover-open){display:none}). */
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--fg);
  font: 14px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

:host([data-theme='dark']) {
  --bg:      oklch(17% 0.012 250);
  --surface: oklch(21.5% 0.014 250);
  --fg:      oklch(92.5% 0.006 250);
  --muted:   oklch(63% 0.012 250);
  --border:  oklch(30.5% 0.012 250);
  --accent:  oklch(72% 0.17 145);
  --accent-ink: oklch(18% 0.04 145);
  --accent-soft: color-mix(in oklab, var(--accent) 16%, transparent);
  --shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
}

@media (prefers-color-scheme: dark) {
  :host([data-theme='auto']) {
    --bg:      oklch(17% 0.012 250);
    --surface: oklch(21.5% 0.014 250);
    --fg:      oklch(92.5% 0.006 250);
    --muted:   oklch(63% 0.012 250);
    --border:  oklch(30.5% 0.012 250);
    --accent:  oklch(72% 0.17 145);
    --accent-ink: oklch(18% 0.04 145);
    --accent-soft: color-mix(in oklab, var(--accent) 16%, transparent);
    --shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  }
}

* { box-sizing: border-box; }

.root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }

/* header */
.top {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 14px; border-bottom: 1px solid var(--border); flex: none;
}
.brand {
  display: inline-flex; align-items: center; gap: 8px;
  font: 600 13px/1 var(--mono); white-space: nowrap;
}
.brand .logo { font-family: var(--glyph); font-size: 15px; }
.search { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; }
.search svg { position: absolute; left: 10px; color: var(--muted); pointer-events: none; }
.search input {
  width: 100%; padding: 9px 40px 9px 32px; font: 13px system-ui, sans-serif;
  color: var(--fg); background: var(--bg); border: 1px solid var(--border);
  border-radius: 8px; outline: none;
}
.search input::placeholder { color: var(--muted); }
.search input:focus-visible { border-color: color-mix(in oklab, var(--accent) 55%, var(--border)); }
.search kbd {
  position: absolute; right: 8px; font: 10.5px var(--mono); color: var(--muted);
  border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; pointer-events: none;
}
.iconbtn {
  flex: none; width: 34px; height: 34px; display: grid; place-items: center;
  border: 1px solid var(--border); border-radius: 8px; background: transparent;
  color: var(--fg); font-size: 15px; font-family: var(--glyph); cursor: pointer;
}
.iconbtn:hover { background: var(--bg); }

/* chips */
.chips {
  display: flex; gap: 6px; padding: 8px 12px; border-bottom: 1px solid var(--border);
  overflow-x: auto; flex: none; scrollbar-width: none;
}
.chips::-webkit-scrollbar { display: none; }
.chips button {
  flex: none; font: 500 12px/1 system-ui, sans-serif; color: var(--muted);
  background: transparent; border: 1px solid var(--border); border-radius: 999px;
  padding: 7px 12px; white-space: nowrap; cursor: pointer;
  transition: color 0.12s, background 0.12s, border-color 0.12s;
}
.chips button:hover { color: var(--fg); }
.chips button.active {
  color: var(--fg); background: var(--accent-soft);
  border-color: color-mix(in oklab, var(--accent) 45%, var(--border));
}

/* grid */
.grid {
  flex: 1; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth;
  overscroll-behavior: contain; scrollbar-color: var(--border) transparent; position: relative;
}
.grid::-webkit-scrollbar { width: 10px; }
.grid::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }
.blk > header {
  position: sticky; top: 0; z-index: 3; display: flex; align-items: baseline; gap: 10px;
  padding: 13px 22px 8px; background: color-mix(in oklab, var(--surface) 88%, transparent);
  backdrop-filter: blur(8px); border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
}
.blk h2 { margin: 0; font: 600 11px/1 system-ui, sans-serif; letter-spacing: 0.06em; text-transform: uppercase; }
.blk header code { font: 11px/1 var(--mono); color: var(--muted); font-variant-numeric: tabular-nums; }
.cells { display: flex; flex-wrap: wrap; gap: 2px; padding: 8px 22px 18px; }
.cells button {
  width: 38px; height: 38px; display: grid; place-items: center; font: 17px/1 var(--glyph);
  color: var(--fg); background: none; border: 0; border-radius: 6px; padding: 0; cursor: pointer;
  transition: transform 0.1s, background 0.1s, box-shadow 0.1s;
}
.cells button:hover {
  position: relative; z-index: 4; transform: scale(2); background: var(--surface);
  border-radius: 5px; box-shadow: var(--shadow), 0 0 0 1px var(--border);
}
.cells button:focus-visible { outline: 2px solid color-mix(in oklab, var(--accent) 65%, transparent); outline-offset: -2px; }
.cells button.sel { box-shadow: inset 0 0 0 2px var(--fg); background: color-mix(in oklab, var(--fg) 7%, transparent); }

.state { margin: 0; padding: 40px 22px; color: var(--muted); font-size: 13px; text-align: center; }

/* inspector */
.detail {
  flex: none; display: flex; align-items: center; flex-wrap: wrap; gap: 14px;
  min-height: 78px; padding: 12px 14px; border-top: 1px solid var(--border);
}
.dglyph {
  flex: none; width: 54px; height: 54px; display: grid; place-items: center;
  font: 30px/1 var(--glyph); background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
}
.dmeta { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 5px; }
.dmeta b { font: 600 12px/1.2 var(--mono); letter-spacing: 0.03em; }
.dmeta small { color: var(--muted); font-size: 12px; }
.codes { display: flex; flex-wrap: wrap; gap: 6px; }
.codes code {
  font: 11px/1 var(--mono); color: var(--muted); border: 1px solid var(--border);
  border-radius: 5px; padding: 4px 7px; cursor: pointer; transition: color 0.12s, background 0.12s;
}
.codes code:hover { color: var(--fg); background: var(--bg); }
.dactions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.btn { font: 600 13px/1 system-ui, sans-serif; border-radius: 8px; padding: 0 18px; height: 44px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--fg); }
.btn.ghost:hover:not(:disabled) { background: var(--bg); }
.btn.primary {
  color: var(--accent-ink);
  background: linear-gradient(to bottom, color-mix(in oklab, var(--accent) 90%, white), var(--accent));
  border: 1px solid color-mix(in oklab, var(--accent) 78%, black);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 2px 6px color-mix(in oklab, var(--accent) 35%, transparent);
}
.btn.primary:hover:not(:disabled) { filter: brightness(1.06); }
.btn.primary:active:not(:disabled) { transform: translateY(1px); box-shadow: none; }

@media (prefers-reduced-motion: reduce) {
  .grid { scroll-behavior: auto; }
  .cells button { transition: none; }
  .chips button { transition: none; }
}
`;
