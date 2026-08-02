import type { ResolvedBlock, ResolvedChar } from '../data/resolve';
import { el } from '../util/dom';
import { toUnicodeNotation } from '../util/codepoint';

const CELL = 38;
const GAP = 2;
const ROW = CELL + GAP;
const PAD_X = 22 * 2;
const PAD_Y = 8 + 18;
/** Extra vertical margin (px) around the viewport kept populated. */
const BUFFER = 800;

export interface GridCallbacks {
  onSelect(blockIndex: number, charIndex: number): void;
  onInsert(blockIndex: number, charIndex: number): void;
  onActiveBlock(blockIndex: number): void;
}

interface Section {
  el: HTMLElement;
  cells: HTMLElement;
  block: ResolvedBlock;
  index: number;
  /** Indices of chars matching the current query, or null for "all". */
  matched: number[] | null;
  populated: boolean;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Renders blocks into the grid with block-level virtualization: only sections
 * within the scroll window (plus a buffer) hold real cell nodes; the rest keep
 * a reserved height so scroll geometry stays correct. Also owns cell selection
 * highlight, keyboard navigation, filtering, and scrollspy.
 */
export class GridController {
  private sections: Section[] = [];
  private query = '';
  private selectedKey: string | null = null;
  private frame = 0;
  private readonly onScroll = () => this.scheduleUpdate();

  constructor(
    private readonly grid: HTMLElement,
    private readonly cb: GridCallbacks
  ) {
    this.grid.addEventListener('scroll', this.onScroll, { passive: true });
    this.grid.addEventListener('keydown', (e) => this.onKeydown(e as KeyboardEvent));
  }

  setBlocks(blocks: ResolvedBlock[]): void {
    this.sections = blocks.map((block, index) => this.buildSection(block, index));
    this.grid.replaceChildren(...this.sections.map((s) => s.el));
    this.applyQuery(this.query);
    this.updateWindow();
  }

  setQuery(query: string): void {
    this.query = query;
    this.applyQuery(query);
    this.updateWindow();
  }

  scrollToBlock(index: number): void {
    this.sections[index]?.el.scrollIntoView({ block: 'start' });
    this.updateWindow();
  }

  /** Number of currently visible (matching) characters across all blocks. */
  visibleCount(): number {
    return this.sections.reduce(
      (n, s) => (s.el.hidden ? n : n + (s.matched?.length ?? s.block.count)),
      0
    );
  }

  destroy(): void {
    this.grid.removeEventListener('scroll', this.onScroll);
    if (this.frame) cancelAnimationFrame(this.frame);
  }

  // ---- building ------------------------------------------------------------

  private buildSection(block: ResolvedBlock, index: number): Section {
    const [start, end] = block.range;
    const cells = el('div', { class: 'cells' });
    const el0 = el(
      'section',
      { class: 'blk', id: slug(block.name), dataset: { block: block.name } },
      [
        el('header', {}, [
          el('h2', { textContent: block.name }),
          el('code', {
            textContent: `${toUnicodeNotation(start)}–${toUnicodeNotation(end)} · ${block.count}`,
          }),
        ]),
        cells,
      ]
    );
    return { el: el0, cells, block, index, matched: null, populated: false };
  }

  private applyQuery(query: string): void {
    const q = query.trim().toLowerCase();
    for (const s of this.sections) {
      if (q === '') {
        s.matched = null;
        s.el.hidden = false;
      } else {
        s.matched = [];
        s.block.chars.forEach((char, i) => {
          if (this.searchKey(s.block, char).includes(q)) s.matched!.push(i);
        });
        s.el.hidden = s.matched.length === 0;
      }
      // Reserve height for the (possibly filtered) cell count and drop nodes so
      // repopulation reflects the new filter.
      const count = s.matched?.length ?? s.block.count;
      s.cells.style.minHeight = `${this.reservedHeight(count)}px`;
      if (s.populated) this.depopulate(s);
    }
  }

  private searchKey(block: ResolvedBlock, char: ResolvedChar): string {
    return [char.char, char.name, block.name, toUnicodeNotation(char.codePoint), char.codePoint]
      .join(' ')
      .toLowerCase();
  }

