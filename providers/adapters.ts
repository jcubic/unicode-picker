import type { PickerBlock } from '../src/data/types';

/**
 * The subset of the `@unicode/unicode-*` package shape this adapter needs.
 * `Block` maps a block name to its symbols; `Names` maps a code point to a name.
 */
export interface UnicodePackage {
  Block: Map<string, string[]> | Record<string, string[]>;
  Names?: Map<number, string>;
}

/** Coerce a Map-or-object into entries. */
function entries<V>(m: Map<string, V> | Record<string, V>): Array<[string, V]> {
  return m instanceof Map ? [...m.entries()] : Object.entries(m);
}

/**
 * Build {@link PickerBlock}s from a `@unicode/unicode-*` package (or a dynamic
 * import of one), pairing each block's symbols with their names.
 *
 * ```ts
 * import { fromUnicodePackage } from 'unicode-picker/adapters';
 * const include = () => import('@unicode/unicode-17.0.0/Block').then(fromUnicodePackage);
 * ```
 */
export async function fromUnicodePackage(
  pkg: UnicodePackage | Promise<UnicodePackage> | (() => Promise<UnicodePackage>)
): Promise<PickerBlock[]> {
  const resolved = typeof pkg === 'function' ? await pkg() : await pkg;
  const names = resolved.Names;
  return entries(resolved.Block).map(([name, symbols]) => ({
    name,
    characters: symbols.map((char) => {
      const codePoint = char.codePointAt(0)!;
      const found = names?.get(codePoint);
      return found ? { char, name: found } : char;
    }),
  }));
}
