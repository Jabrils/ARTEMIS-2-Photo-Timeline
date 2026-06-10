#!/usr/bin/env node
/**
 * patch-titles.mjs
 * Backfills a `title` field for photos.json entries that have
 * a meaningful Title/Headline in their EXIF (primarily NHQ photos).
 *
 * Usage: node tools/patch-titles.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const OUTPUT_PATH = resolve('public/photos.json');
const RANGE_BYTES = 131071;
const DELAY_MS    = 120;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function extractTitle(exif) {
  // Prefer Title > Headline > Object Name
  // Reject if value is just the NASA ID (matches art002e/NHQ patterns) or empty
  for (const field of ['Title', 'Headline', 'ObjectName']) {
    const val = exif[field];
    if (!val) continue;
    const s = String(val).trim();
    if (!s) continue;
    // Skip if it's just the NASA ID (no spaces, looks like an ID)
    if (/^[a-zA-Z0-9_\-~]+$/.test(s) && s.length < 40) continue;
    return s;
  }
  return null;
}

async function main() {
  const data = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
  const missing = data.filter(p => !p.title);
  console.log(`\n🏷️  Fetching titles for ${missing.length} entries...\n`);

  let added = 0, skipped = 0;

  for (let i = 0; i < missing.length; i++) {
    const entry = missing[i];
    process.stdout.write(`[${String(i+1).padStart(4)}/${missing.length}] ${entry.nasaId} ... `);

    const url = `https://images-assets.nasa.gov/image/${entry.nasaId}/${entry.nasaId}~orig.jpg`;
    const tmp = join(tmpdir(), `title_${entry.nasaId}.jpg`);
    try {
      const res = await fetch(url, {
        headers: { Range: `bytes=0-${RANGE_BYTES}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok && res.status !== 206) { process.stdout.write(`fetch ${res.status}\n`); skipped++; continue; }
      writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
      const json = execSync(`exiftool -json -q "${tmp}"`, { encoding: 'utf-8', timeout: 10_000 });
      const exif = JSON.parse(json)?.[0] ?? {};
      const title = extractTitle(exif);
      if (title) {
        entry.title = title;
        added++;
        process.stdout.write(`✓  "${title}"\n`);
      } else {
        process.stdout.write(`— no title in EXIF\n`);
        skipped++;
      }
    } catch (e) {
      process.stdout.write(`error: ${e.message}\n`);
      skipped++;
    } finally {
      try { unlinkSync(tmp); } catch {}
    }
    await sleep(DELAY_MS);
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log(`\n✅  Added titles: ${added}  No title in EXIF: ${skipped}`);
  console.log(`    Output: ${OUTPUT_PATH}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
