import { el, svg } from '../util/dom';

/** References to the mutable parts of the picker DOM. */
export interface Shell {
  root: HTMLElement;
  searchInput: HTMLInputElement;
  themeBtn: HTMLButtonElement;
  chips: HTMLElement;
  grid: HTMLElement;
  inspector: {
    glyph: HTMLElement;
    name: HTMLElement;
    meta: HTMLElement;
    codes: HTMLElement;
    copyBtn: HTMLButtonElement;
    insertBtn: HTMLButtonElement;
  };
}

const SEARCH_ICON =
  '<circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
  '<line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';

/** Build the static picker skeleton and return references to its live parts. */
export function buildShell(): Shell {
  const searchInput = el('input', {
    type: 'search',
    placeholder: 'Search: name, block, or U+2602…',
    'aria-label': 'Search characters',
  });

  const themeBtn = el('button', {
    class: 'iconbtn',
    type: 'button',
    title: 'Toggle theme',
    'aria-label': 'Toggle theme',
    textContent: '☾',
  });

  const chips = el('nav', { class: 'chips', 'aria-label': 'Unicode blocks' });
  const grid = el('main', { class: 'grid', tabindex: '-1' });

  const glyph = el('div', { class: 'dglyph' });
  const name = el('b', {});
  const meta = el('small', {});
  const codes = el('div', { class: 'codes' });
  const copyBtn = el('button', {
    class: 'btn ghost',
    type: 'button',
    textContent: 'Copy character',
  });
  const insertBtn = el('button', { class: 'btn primary', type: 'button', textContent: 'Insert ↩' });

  const root = el('div', { class: 'root' }, [
    el('header', { class: 'top' }, [
      el('span', { class: 'brand' }, [
        el('span', { class: 'logo', textContent: '❖' }),
        document.createTextNode('unicode-picker'),
      ]),
      el('div', { class: 'search' }, [
        svg(15, 15, SEARCH_ICON),
        searchInput,
        el('kbd', { textContent: '/' }),
      ]),
      themeBtn,
    ]),
    chips,
    grid,
    el('footer', { class: 'detail' }, [
      glyph,
      el('div', { class: 'dmeta' }, [name, meta, codes]),
      el('div', { class: 'dactions' }, [copyBtn, insertBtn]),
    ]),
  ]);

  return {
    root,
    searchInput,
    themeBtn,
    chips,
    grid,
    inspector: { glyph, name, meta, codes, copyBtn, insertBtn },
  };
}
