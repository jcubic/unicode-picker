import type { BlockSource, PickerBlock } from './types';
import { charToCodePoint, splitCodePoints } from '../util/codepoint';

/** A fully-normalized character, ready to render. */
export interface ResolvedChar {
  char: string;
  codePoint: number;
  /** Empty string when the source provided no name. */
  name: string;
}

/** A fully-normalized block, with derived range and count. */
export interface ResolvedBlock {
  name: string;
  chars: ResolvedChar[];
  range: [number, number];
  count: number;
}

/** Normalize one {@link PickerBlock} into a {@link ResolvedBlock}. */
export function normalizeBlock(block: PickerBlock): ResolvedBlock {
  const chars: ResolvedChar[] = [];

  const items: Array<string | PickerBlock['characters'][number]> =
    typeof block.characters === 'string' ? splitCodePoints(block.characters) : block.characters;

  for (const item of items) {
    if (typeof item === 'string') {
      chars.push({ char: item, codePoint: charToCodePoint(item), name: '' });
    } else {
      const codePoint = item.codePoint ?? charToCodePoint(item.char);
      chars.push({ char: item.char, codePoint, name: item.name ?? '' });
    }
  }

  let range = block.range;
  if (!range) {
    if (chars.length === 0) {
      range = [0, 0];
    } else {
      let min = chars[0]!.codePoint;
      let max = min;
      for (const c of chars) {
        if (c.codePoint < min) min = c.codePoint;
        if (c.codePoint > max) max = c.codePoint;
      }
      range = [min, max];
    }
  }

  return { name: block.name, chars, range, count: chars.length };
}

/** Resolve any {@link BlockSource} (array or sync/async function) into normalized blocks. */
export async function resolveBlocks(source: BlockSource): Promise<ResolvedBlock[]> {
  const data = typeof source === 'function' ? await source() : source;
  return data.map(normalizeBlock);
}
