/**
 * extract-ids.mjs
 * Parses NASA Images search result HTML pages and extracts all image IDs.
 * Writes tools/nasa-ids.txt ready for fetch-nasa-photos.mjs.
 *
 * Usage: node tools/extract-ids.mjs [html-dir]
 * Default html-dir: nasa-img-pages
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const htmlDir = resolve(process.argv[2] ?? 'nasa-img-pages');
const outFile = resolve('tools/nasa-ids.txt');

if (!existsSync(htmlDir)) {
  console.error(`Directory not found: ${htmlDir}`);
  process.exit(1);
}

// Read all .html files in the directory
const files = readdirSync(htmlDir)
  .filter(f => f.endsWith('.html'))
  .sort((a, b) => {
    // Sort page1, page2, ... numerically
    const n = s => parseInt(s.match(/\d+/)?.[0] ?? '0');
    return n(a) - n(b);
  });

console.log(`Found ${files.length} HTML files in ${htmlDir}:\n  ${files.join(', ')}\n`);

// Extract all unique IDs matching /details/{id}
const seen = new Set();
for (const file of files) {
  const html = readFileSync(join(htmlDir, file), 'utf-8');
  const matches = html.matchAll(/details\/([a-zA-Z0-9_-]+)/g);
  for (const [, id] of matches) seen.add(id);
}

const all = [...seen].sort();
console.log(`Extracted ${all.length} unique IDs.\n`);

// Group by prefix for readability
const groups = {
  art:   all.filter(id => id.startsWith('art')),
  NHQ:   all.filter(id => id.startsWith('NHQ')),
  KSC:   all.filter(id => id.startsWith('KSC')),
  JSC:   all.filter(id => id.startsWith('jsc') || id.startsWith('JSC')),
  other: all.filter(id => !['art','NHQ','KSC','jsc','JSC'].some(p => id.startsWith(p))),
};

const lines = [
  '# Artemis II Mission Photos — NASA Image IDs',
  `# Extracted from ${htmlDir}/ (${files.length} pages: ${files.join(', ')})`,
  '# EXIF date filter in fetch-nasa-photos.mjs drops anything outside the mission window.',
  '# Run: npm run fetch-photos',
  '',
];

for (const [label, ids] of Object.entries(groups)) {
  if (!ids.length) continue;
  lines.push(`# ── ${label} series (${ids.length} IDs) ${'─'.repeat(40 - label.length)}`);
  lines.push(...ids);
  lines.push('');
}

writeFileSync(outFile, lines.join('\n'));
console.log(`Breakdown:`);
for (const [label, ids] of Object.entries(groups)) {
  if (ids.length) console.log(`  ${label.padEnd(8)} ${ids.length}`);
}
console.log(`\nWritten to ${outFile}`);
console.log(`\nNext: npm run fetch-photos`);
