import type {
  PickerOptions,
  PickerInstance,
  ShowOptions,
  Theme,
  InsertDetail,
  PickerEvent,
  PickerEventMap,
} from './types';
import type { ResolvedBlock, ResolvedChar } from './data/resolve';
import type { BlockData } from './data/types';
import { resolveBlocks } from './data/resolve';
import { buildShell, type Shell } from './view/shell';
import { GridController } from './view/grid';
import { css } from './styles';
import { el } from './util/dom';
import { escapeForms } from './util/escape';
import { toUnicodeNotation } from './util/codepoint';
import { openPopover, closePopover, positionPopover } from './util/popover';

export const INSERT_EVENT = 'unicode-picker:insert';
const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 480;

/**
 * Load the full dataset when no `include` is given. Kept out of the core bundle:
 * the IIFE build reads `window.UnicodePickerData` (the optional data script),
 * while the ESM build resolves the `unicode-picker/data` subpath at runtime. The
 * specifier is a variable so bundlers leave it external instead of inlining 2 MB.
 */
async function loadDefaultData(): Promise<BlockData> {
  const g = globalThis as { UnicodePickerData?: { all?: BlockData } };
  if (g.UnicodePickerData?.all) return g.UnicodePickerData.all;
  const specifier = 'unicode-picker/data';
  const mod = (await import(/* @vite-ignore */ specifier)) as { all: BlockData };
  return mod.all;
}

export class Picker implements PickerInstance {
  readonly element: HTMLElement;
  private readonly shadow: ShadowRoot;
  private readonly shell: Shell;
  private readonly grid: GridController;
  private readonly options: PickerOptions;
  private readonly listeners = new Map<PickerEvent, Set<(detail: unknown) => void>>();
  private readonly cleanups: Array<() => void> = [];

  private blocks: ResolvedBlock[] = [];
  private chipEls: HTMLButtonElement[] = [];
  private dataState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  private selected: { blockIndex: number; charIndex: number } | null = null;
  private open = false;

  constructor(options: PickerOptions = {}) {
    this.options = options;

    const host = document.createElement('div');
    host.setAttribute('popover', 'auto');
    host.style.width = `${options.width ?? DEFAULT_WIDTH}px`;
    host.style.height = `${options.height ?? DEFAULT_HEIGHT}px`;
    host.dataset.theme = options.theme ?? 'auto';
    this.element = host;

    this.shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    this.shadow.append(style);

    this.shell = buildShell();
    this.shadow.append(this.shell.root);

    this.grid = new GridController(this.shell.grid, {
      onSelect: (bi, ci) => this.select(bi, ci),
      onInsert: (bi, ci) => this.insert(bi, ci),
      onActiveBlock: (bi) => this.setActiveChip(bi),
    });

    this.wireEvents();
    this.updateInspector();
    this.updateThemeIcon();
  }

  // ---- lifecycle -----------------------------------------------------------

  append(parent: HTMLElement): this {
    parent.append(this.element);
    return this;
  }

  show(opts: ShowOptions = {}): this {
    if (!this.element.isConnected) document.body.append(this.element);
    void this.ensureData();
    openPopover(this.element);
    positionPopover(this.element, opts);
    if (!this.open) {
      this.open = true;
      this.emit('show', undefined);
    }
    return this;
  }

  hide(): this {
    closePopover(this.element);
    if (this.open) {
      this.open = false;
      this.emit('hide', undefined);
    }
    return this;
  }

  toggle(opts: ShowOptions = {}): this {
    return this.open ? this.hide() : this.show(opts);
  }

  destroy(): void {
    this.hide();
    this.grid.destroy();
    for (const off of this.cleanups) off();
    this.cleanups.length = 0;
    this.listeners.clear();
    this.element.remove();
  }

  // ---- events --------------------------------------------------------------

  on<E extends PickerEvent>(event: E, cb: (detail: PickerEventMap[E]) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(cb as (detail: unknown) => void);
    return () => set!.delete(cb as (detail: unknown) => void);
  }

  private emit<E extends PickerEvent>(event: E, detail: PickerEventMap[E]): void {
    const set = this.listeners.get(event);
    if (set) for (const cb of [...set]) cb(detail);
  }

  // ---- theme / search ------------------------------------------------------

  setTheme(theme: Theme): this {
    this.element.dataset.theme = theme;
    this.updateThemeIcon();
    return this;
  }

  /** Icon reflects the *effective* theme so `auto` shows the right glyph. */
  private updateThemeIcon(): void {
    this.shell.themeBtn.textContent = this.effectiveTheme() === 'dark' ? '☀' : '☾';
  }

