/**
 * A single character in a picker block.
 *
 * The only required field is {@link PickerChar.char}. `name` unlocks the
 * inspector title and name search; `codePoint` is derived from `char` when
 * omitted.
 */
export interface PickerChar {
  /** The symbol itself. May be a surrogate pair for astral characters. */
  char: string;
  /** Human-readable Unicode name, e.g. `"UMBRELLA"`. Optional. */
  name?: string;
  /** Code point. Derived from {@link PickerChar.char} when omitted. */
  codePoint?: number;
}

/**
 * A named group of characters shown as one section (with a nav chip) in the
 * picker. Usually a Unicode block, but it can be any curated set.
 */
export interface PickerBlock {
  /** Label used for the nav chip and the sticky section header. */
  name: string;
  /**
   * The characters. A plain string is split into code points
   * (surrogate-safe); an array may mix bare symbols and {@link PickerChar}
   * objects.
   */
  characters: string | Array<string | PickerChar>;
  /** Optional `[first, last]` code-point range; derived from the characters otherwise. */
  range?: [number, number];
}

/** The data the picker renders: an array of blocks. */
export type BlockData = PickerBlock[];

/**
 * Anything the `include` option accepts: the block array directly, or a
 * (possibly async) function returning it. This keeps the core data-agnostic —
 * data can come from `unicode-picker/data`, a dynamic import, a fetch, or a
 * hardcoded literal.
 */
export type BlockSource = BlockData | (() => BlockData | Promise<BlockData>);
