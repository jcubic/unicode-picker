import type { BlockSource } from './data/types';

export type Theme = 'light' | 'dark' | 'auto';

export interface PickerOptions {
  /** Width in pixels. Default 380. */
  width?: number;
  /** Height in pixels. Default 480. */
  height?: number;
  /**
   * Where the characters come from. A {@link BlockSource}: an array of blocks,
   * or a (possibly async) function returning one. When omitted, the full
   * Unicode dataset is lazily loaded from `unicode-picker/data`.
   */
  include?: BlockSource;
  /** Colour theme. Default `'auto'` (follows `prefers-color-scheme`). */
  theme?: Theme;
  /** Convenience callback fired alongside the `unicode-picker:insert` event. */
  onInsert?: (detail: InsertDetail) => void;
}

export interface ShowOptions {
  /** Element to position the popover against. */
  anchor?: HTMLElement;
  /** Preferred side relative to the anchor. Default `'auto'`. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

/** Payload of the `insert` event / `onInsert` callback. */
export interface InsertDetail {
  char: string;
  codePoint: number;
  /** Character name, or `''` when the source provided none. */
  name: string;
  block: string;
  hex: string;
}

/** Payload of the `select` event. Same shape as {@link InsertDetail}. */
export type SelectDetail = InsertDetail;

/** Payload of the `copy` event. */
export interface CopyDetail {
  /** The text placed on the clipboard (the character or an escape form). */
  value: string;
  char: string;
  codePoint: number;
}

export interface PickerEventMap {
  insert: InsertDetail;
  select: SelectDetail;
  copy: CopyDetail;
  show: void;
  hide: void;
}

export type PickerEvent = keyof PickerEventMap;

export interface PickerInstance {
  /** Mount the picker into a parent element. */
  append(parent: HTMLElement): PickerInstance;
  /** Open the popover, optionally positioned against an anchor. */
  show(opts?: ShowOptions): PickerInstance;
  /** Close the popover. */
  hide(): PickerInstance;
  /** Toggle open/closed. */
  toggle(opts?: ShowOptions): PickerInstance;
  /** Subscribe to an event. Returns an unsubscribe function. */
  on<E extends PickerEvent>(event: E, cb: (detail: PickerEventMap[E]) => void): () => void;
  /** Change the colour theme. */
  setTheme(theme: Theme): PickerInstance;
  /** Filter the grid programmatically. */
  search(query: string): PickerInstance;
  /** Remove the picker from the DOM and release listeners. */
  destroy(): void;
  /** The picker host element (a Popover-API element with a shadow root). */
  readonly element: HTMLElement;
}
