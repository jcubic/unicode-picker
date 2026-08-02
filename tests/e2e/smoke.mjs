// Headless real-browser smoke test for the built demo.
// Serves the project root itself, so it just needs `npm run build` first.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.map': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(join(ROOT, decodeURIComponent(req.url.split('?')[0])));
    res.writeHead(200, { 'content-type': TYPES[extname(req.url)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, r));
const URL = `http://localhost:${server.address().port}/demo/index.html`;

const assert = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('ok -', msg);
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

// Open the popover anchored to the button.
await page.click('#open');
const host = page.locator('div[popover]');
await host.waitFor({ state: 'visible' });
assert(await host.evaluate((el) => el.matches(':popover-open')), 'native popover is open');

// Wait for the grid to render cells inside the shadow root.
await page.waitForFunction(() =>
  document.querySelector('div[popover]')?.shadowRoot?.querySelector('.cells button')
);

// Virtualization: not every character of every block is in the DOM at once.
const rendered = await host.evaluate(
  (el) => el.shadowRoot.querySelectorAll('.cells button').length
);
assert(rendered > 0, `grid rendered ${rendered} cells`);

// Select the first cell, then Insert -> the insert event fills the textarea.
await host.evaluate((el) => el.shadowRoot.querySelector('.cells button').click());
const inspectorName = await host.evaluate((el) => el.shadowRoot.querySelector('.dmeta b').textContent);
assert(inspectorName && inspectorName !== 'No selection', `inspector shows "${inspectorName}"`);

await host.evaluate((el) => el.shadowRoot.querySelector('.btn.primary').click());
const out = await page.inputValue('#out');
assert(out.length > 0, `insert appended "${out}" to the textarea`);

// Search narrows the grid.
await host.evaluate((el) => {
  const input = el.shadowRoot.querySelector('.search input');
  input.value = 'umbrella';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(50);
const afterSearch = await host.evaluate(
  (el) => [...el.shadowRoot.querySelectorAll('.cells button')].filter((b) => !b.hidden).length
);
assert(afterSearch >= 1, `search matched ${afterSearch} cell(s)`);

assert(errors.length === 0, 'no uncaught page errors' + (errors.length ? ': ' + errors.join('; ') : ''));

await browser.close();
server.close();
console.log('\nAll smoke checks passed.');
