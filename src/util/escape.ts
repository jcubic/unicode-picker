import { toHex, toUnicodeNotation } from './codepoint';

/** The copyable escape representations of a character, as shown in the inspector. */
export interface EscapeForms {
  /** `U+2602` */
  unicode: string;
  /** HTML numeric entity, e.g. `&#9730;` */
  html: string;
  /** JavaScript escape, e.g. `☂` (or `\u{1F600}` for astral). */
  js: string;
  /** CSS escape, e.g. `\2602` */
  css: string;
}

/** Build every escape form for a code point. */
export function escapeForms(codePoint: number): EscapeForms {
  const hex = toHex(codePoint);
  const astral = codePoint > 0xffff;
  return {
    unicode: toUnicodeNotation(codePoint),
    html: `&#${codePoint};`,
    js: astral ? `\\u{${hex}}` : `\\u${hex.toLowerCase().padStart(4, '0')}`,
    css: `\\${hex}`,
  };
}
