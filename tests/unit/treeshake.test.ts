import { describe, it, expect } from 'vitest';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function bundleImporting(names: string): Promise<string> {
  const result = await build({
    stdin: {
      contents: `import { ${names} } from './providers/data/index';\nconsole.log(${names});`,
      resolveDir: ROOT,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    treeShaking: true,
    write: false,
    logLevel: 'silent',
  });
  return result.outputFiles[0]!.text;
}

describe('tree-shaking', () => {
  it('drops blocks that are not imported', async () => {
    const out = await bundleImporting('arrows');
    // The imported block is present…
    expect(out).toContain('LEFTWARDS ARROW');
    // …but characters/names exclusive to other blocks are gone.
    expect(out).not.toContain('UMBRELLA'); // Miscellaneous Symbols
    expect(out).not.toContain('GREEK CAPITAL LETTER HETA'); // Greek and Coptic
  }, 20000);

  it('keeps only the requested blocks when importing several', async () => {
    const out = await bundleImporting('greekAndCoptic, mathematicalOperators');
    expect(out).toContain('GREEK CAPITAL LETTER HETA'); // greek
    expect(out).toContain('FOR ALL'); // math (U+2200 ∀)
    expect(out).not.toContain('LEFTWARDS ARROW'); // arrows not imported
  }, 20000);
});
