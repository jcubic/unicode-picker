import { describe, it, expect } from 'vitest';
import {
  charToCodePoint,
  codePointToChar,
  toHex,
  toUnicodeNotation,
  splitCodePoints,
} from '../../src/util/codepoint';

describe('codepoint', () => {
  it('round-trips a BMP character', () => {
    expect(charToCodePoint('☂')).toBe(0x2602);
    expect(codePointToChar(0x2602)).toBe('☂');
  });

  it('round-trips an astral character (surrogate pair)', () => {
    const grin = '😀';
    expect(charToCodePoint(grin)).toBe(0x1f600);
    expect(codePointToChar(0x1f600)).toBe(grin);
    expect(grin.length).toBe(2); // stored as a surrogate pair
  });

  it('formats hex padded to at least 4 digits, uppercase', () => {
    expect(toHex(0x2602)).toBe('2602');
    expect(toHex(0x41)).toBe('0041');
    expect(toHex(0x1f600)).toBe('1F600');
  });

  it('formats the U+ notation', () => {
    expect(toUnicodeNotation(0x2602)).toBe('U+2602');
    expect(toUnicodeNotation(0x1f600)).toBe('U+1F600');
  });

  it('splits a string into code points, keeping surrogate pairs intact', () => {
    expect(splitCodePoints('a☂😀')).toEqual(['a', '☂', '😀']);
    expect(splitCodePoints('')).toEqual([]);
  });
});
