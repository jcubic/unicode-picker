# unicode-picker

[![npm](https://img.shields.io/badge/npm-0.1.0-yellow.svg)](https://www.npmjs.com/package/unicode-picker)
[![Tests](https://github.com/jcubic/unicode-picker/actions/workflows/test.yml/badge.svg)](https://github.com/jcubic/unicode-picker/actions/workflows/test.yml)
[![unicode-picker GitHub repo](https://img.shields.io/badge/github-unicode--picker-orange?logo=github)](https://github.com/jcubic/unicode-picker)
[![Coverage Status](https://coveralls.io/repos/github/jcubic/unicode-picker/badge.svg?branch=master)](https://coveralls.io/github/jcubic/unicode-picker?branch=master)
[![LICENSE MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jcubic/unicode-picker/blob/master/LICENSE)

Vanilla TypeScript framework-agnostic **Unicode character picker** component.

- **Data-agnostic core** — bring your own characters (a few hardcoded glyphs, a whole
  Unicode block, or the full set). The core bundle ships **no character data**.
- **Tree-shakable dataset** — `import { greek, math } from 'unicode-picker/data'` pulls
  only those blocks.
- **Popover** positioning via the native Popover API, anchored to any element.
- **Insert = event only** — a `unicode-picker:insert` event and an `onInsert` callback;
  the library never touches your editor.
- Light / dark / auto theme, Shadow DOM style isolation, keyboard navigation, search.
- Ships as an **ESM module** and a **browser IIFE** (`<script>`, `window.Picker`).

Built on Unicode **17.0.0** data (via [`@unicode/unicode-17.0.0`](https://github.com/node-unicode/unicode-17.0.0),
used only at build time).

## Screenshots

![Unicode Picker Dark Mode](https://github.com/jcubic/unicode-picker/blob/master/.github/screenshot-dark.png?raw=true)
![Unicode Picker Light Mode](https://github.com/jcubic/unicode-picker/blob/master/.github/screenshot-light.png?raw=true)

## Install

```sh
npm install unicode-picker
```

## Quick start

```ts
import Picker from 'unicode-picker';
import { emoji, arrows, mathematicalOperators } from 'unicode-picker/data';

const picker = Picker({
  width: 380, // px
  height: 480, // px
  include: [emoji, arrows, mathematicalOperators],
});

picker.append(document.body);

const button = document.querySelector('#open')!;
button.addEventListener('click', () => picker.toggle({ anchor: button }));

picker.on('insert', ({ char }) => {
  // do whatever you want with the character
  document.querySelector('textarea')!.value += char;
});

picker.on('select', (data) => {
  console.log(data);
});
```

Omit `include` to load the **entire** Unicode set lazily from `unicode-picker/data`
(virtualized, so it stays fast):

```ts
const picker = Picker(); // everything, loaded on first show()
```

## Options

| Option     | Type                             | Default  | Description                                                  |
| ---------- | -------------------------------- | -------- | ------------------------------------------------------------ |
| `width`    | `number`                         | `380`    | Width in pixels.                                             |
| `height`   | `number`                         | `480`    | Height in pixels.                                            |
| `include`  | `BlockSource`                    | full set | Characters to show (see [Data](#data)). Omit for everything. |
| `theme`    | `'light' \| 'dark' \| 'auto'`    | `'auto'` | Colour theme (`auto` follows `prefers-color-scheme`).        |
| `onInsert` | `(detail: InsertDetail) => void` | —        | Convenience callback, fired with the `insert` event.         |

## Instance API

```ts
interface PickerInstance {
  append(parent: HTMLElement): PickerInstance;
  show(opts?: ShowOptions): PickerInstance; // ShowOptions: { anchor?, placement? }
  hide(): PickerInstance;
  toggle(opts?: ShowOptions): PickerInstance;
  on(event, cb): () => void; // returns an unsubscribe function
  setTheme(theme): PickerInstance;
  search(query: string): PickerInstance;
  destroy(): void;
  readonly element: HTMLElement;
}
```

`show({ anchor, placement })` positions the popover against `anchor`
(`placement`: `'top' | 'bottom' | 'left' | 'right' | 'auto'`, default `'auto'`).

## Events

Subscribe with `picker.on(name, cb)` (returns an unsubscribe function). `insert` is **also**
dispatched as a bubbling, composed DOM `CustomEvent` named `unicode-picker:insert` on
`picker.element`.

| Event    | Detail                                  |
| -------- | --------------------------------------- |
| `insert` | `{ char, codePoint, name, block, hex }` |
| `select` | same shape as `insert`                  |
| `copy`   | `{ value, char, codePoint }`            |
| `show`   | `void`                                  |
| `hide`   | `void`                                  |

## Data

The `include` option is a **`BlockSource`** — the core renders whatever you give it:

```ts
interface PickerChar {
  char: string; // the symbol (may be a surrogate pair)
  name?: string; // enables the inspector title + name search
  codePoint?: number; // derived from `char` when omitted
}

interface PickerBlock {
  name: string; // chip + section header label
  characters: string | Array<string | PickerChar>; // a string is split by code point
  range?: [number, number]; // derived from the characters otherwise
}

type BlockSource = PickerBlock[] | (() => PickerBlock[] | Promise<PickerBlock[]>);
```

Examples:

```ts
// Hardcoded — tiny bundle, no dataset dependency
Picker({ include: [{ name: 'Arrows', characters: '←↑→↓' }] });

// Named blocks from the bundled dataset (tree-shaken)
import { emoji, greekAndCoptic } from 'unicode-picker/data';
Picker({ include: [emoji, greekAndCoptic] });

// Lazy / async source
Picker({ include: async () => (await fetch('/my-chars.json')).json() });

// Straight from @unicode via the adapter (pairs symbols with names)
import { fromUnicodePackage } from 'unicode-picker/adapters';
Picker({ include: () => fromUnicodePackage(() => import('@unicode/unicode-17.0.0/Block')) });
```

### `unicode-picker/data`

Named exports, **one `PickerBlock` per Unicode block** (camelCase of the official name),
plus a curated `emoji` set and heavy `all` / `blocks` arrays:

```ts
import { basicLatin, greekAndCoptic, mathematicalOperators, emoji, all } from 'unicode-picker/data';
```

Importing individual blocks is **tree-shakable** — only the blocks you name end up in your
bundle. `all` / `blocks` include everything and intentionally opt out of tree-shaking.

The curated `emoji` export names every emoji — including multi-code-point sequences such as
flags (🇬🇧 → “flag: United Kingdom”) and ZWJ families — using the CLDR annotations from
[`emojibase-data`](https://github.com/milesj/emojibase) (build-time only).

> **IIFE note:** tree-shaking is an ESM/bundler feature. For plain `<script>` usage, the
> data script (`unicode-picker-data.global.js`) exposes the whole dataset on
> `window.UnicodePickerData`; it cannot be tree-shaken.

See the [full list of blocks](#unicode-blocks) below.

## Usage in the browser (`<script>`)

```html
<script src="https://unpkg.com/unicode-picker"></script>
<!-- optional: the full dataset on window.UnicodePickerData -->
<script src="https://unpkg.com/unicode-picker/dist/unicode-picker-data.global.js"></script>
<script>
  const { emoji, arrows } = window.UnicodePickerData;
  const picker = Picker({ include: [emoji, arrows] });
  picker.append(document.body);
  document.querySelector('#open').onclick = (e) => picker.toggle({ anchor: e.currentTarget });
  picker.on('insert', ({ char }) => console.log('picked', char));
</script>
```

## Usage with React

```tsx
import { useEffect, useRef, useState } from 'react';
import Picker, { type PickerInstance } from 'unicode-picker';
import { emoji, arrows } from 'unicode-picker/data';

export function CharField() {
  const btn = useRef<HTMLButtonElement>(null);
  const picker = useRef<PickerInstance | null>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    const p = Picker({ include: [emoji, arrows] });
    p.append(document.body);
    p.on('insert', ({ char }) => setValue((v) => v + char));
    picker.current = p;
    return () => p.destroy();
  }, []);

  return (
    <>
      <button ref={btn} onClick={() => picker.current?.toggle({ anchor: btn.current! })}>
        Pick a character ❖
      </button>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} />
    </>
  );
}
```

## Usage with Vue

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import Picker, { type PickerInstance } from 'unicode-picker';
import { emoji, arrows } from 'unicode-picker/data';

const btn = ref<HTMLButtonElement>();
const value = ref('');
let picker: PickerInstance;

onMounted(() => {
  picker = Picker({ include: [emoji, arrows] });
  picker.append(document.body);
  picker.on('insert', ({ char }) => (value.value += char));
});
onBeforeUnmount(() => picker.destroy());
</script>

<template>
  <button ref="btn" @click="picker.toggle({ anchor: btn })">Pick a character ❖</button>
  <textarea v-model="value" />
</template>
```

## Unicode blocks

Each block below is a named export of `unicode-picker/data`. Click a reference to see every
character in that block.

<!-- BLOCKS:START -->

| Import                                        | Unicode block                                    | Chars | Reference                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| `emoji`                                       | Emoji                                            | 1940  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/emoji.md)                                            |
| `adlam`                                       | Adlam                                            | 88    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/adlam.md)                                            |
| `aegeanNumbers`                               | Aegean Numbers                                   | 57    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/aegean-numbers.md)                                   |
| `ahom`                                        | Ahom                                             | 65    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ahom.md)                                             |
| `alchemicalSymbols`                           | Alchemical Symbols                               | 128   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/alchemical-symbols.md)                               |
| `alphabeticPresentationForms`                 | Alphabetic Presentation Forms                    | 58    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/alphabetic-presentation-forms.md)                    |
| `anatolianHieroglyphs`                        | Anatolian Hieroglyphs                            | 583   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/anatolian-hieroglyphs.md)                            |
| `ancientGreekMusicalNotation`                 | Ancient Greek Musical Notation                   | 70    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ancient-greek-musical-notation.md)                   |
| `ancientGreekNumbers`                         | Ancient Greek Numbers                            | 79    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ancient-greek-numbers.md)                            |
| `ancientSymbols`                              | Ancient Symbols                                  | 14    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ancient-symbols.md)                                  |
| `arabic`                                      | Arabic                                           | 248   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/arabic.md)                                           |
| `arabicExtendedA`                             | Arabic Extended a                                | 95    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/arabic-extended-a.md)                                |
| `arabicExtendedB`                             | Arabic Extended B                                | 41    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/arabic-extended-b.md)                                |
| `arabicExtendedC`                             | Arabic Extended C                                | 21    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/arabic-extended-c.md)                                |
| `arabicMathematicalAlphabeticSymbols`         | Arabic Mathematical Alphabetic Symbols           | 143   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/arabic-mathematical-alphabetic-symbols.md)           |
| `arabicPresentationFormsA`                    | Arabic Presentation Forms a                      | 656   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/arabic-presentation-forms-a.md)                      |
| `arabicPresentationFormsB`                    | Arabic Presentation Forms B                      | 140   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/arabic-presentation-forms-b.md)                      |
| `arabicSupplement`                            | Arabic Supplement                                | 48    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/arabic-supplement.md)                                |
| `armenian`                                    | Armenian                                         | 91    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/armenian.md)                                         |
| `arrows`                                      | Arrows                                           | 112   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/arrows.md)                                           |
| `avestan`                                     | Avestan                                          | 61    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/avestan.md)                                          |
| `balinese`                                    | Balinese                                         | 127   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/balinese.md)                                         |
| `bamum`                                       | Bamum                                            | 88    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/bamum.md)                                            |
| `bamumSupplement`                             | Bamum Supplement                                 | 569   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/bamum-supplement.md)                                 |
| `basicLatin`                                  | Basic Latin                                      | 95    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/basic-latin.md)                                      |
| `bassaVah`                                    | Bassa Vah                                        | 36    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/bassa-vah.md)                                        |
| `batak`                                       | Batak                                            | 56    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/batak.md)                                            |
| `bengali`                                     | Bengali                                          | 96    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/bengali.md)                                          |
| `beriaErfe`                                   | Beria Erfe                                       | 50    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/beria-erfe.md)                                       |
| `bhaiksuki`                                   | Bhaiksuki                                        | 97    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/bhaiksuki.md)                                        |
| `blockElements`                               | Block Elements                                   | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/block-elements.md)                                   |
| `bopomofo`                                    | Bopomofo                                         | 43    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/bopomofo.md)                                         |
| `bopomofoExtended`                            | Bopomofo Extended                                | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/bopomofo-extended.md)                                |
| `boxDrawing`                                  | Box Drawing                                      | 128   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/box-drawing.md)                                      |
| `brahmi`                                      | Brahmi                                           | 115   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/brahmi.md)                                           |
| `braillePatterns`                             | Braille Patterns                                 | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/braille-patterns.md)                                 |
| `buginese`                                    | Buginese                                         | 30    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/buginese.md)                                         |
| `buhid`                                       | Buhid                                            | 20    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/buhid.md)                                            |
| `byzantineMusicalSymbols`                     | Byzantine Musical Symbols                        | 246   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/byzantine-musical-symbols.md)                        |
| `cjkCompatibility`                            | CJK Compatibility                                | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-compatibility.md)                                |
| `cjkCompatibilityForms`                       | CJK Compatibility Forms                          | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-compatibility-forms.md)                          |
| `cjkCompatibilityIdeographs`                  | CJK Compatibility Ideographs                     | 472   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-compatibility-ideographs.md)                     |
| `cjkCompatibilityIdeographsSupplement`        | CJK Compatibility Ideographs Supplement          | 542   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-compatibility-ideographs-supplement.md)          |
| `cjkRadicalsSupplement`                       | CJK Radicals Supplement                          | 115   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-radicals-supplement.md)                          |
| `cjkStrokes`                                  | CJK Strokes                                      | 39    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-strokes.md)                                      |
| `cjkSymbolsAndPunctuation`                    | CJK Symbols and Punctuation                      | 64    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-symbols-and-punctuation.md)                      |
| `cjkUnifiedIdeographs`                        | CJK Unified Ideographs                           | 20992 | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs.md)                           |
| `cjkUnifiedIdeographsExtensionA`              | CJK Unified Ideographs Extension a               | 6592  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-a.md)               |
| `cjkUnifiedIdeographsExtensionB`              | CJK Unified Ideographs Extension B               | 42720 | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-b.md)               |
| `cjkUnifiedIdeographsExtensionC`              | CJK Unified Ideographs Extension C               | 4160  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-c.md)               |
| `cjkUnifiedIdeographsExtensionD`              | CJK Unified Ideographs Extension D               | 222   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-d.md)               |
| `cjkUnifiedIdeographsExtensionE`              | CJK Unified Ideographs Extension E               | 5774  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-e.md)               |
| `cjkUnifiedIdeographsExtensionF`              | CJK Unified Ideographs Extension F               | 7473  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-f.md)               |
| `cjkUnifiedIdeographsExtensionG`              | CJK Unified Ideographs Extension G               | 4939  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-g.md)               |
| `cjkUnifiedIdeographsExtensionH`              | CJK Unified Ideographs Extension H               | 4192  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-h.md)               |
| `cjkUnifiedIdeographsExtensionI`              | CJK Unified Ideographs Extension I               | 622   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-i.md)               |
| `cjkUnifiedIdeographsExtensionJ`              | CJK Unified Ideographs Extension J               | 4298  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cjk-unified-ideographs-extension-j.md)               |
| `carian`                                      | Carian                                           | 49    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/carian.md)                                           |
| `caucasianAlbanian`                           | Caucasian Albanian                               | 53    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/caucasian-albanian.md)                               |
| `chakma`                                      | Chakma                                           | 71    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/chakma.md)                                           |
| `cham`                                        | Cham                                             | 83    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cham.md)                                             |
| `cherokee`                                    | Cherokee                                         | 92    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cherokee.md)                                         |
| `cherokeeSupplement`                          | Cherokee Supplement                              | 80    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cherokee-supplement.md)                              |
| `chessSymbols`                                | Chess Symbols                                    | 102   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/chess-symbols.md)                                    |
| `chorasmian`                                  | Chorasmian                                       | 28    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/chorasmian.md)                                       |
| `combiningDiacriticalMarks`                   | Combining Diacritical Marks                      | 112   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/combining-diacritical-marks.md)                      |
| `combiningDiacriticalMarksExtended`           | Combining Diacritical Marks Extended             | 58    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/combining-diacritical-marks-extended.md)             |
| `combiningDiacriticalMarksForSymbols`         | Combining Diacritical Marks for Symbols          | 33    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/combining-diacritical-marks-for-symbols.md)          |
| `combiningDiacriticalMarksSupplement`         | Combining Diacritical Marks Supplement           | 64    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/combining-diacritical-marks-supplement.md)           |
| `combiningHalfMarks`                          | Combining Half Marks                             | 16    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/combining-half-marks.md)                             |
| `commonIndicNumberForms`                      | Common Indic Number Forms                        | 10    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/common-indic-number-forms.md)                        |
| `controlPictures`                             | Control Pictures                                 | 42    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/control-pictures.md)                                 |
| `coptic`                                      | Coptic                                           | 123   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/coptic.md)                                           |
| `copticEpactNumbers`                          | Coptic Epact Numbers                             | 28    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/coptic-epact-numbers.md)                             |
| `countingRodNumerals`                         | Counting Rod Numerals                            | 25    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/counting-rod-numerals.md)                            |
| `cuneiform`                                   | Cuneiform                                        | 922   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cuneiform.md)                                        |
| `cuneiformNumbersAndPunctuation`              | Cuneiform Numbers and Punctuation                | 116   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cuneiform-numbers-and-punctuation.md)                |
| `currencySymbols`                             | Currency Symbols                                 | 34    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/currency-symbols.md)                                 |
| `cypriotSyllabary`                            | Cypriot Syllabary                                | 55    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cypriot-syllabary.md)                                |
| `cyproMinoan`                                 | Cypro Minoan                                     | 99    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cypro-minoan.md)                                     |
| `cyrillic`                                    | Cyrillic                                         | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cyrillic.md)                                         |
| `cyrillicExtendedA`                           | Cyrillic Extended a                              | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cyrillic-extended-a.md)                              |
| `cyrillicExtendedB`                           | Cyrillic Extended B                              | 96    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cyrillic-extended-b.md)                              |
| `cyrillicExtendedC`                           | Cyrillic Extended C                              | 11    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cyrillic-extended-c.md)                              |
| `cyrillicExtendedD`                           | Cyrillic Extended D                              | 63    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cyrillic-extended-d.md)                              |
| `cyrillicSupplement`                          | Cyrillic Supplement                              | 48    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/cyrillic-supplement.md)                              |
| `deseret`                                     | Deseret                                          | 80    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/deseret.md)                                          |
| `devanagari`                                  | Devanagari                                       | 128   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/devanagari.md)                                       |
| `devanagariExtended`                          | Devanagari Extended                              | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/devanagari-extended.md)                              |
| `devanagariExtendedA`                         | Devanagari Extended a                            | 10    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/devanagari-extended-a.md)                            |
| `dingbats`                                    | Dingbats                                         | 192   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/dingbats.md)                                         |
| `divesAkuru`                                  | Dives Akuru                                      | 72    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/dives-akuru.md)                                      |
| `dogra`                                       | Dogra                                            | 60    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/dogra.md)                                            |
| `dominoTiles`                                 | Domino Tiles                                     | 100   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/domino-tiles.md)                                     |
| `duployan`                                    | Duployan                                         | 143   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/duployan.md)                                         |
| `earlyDynasticCuneiform`                      | Early Dynastic Cuneiform                         | 196   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/early-dynastic-cuneiform.md)                         |
| `egyptianHieroglyphFormatControls`            | Egyptian Hieroglyph Format Controls              | 22    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/egyptian-hieroglyph-format-controls.md)              |
| `egyptianHieroglyphs`                         | Egyptian Hieroglyphs                             | 1072  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/egyptian-hieroglyphs.md)                             |
| `egyptianHieroglyphsExtendedA`                | Egyptian Hieroglyphs Extended a                  | 3995  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/egyptian-hieroglyphs-extended-a.md)                  |
| `elbasan`                                     | Elbasan                                          | 40    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/elbasan.md)                                          |
| `elymaic`                                     | Elymaic                                          | 23    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/elymaic.md)                                          |
| `emoticons`                                   | Emoticons                                        | 80    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/emoticons.md)                                        |
| `enclosedAlphanumericSupplement`              | Enclosed Alphanumeric Supplement                 | 200   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/enclosed-alphanumeric-supplement.md)                 |
| `enclosedAlphanumerics`                       | Enclosed Alphanumerics                           | 160   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/enclosed-alphanumerics.md)                           |
| `enclosedCjkLettersAndMonths`                 | Enclosed CJK Letters and Months                  | 255   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/enclosed-cjk-letters-and-months.md)                  |
| `enclosedIdeographicSupplement`               | Enclosed Ideographic Supplement                  | 64    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/enclosed-ideographic-supplement.md)                  |
| `ethiopic`                                    | Ethiopic                                         | 358   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ethiopic.md)                                         |
| `ethiopicExtended`                            | Ethiopic Extended                                | 79    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ethiopic-extended.md)                                |
| `ethiopicExtendedA`                           | Ethiopic Extended a                              | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ethiopic-extended-a.md)                              |
| `ethiopicExtendedB`                           | Ethiopic Extended B                              | 28    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ethiopic-extended-b.md)                              |
| `ethiopicSupplement`                          | Ethiopic Supplement                              | 26    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ethiopic-supplement.md)                              |
| `garay`                                       | Garay                                            | 69    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/garay.md)                                            |
| `generalPunctuation`                          | General Punctuation                              | 86    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/general-punctuation.md)                              |
| `geometricShapes`                             | Geometric Shapes                                 | 96    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/geometric-shapes.md)                                 |
| `geometricShapesExtended`                     | Geometric Shapes Extended                        | 103   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/geometric-shapes-extended.md)                        |
| `georgian`                                    | Georgian                                         | 88    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/georgian.md)                                         |
| `georgianExtended`                            | Georgian Extended                                | 46    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/georgian-extended.md)                                |
| `georgianSupplement`                          | Georgian Supplement                              | 40    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/georgian-supplement.md)                              |
| `glagolitic`                                  | Glagolitic                                       | 96    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/glagolitic.md)                                       |
| `glagoliticSupplement`                        | Glagolitic Supplement                            | 38    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/glagolitic-supplement.md)                            |
| `gothic`                                      | Gothic                                           | 27    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/gothic.md)                                           |
| `grantha`                                     | Grantha                                          | 86    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/grantha.md)                                          |
| `greekAndCoptic`                              | Greek and Coptic                                 | 135   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/greek-and-coptic.md)                                 |
| `greekExtended`                               | Greek Extended                                   | 233   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/greek-extended.md)                                   |
| `gujarati`                                    | Gujarati                                         | 91    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/gujarati.md)                                         |
| `gunjalaGondi`                                | Gunjala Gondi                                    | 63    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/gunjala-gondi.md)                                    |
| `gurmukhi`                                    | Gurmukhi                                         | 80    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/gurmukhi.md)                                         |
| `gurungKhema`                                 | Gurung Khema                                     | 58    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/gurung-khema.md)                                     |
| `halfwidthAndFullwidthForms`                  | Halfwidth and Fullwidth Forms                    | 225   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/halfwidth-and-fullwidth-forms.md)                    |
| `hangulCompatibilityJamo`                     | Hangul Compatibility Jamo                        | 94    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hangul-compatibility-jamo.md)                        |
| `hangulJamo`                                  | Hangul Jamo                                      | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hangul-jamo.md)                                      |
| `hangulJamoExtendedA`                         | Hangul Jamo Extended a                           | 29    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hangul-jamo-extended-a.md)                           |
| `hangulJamoExtendedB`                         | Hangul Jamo Extended B                           | 72    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hangul-jamo-extended-b.md)                           |
| `hangulSyllables`                             | Hangul Syllables                                 | 11172 | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hangul-syllables.md)                                 |
| `hanifiRohingya`                              | Hanifi Rohingya                                  | 50    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hanifi-rohingya.md)                                  |
| `hanunoo`                                     | Hanunoo                                          | 23    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hanunoo.md)                                          |
| `hatran`                                      | Hatran                                           | 26    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hatran.md)                                           |
| `hebrew`                                      | Hebrew                                           | 88    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hebrew.md)                                           |
| `hiragana`                                    | Hiragana                                         | 93    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/hiragana.md)                                         |
| `ipaExtensions`                               | IPA Extensions                                   | 96    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ipa-extensions.md)                                   |
| `ideographicDescriptionCharacters`            | Ideographic Description Characters               | 16    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ideographic-description-characters.md)               |
| `ideographicSymbolsAndPunctuation`            | Ideographic Symbols and Punctuation              | 12    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ideographic-symbols-and-punctuation.md)              |
| `imperialAramaic`                             | Imperial Aramaic                                 | 31    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/imperial-aramaic.md)                                 |
| `indicSiyaqNumbers`                           | Indic Siyaq Numbers                              | 68    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/indic-siyaq-numbers.md)                              |
| `inscriptionalPahlavi`                        | Inscriptional Pahlavi                            | 27    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/inscriptional-pahlavi.md)                            |
| `inscriptionalParthian`                       | Inscriptional Parthian                           | 30    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/inscriptional-parthian.md)                           |
| `javanese`                                    | Javanese                                         | 91    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/javanese.md)                                         |
| `kaithi`                                      | Kaithi                                           | 66    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kaithi.md)                                           |
| `kaktovikNumerals`                            | Kaktovik Numerals                                | 20    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kaktovik-numerals.md)                                |
| `kanaExtendedA`                               | Kana Extended a                                  | 35    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kana-extended-a.md)                                  |
| `kanaExtendedB`                               | Kana Extended B                                  | 13    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kana-extended-b.md)                                  |
| `kanaSupplement`                              | Kana Supplement                                  | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kana-supplement.md)                                  |
| `kanbun`                                      | Kanbun                                           | 16    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kanbun.md)                                           |
| `kangxiRadicals`                              | Kangxi Radicals                                  | 214   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kangxi-radicals.md)                                  |
| `kannada`                                     | Kannada                                          | 92    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kannada.md)                                          |
| `katakana`                                    | Katakana                                         | 96    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/katakana.md)                                         |
| `katakanaPhoneticExtensions`                  | Katakana Phonetic Extensions                     | 16    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/katakana-phonetic-extensions.md)                     |
| `kawi`                                        | Kawi                                             | 87    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kawi.md)                                             |
| `kayahLi`                                     | Kayah Li                                         | 48    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kayah-li.md)                                         |
| `kharoshthi`                                  | Kharoshthi                                       | 68    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kharoshthi.md)                                       |
| `khitanSmallScript`                           | Khitan Small Script                              | 471   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/khitan-small-script.md)                              |
| `khmer`                                       | Khmer                                            | 114   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/khmer.md)                                            |
| `khmerSymbols`                                | Khmer Symbols                                    | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/khmer-symbols.md)                                    |
| `khojki`                                      | Khojki                                           | 65    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/khojki.md)                                           |
| `khudawadi`                                   | Khudawadi                                        | 69    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/khudawadi.md)                                        |
| `kiratRai`                                    | Kirat Rai                                        | 58    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/kirat-rai.md)                                        |
| `lao`                                         | Lao                                              | 83    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/lao.md)                                              |
| `latin1Supplement`                            | Latin 1 Supplement                               | 95    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/latin-1-supplement.md)                               |
| `latinExtendedA`                              | Latin Extended a                                 | 128   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/latin-extended-a.md)                                 |
| `latinExtendedAdditional`                     | Latin Extended Additional                        | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/latin-extended-additional.md)                        |
| `latinExtendedB`                              | Latin Extended B                                 | 208   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/latin-extended-b.md)                                 |
| `latinExtendedC`                              | Latin Extended C                                 | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/latin-extended-c.md)                                 |
| `latinExtendedD`                              | Latin Extended D                                 | 204   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/latin-extended-d.md)                                 |
| `latinExtendedE`                              | Latin Extended E                                 | 60    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/latin-extended-e.md)                                 |
| `latinExtendedF`                              | Latin Extended F                                 | 57    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/latin-extended-f.md)                                 |
| `latinExtendedG`                              | Latin Extended G                                 | 37    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/latin-extended-g.md)                                 |
| `lepcha`                                      | Lepcha                                           | 74    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/lepcha.md)                                           |
| `letterlikeSymbols`                           | Letterlike Symbols                               | 80    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/letterlike-symbols.md)                               |
| `limbu`                                       | Limbu                                            | 68    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/limbu.md)                                            |
| `linearA`                                     | Linear a                                         | 341   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/linear-a.md)                                         |
| `linearBIdeograms`                            | Linear B Ideograms                               | 123   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/linear-b-ideograms.md)                               |
| `linearBSyllabary`                            | Linear B Syllabary                               | 88    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/linear-b-syllabary.md)                               |
| `lisu`                                        | Lisu                                             | 48    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/lisu.md)                                             |
| `lisuSupplement`                              | Lisu Supplement                                  | 1     | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/lisu-supplement.md)                                  |
| `lycian`                                      | Lycian                                           | 29    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/lycian.md)                                           |
| `lydian`                                      | Lydian                                           | 27    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/lydian.md)                                           |
| `mahajani`                                    | Mahajani                                         | 39    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mahajani.md)                                         |
| `mahjongTiles`                                | Mahjong Tiles                                    | 44    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mahjong-tiles.md)                                    |
| `makasar`                                     | Makasar                                          | 25    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/makasar.md)                                          |
| `malayalam`                                   | Malayalam                                        | 118   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/malayalam.md)                                        |
| `mandaic`                                     | Mandaic                                          | 29    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mandaic.md)                                          |
| `manichaean`                                  | Manichaean                                       | 51    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/manichaean.md)                                       |
| `marchen`                                     | Marchen                                          | 68    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/marchen.md)                                          |
| `masaramGondi`                                | Masaram Gondi                                    | 75    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/masaram-gondi.md)                                    |
| `mathematicalAlphanumericSymbols`             | Mathematical Alphanumeric Symbols                | 996   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mathematical-alphanumeric-symbols.md)                |
| `mathematicalOperators`                       | Mathematical Operators                           | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mathematical-operators.md)                           |
| `mayanNumerals`                               | Mayan Numerals                                   | 20    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mayan-numerals.md)                                   |
| `medefaidrin`                                 | Medefaidrin                                      | 91    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/medefaidrin.md)                                      |
| `meeteiMayek`                                 | Meetei Mayek                                     | 56    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/meetei-mayek.md)                                     |
| `meeteiMayekExtensions`                       | Meetei Mayek Extensions                          | 23    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/meetei-mayek-extensions.md)                          |
| `mendeKikakui`                                | Mende Kikakui                                    | 213   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mende-kikakui.md)                                    |
| `meroiticCursive`                             | Meroitic Cursive                                 | 90    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/meroitic-cursive.md)                                 |
| `meroiticHieroglyphs`                         | Meroitic Hieroglyphs                             | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/meroitic-hieroglyphs.md)                             |
| `miao`                                        | Miao                                             | 149   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/miao.md)                                             |
| `miscellaneousMathematicalSymbolsA`           | Miscellaneous Mathematical Symbols a             | 48    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/miscellaneous-mathematical-symbols-a.md)             |
| `miscellaneousMathematicalSymbolsB`           | Miscellaneous Mathematical Symbols B             | 128   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/miscellaneous-mathematical-symbols-b.md)             |
| `miscellaneousSymbols`                        | Miscellaneous Symbols                            | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/miscellaneous-symbols.md)                            |
| `miscellaneousSymbolsAndArrows`               | Miscellaneous Symbols and Arrows                 | 254   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/miscellaneous-symbols-and-arrows.md)                 |
| `miscellaneousSymbolsAndPictographs`          | Miscellaneous Symbols and Pictographs            | 768   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/miscellaneous-symbols-and-pictographs.md)            |
| `miscellaneousSymbolsSupplement`              | Miscellaneous Symbols Supplement                 | 34    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/miscellaneous-symbols-supplement.md)                 |
| `miscellaneousTechnical`                      | Miscellaneous Technical                          | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/miscellaneous-technical.md)                          |
| `modi`                                        | Modi                                             | 79    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/modi.md)                                             |
| `modifierToneLetters`                         | Modifier Tone Letters                            | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/modifier-tone-letters.md)                            |
| `mongolian`                                   | Mongolian                                        | 157   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mongolian.md)                                        |
| `mongolianSupplement`                         | Mongolian Supplement                             | 13    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mongolian-supplement.md)                             |
| `mro`                                         | Mro                                              | 43    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/mro.md)                                              |
| `multani`                                     | Multani                                          | 38    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/multani.md)                                          |
| `musicalSymbols`                              | Musical Symbols                                  | 225   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/musical-symbols.md)                                  |
| `myanmar`                                     | Myanmar                                          | 160   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/myanmar.md)                                          |
| `myanmarExtendedA`                            | Myanmar Extended a                               | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/myanmar-extended-a.md)                               |
| `myanmarExtendedB`                            | Myanmar Extended B                               | 31    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/myanmar-extended-b.md)                               |
| `myanmarExtendedC`                            | Myanmar Extended C                               | 20    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/myanmar-extended-c.md)                               |
| `nko`                                         | NKo                                              | 62    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/nko.md)                                              |
| `nabataean`                                   | Nabataean                                        | 40    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/nabataean.md)                                        |
| `nagMundari`                                  | Nag Mundari                                      | 42    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/nag-mundari.md)                                      |
| `nandinagari`                                 | Nandinagari                                      | 65    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/nandinagari.md)                                      |
| `newTaiLue`                                   | New Tai Lue                                      | 83    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/new-tai-lue.md)                                      |
| `newa`                                        | Newa                                             | 97    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/newa.md)                                             |
| `numberForms`                                 | Number Forms                                     | 60    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/number-forms.md)                                     |
| `nushu`                                       | Nushu                                            | 396   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/nushu.md)                                            |
| `nyiakengPuachueHmong`                        | Nyiakeng Puachue Hmong                           | 71    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/nyiakeng-puachue-hmong.md)                           |
| `ogham`                                       | Ogham                                            | 29    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ogham.md)                                            |
| `olChiki`                                     | Ol Chiki                                         | 48    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ol-chiki.md)                                         |
| `olOnal`                                      | Ol Onal                                          | 44    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ol-onal.md)                                          |
| `oldHungarian`                                | Old Hungarian                                    | 108   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/old-hungarian.md)                                    |
| `oldItalic`                                   | Old Italic                                       | 39    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/old-italic.md)                                       |
| `oldNorthArabian`                             | Old North Arabian                                | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/old-north-arabian.md)                                |
| `oldPermic`                                   | Old Permic                                       | 43    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/old-permic.md)                                       |
| `oldPersian`                                  | Old Persian                                      | 50    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/old-persian.md)                                      |
| `oldSogdian`                                  | Old Sogdian                                      | 40    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/old-sogdian.md)                                      |
| `oldSouthArabian`                             | Old South Arabian                                | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/old-south-arabian.md)                                |
| `oldTurkic`                                   | Old Turkic                                       | 73    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/old-turkic.md)                                       |
| `oldUyghur`                                   | Old Uyghur                                       | 26    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/old-uyghur.md)                                       |
| `opticalCharacterRecognition`                 | Optical Character Recognition                    | 11    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/optical-character-recognition.md)                    |
| `oriya`                                       | Oriya                                            | 91    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/oriya.md)                                            |
| `ornamentalDingbats`                          | Ornamental Dingbats                              | 48    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ornamental-dingbats.md)                              |
| `osage`                                       | Osage                                            | 72    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/osage.md)                                            |
| `osmanya`                                     | Osmanya                                          | 40    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/osmanya.md)                                          |
| `ottomanSiyaqNumbers`                         | Ottoman Siyaq Numbers                            | 61    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ottoman-siyaq-numbers.md)                            |
| `pahawhHmong`                                 | Pahawh Hmong                                     | 127   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/pahawh-hmong.md)                                     |
| `palmyrene`                                   | Palmyrene                                        | 32    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/palmyrene.md)                                        |
| `pauCinHau`                                   | Pau Cin Hau                                      | 57    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/pau-cin-hau.md)                                      |
| `phagsPa`                                     | Phags Pa                                         | 56    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/phags-pa.md)                                         |
| `phaistosDisc`                                | Phaistos Disc                                    | 46    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/phaistos-disc.md)                                    |
| `phoenician`                                  | Phoenician                                       | 29    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/phoenician.md)                                       |
| `phoneticExtensions`                          | Phonetic Extensions                              | 128   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/phonetic-extensions.md)                              |
| `phoneticExtensionsSupplement`                | Phonetic Extensions Supplement                   | 64    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/phonetic-extensions-supplement.md)                   |
| `playingCards`                                | Playing Cards                                    | 82    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/playing-cards.md)                                    |
| `psalterPahlavi`                              | Psalter Pahlavi                                  | 29    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/psalter-pahlavi.md)                                  |
| `rejang`                                      | Rejang                                           | 37    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/rejang.md)                                           |
| `rumiNumeralSymbols`                          | Rumi Numeral Symbols                             | 31    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/rumi-numeral-symbols.md)                             |
| `runic`                                       | Runic                                            | 89    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/runic.md)                                            |
| `samaritan`                                   | Samaritan                                        | 61    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/samaritan.md)                                        |
| `saurashtra`                                  | Saurashtra                                       | 82    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/saurashtra.md)                                       |
| `sharada`                                     | Sharada                                          | 96    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sharada.md)                                          |
| `sharadaSupplement`                           | Sharada Supplement                               | 8     | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sharada-supplement.md)                               |
| `shavian`                                     | Shavian                                          | 48    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/shavian.md)                                          |
| `siddham`                                     | Siddham                                          | 92    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/siddham.md)                                          |
| `sidetic`                                     | Sidetic                                          | 26    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sidetic.md)                                          |
| `sinhala`                                     | Sinhala                                          | 91    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sinhala.md)                                          |
| `sinhalaArchaicNumbers`                       | Sinhala Archaic Numbers                          | 20    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sinhala-archaic-numbers.md)                          |
| `smallFormVariants`                           | Small Form Variants                              | 26    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/small-form-variants.md)                              |
| `smallKanaExtension`                          | Small Kana Extension                             | 9     | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/small-kana-extension.md)                             |
| `sogdian`                                     | Sogdian                                          | 42    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sogdian.md)                                          |
| `soraSompeng`                                 | Sora Sompeng                                     | 35    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sora-sompeng.md)                                     |
| `soyombo`                                     | Soyombo                                          | 83    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/soyombo.md)                                          |
| `spacingModifierLetters`                      | Spacing Modifier Letters                         | 80    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/spacing-modifier-letters.md)                         |
| `specials`                                    | Specials                                         | 2     | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/specials.md)                                         |
| `sundanese`                                   | Sundanese                                        | 64    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sundanese.md)                                        |
| `sundaneseSupplement`                         | Sundanese Supplement                             | 8     | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sundanese-supplement.md)                             |
| `sunuwar`                                     | Sunuwar                                          | 44    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sunuwar.md)                                          |
| `superscriptsAndSubscripts`                   | Superscripts and Subscripts                      | 42    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/superscripts-and-subscripts.md)                      |
| `supplementalArrowsA`                         | Supplemental Arrows a                            | 16    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/supplemental-arrows-a.md)                            |
| `supplementalArrowsB`                         | Supplemental Arrows B                            | 128   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/supplemental-arrows-b.md)                            |
| `supplementalArrowsC`                         | Supplemental Arrows C                            | 171   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/supplemental-arrows-c.md)                            |
| `supplementalMathematicalOperators`           | Supplemental Mathematical Operators              | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/supplemental-mathematical-operators.md)              |
| `supplementalPunctuation`                     | Supplemental Punctuation                         | 94    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/supplemental-punctuation.md)                         |
| `supplementalSymbolsAndPictographs`           | Supplemental Symbols and Pictographs             | 256   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/supplemental-symbols-and-pictographs.md)             |
| `suttonSignwriting`                           | Sutton SignWriting                               | 672   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/sutton-signwriting.md)                               |
| `sylotiNagri`                                 | Syloti Nagri                                     | 45    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/syloti-nagri.md)                                     |
| `symbolsAndPictographsExtendedA`              | Symbols and Pictographs Extended a               | 120   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/symbols-and-pictographs-extended-a.md)               |
| `symbolsForLegacyComputing`                   | Symbols for Legacy Computing                     | 250   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/symbols-for-legacy-computing.md)                     |
| `symbolsForLegacyComputingSupplement`         | Symbols for Legacy Computing Supplement          | 695   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/symbols-for-legacy-computing-supplement.md)          |
| `syriac`                                      | Syriac                                           | 76    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/syriac.md)                                           |
| `syriacSupplement`                            | Syriac Supplement                                | 11    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/syriac-supplement.md)                                |
| `tagalog`                                     | Tagalog                                          | 23    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tagalog.md)                                          |
| `tagbanwa`                                    | Tagbanwa                                         | 18    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tagbanwa.md)                                         |
| `taiLe`                                       | Tai Le                                           | 35    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tai-le.md)                                           |
| `taiTham`                                     | Tai Tham                                         | 127   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tai-tham.md)                                         |
| `taiViet`                                     | Tai Viet                                         | 72    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tai-viet.md)                                         |
| `taiXuanJingSymbols`                          | Tai Xuan Jing Symbols                            | 87    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tai-xuan-jing-symbols.md)                            |
| `taiYo`                                       | Tai Yo                                           | 55    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tai-yo.md)                                           |
| `takri`                                       | Takri                                            | 68    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/takri.md)                                            |
| `tamil`                                       | Tamil                                            | 72    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tamil.md)                                            |
| `tamilSupplement`                             | Tamil Supplement                                 | 51    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tamil-supplement.md)                                 |
| `tangsa`                                      | Tangsa                                           | 89    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tangsa.md)                                           |
| `tangut`                                      | Tangut                                           | 6144  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tangut.md)                                           |
| `tangutComponents`                            | Tangut Components                                | 768   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tangut-components.md)                                |
| `tangutComponentsSupplement`                  | Tangut Components Supplement                     | 115   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tangut-components-supplement.md)                     |
| `tangutSupplement`                            | Tangut Supplement                                | 31    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tangut-supplement.md)                                |
| `telugu`                                      | Telugu                                           | 101   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/telugu.md)                                           |
| `thaana`                                      | Thaana                                           | 50    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/thaana.md)                                           |
| `thai`                                        | Thai                                             | 87    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/thai.md)                                             |
| `tibetan`                                     | Tibetan                                          | 211   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tibetan.md)                                          |
| `tifinagh`                                    | Tifinagh                                         | 59    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tifinagh.md)                                         |
| `tirhuta`                                     | Tirhuta                                          | 82    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tirhuta.md)                                          |
| `todhri`                                      | Todhri                                           | 52    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/todhri.md)                                           |
| `tolongSiki`                                  | Tolong Siki                                      | 54    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tolong-siki.md)                                      |
| `toto`                                        | Toto                                             | 31    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/toto.md)                                             |
| `transportAndMapSymbols`                      | Transport and Map Symbols                        | 119   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/transport-and-map-symbols.md)                        |
| `tuluTigalari`                                | Tulu Tigalari                                    | 80    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/tulu-tigalari.md)                                    |
| `ugaritic`                                    | Ugaritic                                         | 31    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/ugaritic.md)                                         |
| `unifiedCanadianAboriginalSyllabics`          | Unified Canadian Aboriginal Syllabics            | 640   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/unified-canadian-aboriginal-syllabics.md)            |
| `unifiedCanadianAboriginalSyllabicsExtended`  | Unified Canadian Aboriginal Syllabics Extended   | 70    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/unified-canadian-aboriginal-syllabics-extended.md)   |
| `unifiedCanadianAboriginalSyllabicsExtendedA` | Unified Canadian Aboriginal Syllabics Extended a | 16    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/unified-canadian-aboriginal-syllabics-extended-a.md) |
| `vai`                                         | Vai                                              | 300   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/vai.md)                                              |
| `variationSelectors`                          | Variation Selectors                              | 16    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/variation-selectors.md)                              |
| `variationSelectorsSupplement`                | Variation Selectors Supplement                   | 240   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/variation-selectors-supplement.md)                   |
| `vedicExtensions`                             | Vedic Extensions                                 | 43    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/vedic-extensions.md)                                 |
| `verticalForms`                               | Vertical Forms                                   | 10    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/vertical-forms.md)                                   |
| `vithkuqi`                                    | Vithkuqi                                         | 70    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/vithkuqi.md)                                         |
| `wancho`                                      | Wancho                                           | 59    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/wancho.md)                                           |
| `warangCiti`                                  | Warang Citi                                      | 84    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/warang-citi.md)                                      |
| `yezidi`                                      | Yezidi                                           | 47    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/yezidi.md)                                           |
| `yiRadicals`                                  | Yi Radicals                                      | 55    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/yi-radicals.md)                                      |
| `yiSyllables`                                 | Yi Syllables                                     | 1165  | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/yi-syllables.md)                                     |
| `yijingHexagramSymbols`                       | Yijing Hexagram Symbols                          | 64    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/yijing-hexagram-symbols.md)                          |
| `zanabazarSquare`                             | Zanabazar Square                                 | 72    | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/zanabazar-square.md)                                 |
| `znamennyMusicalNotation`                     | Znamenny Musical Notation                        | 185   | [chars](https://github.com/jcubic/unicode-picker/blob/master/docs/unicode/znamenny-musical-notation.md)                        |

<!-- BLOCKS:END -->

## Development

```sh
npm install
npm run gen      # regenerate the dataset + docs from @unicode/unicode-17.0.0
npm run build    # ESM + IIFE + types
npm test         # unit tests (Vitest)
npm run lint     # eslint + prettier
```

## Credits

- Character data: [`@unicode/unicode-17.0.0`](https://github.com/node-unicode/unicode-17.0.0) (Unicode 17.0).
- Emoji names: CLDR annotations via [`emojibase-data`](https://github.com/milesj/emojibase).

Both are used only at build time; the published package has no runtime dependencies.

## License

Copyright (c) 2026 [Jakub T. Jankiewicz](https://jakub.jankiewicz.org/)

Released under the MIT License. See [LICENSE](https://github.com/jcubic/unicode-picker/blob/master/LICENSE) for details.
