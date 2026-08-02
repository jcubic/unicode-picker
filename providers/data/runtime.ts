// Shared helper for generated block modules. Kept tiny; bundled once.

/** Expand contiguous code-point ranges into a string of characters. */
export function expand(ranges: Array<[number, number]>): string {
  let out = '';
  for (const [a, b] of ranges) {
    for (let cp = a; cp <= b; cp++) out += String.fromCodePoint(cp);
  }
  return out;
}
