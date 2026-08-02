import { describe, it, expect } from 'vitest';
import { escapeForms } from '../../src/util/escape';

describe('escapeForms', () => {
  it('produces every escape form for a BMP character', () => {
    const f = escapeForms(0x2602); // ☂ UMBRELLA
    expect(f.unicode).toBe('U+2602');
    expect(f.html).toBe('&#9730;');
    expect(f.js).toBe('\\u2602');
    expect(f.css).toBe('\\2602');
  });

  it('produces astral-safe escapes for characters above U+FFFF', () => {
    const f = escapeForms(0x1f600); // 😀
    expect(f.unicode).toBe('U+1F600');
    expect(f.html).toBe('&#128512;');
    expect(f.js).toBe('\\u{1F600}');
    expect(f.css).toBe('\\1F600');
  });
});
