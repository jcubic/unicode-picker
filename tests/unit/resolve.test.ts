import { describe, it, expect } from 'vitest';
import { normalizeBlock, resolveBlocks } from '../../src/data/resolve';
import type { PickerBlock } from '../../src/data/types';

describe('normalizeBlock', () => {
  it('splits a plain string into characters and derives everything', () => {
    const b = normalizeBlock({ name: 'Arrows', characters: '←↑→' });
    expect(b.name).toBe('Arrows');
    expect(b.count).toBe(3);
    expect(b.chars.map((c) => c.char)).toEqual(['←', '↑', '→']);
    expect(b.chars[0]!.codePoint).toBe(0x2190);
    expect(b.chars[0]!.name).toBe('');
    expect(b.range).toEqual([0x2190, 0x2192]);
  });

  it('keeps surrogate pairs intact when splitting a string', () => {
    const b = normalizeBlock({ name: 'Emoji', characters: '😀😁' });
    expect(b.count).toBe(2);
    expect(b.chars[0]!.codePoint).toBe(0x1f600);
  });

  it('accepts an array mixing bare symbols and objects', () => {
    const b = normalizeBlock({
      name: 'Mixed',
      characters: ['☂', { char: '★', name: 'BLACK STAR' }, { char: '☯', codePoint: 0x262f }],
    });
    expect(b.chars[0]).toMatchObject({ char: '☂', codePoint: 0x2602, name: '' });
    expect(b.chars[1]).toMatchObject({ char: '★', codePoint: 0x2605, name: 'BLACK STAR' });
    expect(b.chars[2]).toMatchObject({ char: '☯', codePoint: 0x262f });
  });

  it('honors an explicit range over the derived one', () => {
    const b = normalizeBlock({ name: 'Custom', characters: '☂', range: [0x2600, 0x26ff] });
    expect(b.range).toEqual([0x2600, 0x26ff]);
  });

  it('yields an empty block for empty characters', () => {
    const b = normalizeBlock({ name: 'Empty', characters: '' });
    expect(b.count).toBe(0);
    expect(b.range).toEqual([0, 0]);
  });
});

describe('resolveBlocks', () => {
  const data: PickerBlock[] = [{ name: 'Arrows', characters: '←→' }];

  it('resolves a plain array', async () => {
    const r = await resolveBlocks(data);
    expect(r).toHaveLength(1);
    expect(r[0]!.name).toBe('Arrows');
  });

  it('resolves a synchronous function', async () => {
    const r = await resolveBlocks(() => data);
    expect(r[0]!.count).toBe(2);
  });

  it('resolves an async function', async () => {
    const r = await resolveBlocks(async () => data);
    expect(r[0]!.count).toBe(2);
  });

  it('propagates rejection from an async source', async () => {
    await expect(resolveBlocks(async () => Promise.reject(new Error('boom')))).rejects.toThrow(
      'boom'
    );
  });
});