  private reservedHeight(count: number): number {
    const per = this.perRow();
    const rows = Math.max(1, Math.ceil(count / per));
    return rows * ROW - GAP + PAD_Y;
  }

  private perRow(): number {
    const w = this.grid.clientWidth - PAD_X;
    return Math.max(1, Math.floor((w + GAP) / ROW));
  }

  // ---- virtualization ------------------------------------------------------

  private scheduleUpdate(): void {
    if (typeof requestAnimationFrame === 'undefined') {
      this.updateWindow();
      return;
    }
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.updateWindow();
    });
  }

  private updateWindow(): void {
    const scrollTop = this.grid.scrollTop;
    const viewH = this.grid.clientHeight;
    const top = scrollTop - BUFFER;
    const bottom = scrollTop + viewH + BUFFER;

    let active = -1;
    for (const s of this.sections) {
      if (s.el.hidden) continue;
      const off = s.el.offsetTop;
      const height = s.el.offsetHeight;
      if (active === -1 && off + height > scrollTop + 8) active = s.index;
      const inWindow = off < bottom && off + height > top;
      if (inWindow && !s.populated) this.populate(s);
      else if (!inWindow && s.populated) this.depopulate(s);
    }
    if (active === -1) active = this.sections.findIndex((s) => !s.el.hidden);
    if (active >= 0) this.cb.onActiveBlock(active);
  }

  private populate(s: Section): void {
    const indices = s.matched ?? s.block.chars.map((_, i) => i);
    const cells = indices.map((i) => this.buildCell(s, i));
    s.cells.replaceChildren(...cells);
    s.populated = true;
  }

  private depopulate(s: Section): void {
    s.cells.replaceChildren();
    s.populated = false;
  }

  private buildCell(s: Section, charIndex: number): HTMLButtonElement {
    const char = s.block.chars[charIndex]!;
    const key = `${s.index}:${charIndex}`;
    const cell = el('button', {
      type: 'button',
      textContent: char.char,
      title: char.name || toUnicodeNotation(char.codePoint),
      dataset: { key },
      onclick: () => this.select(s.index, charIndex, cell),
      ondblclick: () => this.cb.onInsert(s.index, charIndex),
    });
    if (key === this.selectedKey) {
      cell.classList.add('sel');
      cell.setAttribute('aria-pressed', 'true');
    }
    return cell;
  }

  // ---- selection -----------------------------------------------------------

  private select(blockIndex: number, charIndex: number, cell: HTMLButtonElement): void {
    this.markSelected(`${blockIndex}:${charIndex}`, cell);
    this.cb.onSelect(blockIndex, charIndex);
  }

  private markSelected(key: string, cell?: HTMLButtonElement): void {
    const prev = this.grid.querySelector<HTMLButtonElement>('.cells button.sel');
    if (prev) {
      prev.classList.remove('sel');
      prev.removeAttribute('aria-pressed');
    }
    this.selectedKey = key;
    const target =
      cell ?? this.grid.querySelector<HTMLButtonElement>(`.cells button[data-key="${key}"]`);
    if (target) {
      target.classList.add('sel');
      target.setAttribute('aria-pressed', 'true');
    }
  }

  // ---- keyboard ------------------------------------------------------------

  private onKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (!target.matches?.('.cells button')) return;
    const cells = [...this.grid.querySelectorAll<HTMLButtonElement>('.cells button')];
    const i = cells.indexOf(target as HTMLButtonElement);
    if (i < 0) return;
    const per = this.rowLength(cells, i);
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = i + 1;
    else if (e.key === 'ArrowLeft') next = i - 1;
    else if (e.key === 'ArrowDown') next = i + per;
    else if (e.key === 'ArrowUp') next = i - per;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = cells.length - 1;
    if (next === null) return;
    e.preventDefault();
    cells[Math.max(0, Math.min(cells.length - 1, next))]?.focus();
  }

  private rowLength(cells: HTMLButtonElement[], from: number): number {
    const top = cells[from]!.offsetTop;
    let count = 0;
    for (let i = from - (from % 64); i < cells.length; i++) {
      if (cells[i]!.offsetTop === top) count++;
      else if (count > 0) break;
    }
    return count || 1;
  }
}
