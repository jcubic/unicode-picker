/** Convert a code point to its string (handles astral characters). */
export function codePointToChar(codePoint: number): string {
  return String.fromCodePoint(codePoint);
}

/** Read the first code point of a character string. */
export function charToCodePoint(char: string): number {
  const cp = char.codePointAt(0);
  if (cp === undefined) {
    throw new Error('charToCodePoint: empty string');
  }
  return cp;
}

/** Hex digits for a code point, uppercase, padded to at least 4 digits. */
export function toHex(codePoint: number): string {
  return codePoint.toString(16).toUpperCase().padStart(4, '0');
}

/** `U+XXXX` notation for a code point. */
export function toUnicodeNotation(codePoint: number): string {
  return `U+${toHex(codePoint)}`;
}

/** Split a string into an array of characters by code point (surrogate-safe). */
export function splitCodePoints(str: string): string[] {
  return Array.from(str);
}
