import { describe, it, expect, vi, beforeEach } from 'vitest';
import Picker, { INSERT_EVENT } from '../../src/index';
import type { PickerBlock } from '../../src/data/types';

const DATA: PickerBlock[] = [
  { name: 'Arrows', characters: [{ char: '←', name: 'LEFTWARDS ARROW' }, '↑', '→'] },
  { name: 'Symbols', characters: [{ char: '☂', name: 'UMBRELLA' }, '★'] },
];

function shadow(picker: { element: HTMLElement }): ShadowRoot {
  return picker.element.shadowRoot!;
}

async function waitForGrid(picker: { element: HTMLElement }): Promise<ShadowRoot> {
  const sr = shadow(picker);
  for (let i = 0; i < 50; i++) {
    if (sr.querySelector('.cells button')) return sr;
    await new Promise((r) => setTimeout(r, 0));
  }
  throw new Error('grid did not render');
}

describe('Picker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a host element with a shadow root and default sizing', () => {
    const picker = Picker({ include: DATA });
    expect(picker.element.shadowRoot).toBeTruthy();
    expect(picker.element.style.width).toBe('380px');
    expect(picker.element.style.height).toBe('480px');
    expect(picker.element.dataset.theme).toBe('auto');
  });

  it('applies width/height/theme options', () => {
    const picker = Picker({ include: DATA, width: 600, height: 700, theme: 'dark' });
    expect(picker.element.style.width).toBe('600px');
    expect(picker.element.style.height).toBe('700px');
    expect(picker.element.dataset.theme).toBe('dark');
  });

  it('append mounts into a parent', () => {
    const picker = Picker({ include: DATA });
    const host = document.createElement('div');
    document.body.append(host);
    picker.append(host);
    expect(host.contains(picker.element)).toBe(true);
  });

  it('renders blocks, chips and cells from the source on show', async () => {
    const picker = Picker({ include: DATA }).append(document.body).show();
    const sr = await waitForGrid(picker);
    expect(sr.querySelectorAll('.chips button')).toHaveLength(2);
    expect(sr.querySelectorAll('.blk')).toHaveLength(2);
    expect(sr.querySelectorAll('.cells button')).toHaveLength(5);
  });

  it('selecting a character updates the inspector and emits select', async () => {
    const picker = Picker({ include: DATA }).append(document.body).show();
    const sr = await waitForGrid(picker);
    const onSelect = vi.fn();
    picker.on('select', onSelect);

    const cell = sr.querySelector<HTMLButtonElement>('.cells button')!;
    cell.click();

    expect(cell.classList.contains('sel')).toBe(true);
    expect(sr.querySelector('.dmeta b')!.textContent).toBe('LEFTWARDS ARROW');
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ char: '←', name: 'LEFTWARDS ARROW', hex: 'U+2190', block: 'Arrows' })
    );
  });

  it('insert fires the callback, the on() event, and a composed DOM event', async () => {
    const onInsert = vi.fn();
    const picker = Picker({ include: DATA, onInsert }).append(document.body).show();
    const sr = await waitForGrid(picker);

    const domEvent = vi.fn();
    picker.element.addEventListener(INSERT_EVENT, domEvent as EventListener);
    const onEvent = vi.fn();
    picker.on('insert', onEvent);

    // select then click Insert
    sr.querySelectorAll<HTMLButtonElement>('.cells button')[3]!.click(); // ☂
    sr.querySelector<HTMLButtonElement>('.btn.primary')!.click();

    const expected = expect.objectContaining({ char: '☂', name: 'UMBRELLA', hex: 'U+2602' });
    expect(onInsert).toHaveBeenCalledWith(expected);
    expect(onEvent).toHaveBeenCalledWith(expected);
    expect(domEvent).toHaveBeenCalledTimes(1);
    const ev = domEvent.mock.calls[0]![0] as CustomEvent;
    expect(ev.composed).toBe(true);
    expect(ev.detail.char).toBe('☂');
  });

  it('double-click inserts directly', async () => {
    const onInsert = vi.fn();
    const picker = Picker({ include: DATA, onInsert }).append(document.body).show();
    const sr = await waitForGrid(picker);
    sr.querySelector<HTMLButtonElement>('.cells button')!.dispatchEvent(
      new Event('dblclick', { bubbles: true })
    );
    expect(onInsert).toHaveBeenCalledWith(expect.objectContaining({ char: '←' }));
  });

  it('search() filters cells and shows an empty state', async () => {
    const picker = Picker({ include: DATA }).append(document.body).show();
    const sr = await waitForGrid(picker);

    picker.search('umbrella');
    const visible = [...sr.querySelectorAll<HTMLButtonElement>('.cells button')].filter(
      (b) => !b.hidden
    );
    expect(visible.map((b) => b.textContent)).toEqual(['☂']);

    picker.search('zzzzz');
    expect(sr.querySelector('.state')!.textContent).toContain('No characters match');

    picker.search('');
    expect(sr.querySelector('.state')).toBeNull();
  });

  it('setTheme toggles the host attribute and icon', () => {
    const picker = Picker({ include: DATA });
    picker.setTheme('dark');
    expect(picker.element.dataset.theme).toBe('dark');
    expect(shadow(picker).querySelector('.iconbtn')!.textContent).toBe('☀');
  });

  it('theme toggle flips on the first click when auto resolves to dark', () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) =>
      ({ matches: /dark/.test(q), media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList) as typeof window.matchMedia;
    try {
      const picker = Picker({ include: DATA, theme: 'auto' });
      const btn = shadow(picker).querySelector<HTMLButtonElement>('.iconbtn')!;
      // auto currently resolves to dark, so the icon shows the "sun" (go light).
      expect(btn.textContent).toBe('☀');
      // First click must switch to light (not be a no-op).
      btn.click();
      expect(picker.element.dataset.theme).toBe('light');
      btn.click();
      expect(picker.element.dataset.theme).toBe('dark');
    } finally {
      window.matchMedia = original;
    }
  });

  it('on() returns an unsubscribe function', async () => {
    const picker = Picker({ include: DATA }).append(document.body).show();
    const sr = await waitForGrid(picker);
    const cb = vi.fn();
    const off = picker.on('select', cb);
    off();
    sr.querySelector<HTMLButtonElement>('.cells button')!.click();
    expect(cb).not.toHaveBeenCalled();
  });

  it('destroy removes the element from the DOM', () => {
    const picker = Picker({ include: DATA }).append(document.body);
    expect(document.body.contains(picker.element)).toBe(true);
    picker.destroy();
    expect(document.body.contains(picker.element)).toBe(false);
  });
});