  /** The theme actually in effect, resolving `auto` via `prefers-color-scheme`. */
  private effectiveTheme(): 'light' | 'dark' {
    const theme = this.element.dataset.theme;
    if (theme === 'dark' || theme === 'light') return theme;
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  search(query: string): this {
    if (this.shell.searchInput.value !== query) this.shell.searchInput.value = query;
    this.grid.setQuery(query);
    this.updateEmptyState(query);
    return this;
  }

  // ---- data ----------------------------------------------------------------

  private async ensureData(): Promise<void> {
    if (this.dataState === 'loading' || this.dataState === 'ready') return;
    this.dataState = 'loading';
    this.renderState('Loading characters…');
    try {
      const source = this.options.include ?? (await loadDefaultData());
      this.blocks = await resolveBlocks(source);
      this.dataState = 'ready';
      this.renderChips();
      this.grid.setBlocks(this.blocks);
    } catch (err) {
      this.dataState = 'error';
      this.renderState(`Failed to load characters: ${(err as Error).message}`);
    }
  }

  private renderState(message: string): void {
    this.shell.grid.replaceChildren(el('p', { class: 'state', textContent: message }));
  }

  private renderChips(): void {
    this.chipEls = this.blocks.map((block, i) =>
      el('button', {
        type: 'button',
        textContent: block.name,
        onclick: () => this.grid.scrollToBlock(i),
      })
    );
    this.shell.chips.replaceChildren(...this.chipEls);
    this.chipEls[0]?.classList.add('active');
  }

  private setActiveChip(index: number): void {
    this.chipEls.forEach((chip, i) => chip.classList.toggle('active', i === index));
    const active = this.chipEls[index];
    active?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  private updateEmptyState(query: string): void {
    const existing = this.shell.grid.querySelector('.state');
    if (this.dataState === 'ready' && this.grid.visibleCount() === 0) {
      const message = `No characters match “${query}”.`;
      if (existing) existing.textContent = message;
      else this.shell.grid.append(el('p', { class: 'state', textContent: message }));
    } else if (existing) {
      existing.remove();
    }
  }

  // ---- selection / insert / copy ------------------------------------------

  private charAt(
    blockIndex: number,
    charIndex: number
  ): { block: ResolvedBlock; char: ResolvedChar } {
    const block = this.blocks[blockIndex]!;
    return { block, char: block.chars[charIndex]! };
  }

  private detailOf(block: ResolvedBlock, char: ResolvedChar): InsertDetail {
    return {
      char: char.char,
      codePoint: char.codePoint,
      name: char.name,
      block: block.name,
      hex: toUnicodeNotation(char.codePoint),
    };
  }

  private select(blockIndex: number, charIndex: number): void {
    this.selected = { blockIndex, charIndex };
    const { block, char } = this.charAt(blockIndex, charIndex);
    this.updateInspector();
    this.emit('select', this.detailOf(block, char));
  }

  private insert(blockIndex: number, charIndex: number): void {
    const { block, char } = this.charAt(blockIndex, charIndex);
    const detail = this.detailOf(block, char);
    this.element.dispatchEvent(
      new CustomEvent(INSERT_EVENT, { detail, bubbles: true, composed: true })
    );
    this.options.onInsert?.(detail);
    this.emit('insert', detail);
  }

  private async copy(value: string, char: ResolvedChar): Promise<void> {
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      /* clipboard unavailable — still emit the event */
    }
    this.emit('copy', { value, char: char.char, codePoint: char.codePoint });
  }

  private updateInspector(): void {
    const { glyph, name, meta, codes, copyBtn, insertBtn } = this.shell.inspector;
    if (!this.selected) {
      glyph.textContent = '';
      name.textContent = 'No selection';
      meta.textContent = 'Click a character to inspect it.';
      codes.replaceChildren();
      copyBtn.disabled = true;
      insertBtn.disabled = true;
      return;
    }
    const { block, char } = this.charAt(this.selected.blockIndex, this.selected.charIndex);
    glyph.textContent = char.char;
    name.textContent = char.name || toUnicodeNotation(char.codePoint);
    const [start, end] = block.range;
    meta.textContent = `${block.name} · ${toUnicodeNotation(start)}–${toUnicodeNotation(end)} · decimal ${char.codePoint}`;

    const forms = escapeForms(char.codePoint);
    const chips = [char.char, forms.unicode, forms.html, forms.js, forms.css].map((value) =>
      el('code', {
        textContent: value,
        title: 'Click to copy',
        onclick: () => void this.copy(value, char),
      })
    );
    codes.replaceChildren(...chips);
    copyBtn.disabled = false;
    insertBtn.disabled = false;
  }

  // ---- wiring --------------------------------------------------------------

  private wireEvents(): void {
    const { searchInput, themeBtn, inspector } = this.shell;

    const onInput = () => this.search(searchInput.value);
    searchInput.addEventListener('input', onInput);
    this.cleanups.push(() => searchInput.removeEventListener('input', onInput));

    const onTheme = () => {
      // Flip the effective theme, so a single click always changes appearance
      // even when starting from `auto` (which may already resolve to dark).
      this.setTheme(this.effectiveTheme() === 'dark' ? 'light' : 'dark');
    };
    themeBtn.addEventListener('click', onTheme);
    this.cleanups.push(() => themeBtn.removeEventListener('click', onTheme));

    inspector.copyBtn.addEventListener('click', () => {
      if (this.selected) {
        const { char } = this.charAt(this.selected.blockIndex, this.selected.charIndex);
        void this.copy(char.char, char);
      }
    });
    inspector.insertBtn.addEventListener('click', () => {
      if (this.selected) this.insert(this.selected.blockIndex, this.selected.charIndex);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    };
    this.shadow.addEventListener('keydown', onKey as EventListener);
    this.cleanups.push(() => this.shadow.removeEventListener('keydown', onKey as EventListener));

    const onToggle = (e: Event) => {
      const state = (e as unknown as { newState?: string }).newState;
      if (state === 'closed' && this.open) {
        this.open = false;
        this.emit('hide', undefined);
      } else if (state === 'open' && !this.open) {
        this.open = true;
        this.emit('show', undefined);
      }
    };
    this.element.addEventListener('toggle', onToggle);
    this.cleanups.push(() => this.element.removeEventListener('toggle', onToggle));
  }
}
