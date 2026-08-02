/**
 * Generate per-block character references under docs/unicode/ and the block
 * table injected into README.md (between the BLOCKS markers).
 *
 * Run with: npm run gen:docs
 */
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBlocks, loadEmoji, type SourceBlock } from './unicode-source';
import { toUnicodeNotation } from '../src/util/codepoint';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DOCS_DIR = join(ROOT, 'docs', 'unicode');
const REPO = 'https://github.com/jcubic/unicode-picker/blob/master/docs/unicode';

const START = '<!-- BLOCKS:START -->';
const END = '<!-- BLOCKS:END -->';

/** Escape a character for safe display inside a markdown table cell. */
function cell(char: string): string {
  if (char === '|') return '\\|';
  if (char === '`') return '`` ` ``';
  return `\`${char}\``;
}

function blockDoc(b: SourceBlock): string {
  const [start, end] = b.range;
  const rows = b.chars
    .map((c) => `| ${cell(c.char)} | ${toUnicodeNotation(c.cp)} | ${c.cp} | ${c.name || '—'} |`)
    .join('\n');
  return (
    `# ${b.name}\n\n` +
    `\`\`\`ts\nimport { ${b.exportId} } from 'unicode-picker/data';\n\`\`\`\n\n` +
    `- Range: ${toUnicodeNotation(start)}–${toUnicodeNotation(end)}\n` +
    `- Characters: ${b.count}\n\n` +
    `| Char | Code point | Decimal | Name |\n` +
    `| --- | --- | --- | --- |\n` +
    `${rows}\n`
  );
}

function tableRows(blocks: SourceBlock[]): string {
  return blocks
    .map((b) => `| \`${b.exportId}\` | ${b.name} | ${b.count} | [chars](${REPO}/${b.slug}.md) |`)
    .join('\n');
}

function main(): void {
  const emoji = loadEmoji();
  const blocks = loadBlocks();
  const all = [emoji, ...blocks];

  rmSync(DOCS_DIR, { recursive: true, force: true });
  mkdirSync(DOCS_DIR, { recursive: true });

  for (const b of all) {
    writeFileSync(join(DOCS_DIR, `${b.slug}.md`), blockDoc(b));
  }

  const table =
    `| Import | Unicode block | Chars | Reference |\n` +
    `| --- | --- | --- | --- |\n` +
    `${tableRows(all)}\n`;

  writeFileSync(
    join(DOCS_DIR, 'README.md'),
    `# Unicode blocks\n\nEvery block available from \`unicode-picker/data\`.\n\n${table}`
  );

  // Inject the table into the root README between markers, if present.
  const readmePath = join(ROOT, 'README.md');
  if (existsSync(readmePath)) {
    const readme = readFileSync(readmePath, 'utf8');
    if (readme.includes(START) && readme.includes(END)) {
      const next = readme.replace(
        new RegExp(`${START}[\\s\\S]*${END}`),
        `${START}\n\n${table}\n${END}`
      );
      writeFileSync(readmePath, next);
      console.log('Injected block table into README.md');
    }
  }

  console.log(`Generated ${all.length} block docs in docs/unicode/.`);
}

main();
