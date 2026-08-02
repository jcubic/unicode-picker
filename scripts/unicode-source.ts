/**
 * Shared reader over `@unicode/unicode-17.0.0`, used by both `gen-data.ts` and
 * `gen-docs.ts`. Produces a normalized list of blocks (assigned, printable
 * characters only) plus the curated Emoji set.
 */
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const PKG = '@unicode/unicode-17.0.0';
const ROOT = dirname(require.resolve(`${PKG}/package.json`));

/** Categories that are never shown (control/format/surrogate/private-use/unassigned). */
const EXCLUDED_CATEGORIES = ['Control', 'Format', 'Surrogate', 'Private_Use', 'Unassigned'];

/** Blocks with more assigned characters than this are range-encoded without names. */
export const LARGE_THRESHOLD = 2000;

export interface SourceChar {
  cp: number;
  char: string;
  /** Name from the Unicode data, or `''` when generic/absent. */
  name: string;
}

export interface SourceBlock {
  dir: string;
  name: string;
  exportId: string;
  slug: string;
  range: [number, number];
  count: number;
  large: boolean;
  chars: SourceChar[];
  /** Contiguous assigned runs, used to range-encode large blocks. */
  ranges: Array<[number, number]>;
}

const SMALL_WORDS = new Set(['and', 'of', 'for', 'with', 'in', 'to', 'the', 'a']);

function displayName(dir: string): string {
  return dir
    .split('_')
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w))
    .join(' ');
}

function toCamel(dir: string): string {
  return dir
    .split('_')
    .map((p, i) =>
      i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    )
    .join('')
    .replace(/[^A-Za-z0-9]/g, '');
}

function toSlug(dir: string): string {
  return dir.toLowerCase().replace(/_/g, '-');
}

function toRanges(cps: number[]): Array<[number, number]> {
  if (cps.length === 0) return [];
  const out: Array<[number, number]> = [];
  let start = cps[0]!;
  let prev = cps[0]!;
  for (let i = 1; i < cps.length; i++) {
    const c = cps[i]!;
    if (c === prev + 1) {
      prev = c;
    } else {
      out.push([start, prev]);
      start = prev = c;
    }
  }
  out.push([start, prev]);
  return out;
}

let excludedCache: Set<number> | null = null;
function excludedSet(): Set<number> {
  if (excludedCache) return excludedCache;
  const set = new Set<number>();
  for (const cat of EXCLUDED_CATEGORIES) {
    const cps = require(`${PKG}/General_Category/${cat}/code-points.js`) as number[];
    for (const cp of cps) set.add(cp);
  }
  excludedCache = set;
  return set;
}

/** The Unicode `Names` map (code point → name), with generic CJK/Hangul labels stripped. */
function names(): Map<number, string> {
  return require(`${PKG}/Names`) as Map<number, string>;
}

/** All blocks with assigned, printable characters, in Unicode order. */
export function loadBlocks(): SourceBlock[] {
  const excluded = excludedSet();
  const nameMap = names();
  const dirs = readdirSync(join(ROOT, 'Block')).sort();

  const blocks: SourceBlock[] = [];
  for (const dir of dirs) {
    const cps = require(`${PKG}/Block/${dir}/code-points.js`) as number[];
    const assigned = cps.filter((cp) => !excluded.has(cp));
    if (assigned.length === 0) continue;

    const large = assigned.length > LARGE_THRESHOLD;
    const chars: SourceChar[] = assigned.map((cp) => ({
      cp,
      char: String.fromCodePoint(cp),
      name: large ? '' : (nameMap.get(cp) ?? ''),
    }));

    blocks.push({
      dir,
      name: displayName(dir),
      exportId: toCamel(dir),
      slug: toSlug(dir),
      range: [assigned[0]!, assigned[assigned.length - 1]!],
      count: assigned.length,
      large,
      chars,
      ranges: toRanges(assigned),
    });
  }
  return blocks;
}

/** The `emojibase` group id for bare components (skin-tone / hair modifiers). */
const COMPONENT_GROUP = 2;

interface EmojibaseEntry {
  emoji: string;
  label: string;
  order?: number;
  group?: number;
}

/**
 * The curated Emoji set. Characters and names come from `emojibase-data`, whose
 * labels are the CLDR annotations — so multi-code-point sequences get real names
 * too: flags (🇬🇧 → "flag: United Kingdom"), ZWJ families (👨‍👩‍👦 → "family: man,
 * woman, boy"), keycaps, etc. Bare skin-tone/hair components are dropped.
 */
export function loadEmoji(): SourceBlock {
  const data = require('emojibase-data/en/data.json') as EmojibaseEntry[];
  const list = data
    .filter((e) => e.group !== COMPONENT_GROUP)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));

  const chars: SourceChar[] = list.map((e) => ({
    cp: e.emoji.codePointAt(0)!,
    char: e.emoji,
    name: e.label,
  }));

  const cps = chars.map((c) => c.cp);
  return {
    dir: 'Emoji',
    name: 'Emoji',
    exportId: 'emoji',
    slug: 'emoji',
    range: [Math.min(...cps), Math.max(...cps)],
    count: chars.length,
    large: false,
    chars,
    ranges: toRanges([...cps].sort((a, b) => a - b)),
  };
}
