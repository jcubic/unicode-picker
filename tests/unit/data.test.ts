import { describe, it, expect } from 'vitest';
import { normalizeBlock } from '../../src/data/resolve';
import { fromUnicodePackage } from '../../providers/adapters';
import { emoji } from '../../providers/data/emoji';
import { arrows } from '../../providers/data/blocks/arrows';
import { cjkUnifiedIdeographs } from '../../providers/data/blocks/cjk-unified-ideographs';

describe('generated data', () => {
  it('exposes named blocks with the official name and character data', () => {
    expect(arrows.name).toBe('Arrows');
    const b = normalizeBlock(arrows);
    expect(b.chars[0]).toMatchObject({ char: '←', name: 'LEFTWARDS ARROW', codePoint: 0x2190 });
    expect(b.count).toBeGreaterThan(100);
  });

  it('range-encodes large blocks (no per-character names) but still expands them', () => {
    expect(typeof cjkUnifiedIdeographs.characters).toBe('string');
    const b = normalizeBlock(cjkUnifiedIdeographs);
    expect(b.count).toBeGreaterThan(20000);
    expect(b.chars[0]!.char).toBe('一');
  });

  it('exposes a curated, non-empty emoji set with CLDR names', () => {
    const b = normalizeBlock(emoji);
    expect(b.name).toBe('Emoji');
    expect(b.count).toBeGreaterThan(1000);
    expect(b.chars.find((c) => c.char === '😀')?.name).toBe('grinning face');
    // every emoji has a name (no blanks)
    expect(b.chars.every((c) => c.name.length > 0)).toBe(true);
  });

  it('names multi-code-point emoji sequences (flags, ZWJ families)', () => {
    const b = normalizeBlock(emoji);
    const uk = b.chars.find((c) => c.char === '🇬🇧');
    expect(uk).toBeTruthy();
    expect(uk!.char.length).toBeGreaterThan(2); // two regional indicators
    expect(uk!.name).toBe('flag: United Kingdom');
  });
});

describe('fromUnicodePackage adapter', () => {
  it('pairs block symbols with names from the package', async () => {
    const pkg = {
      Block: { Arrows: ['←', '→'] },
      Names: new Map([[0x2190, 'LEFTWARDS ARROW']]),
    };
    const blocks = await fromUnicodePackage(pkg);
    expect(blocks).toEqual([
      { name: 'Arrows', characters: [{ char: '←', name: 'LEFTWARDS ARROW' }, '→'] },
    ]);
  });

  it('accepts a lazy import thunk', async () => {
    const blocks = await fromUnicodePackage(async () => ({ Block: { X: ['☂'] } }));
    expect(blocks[0]!.name).toBe('X');
  });
});
