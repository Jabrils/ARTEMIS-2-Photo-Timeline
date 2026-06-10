#!/usr/bin/env node
/**
 * patch-focal-length.mjs
 * One-time fix: re-reads EXIF for photos.json entries with null/missing focalLength
 * and patches them in place. Run once after fixing the parseFloat bug.
 *
 * Usage: node tools/patch-focal-length.mjs
 */

import { execSync }                          from 'child_process';
import { writeFileSync, readFileSync,
         existsSync, unlinkSync }            from 'fs';
import { tmpdir }                            from 'os';
import { join, resolve }                     from 'path';

const OUTPUT_PATH  = resolve('public/photos.json');
const RANGE_BYTES  = 131071;
const DELAY_MS     = 120;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function readExif(url, nasaId) {
  const tmp = join(tmpdir(), `patch_${nasaId}.jpg`);
  try {
    const res = await fetch(url, {
      headers: { Range: `bytes=0-${RANGE_BYTES}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok && res.status !== 206) return null;
    writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
    const json = execSync(`exiftool -json -q "${tmp}"`, { encoding: 'utf-8', timeout: 10_000 });
    return JSON.parse(json)?.[0] ?? null;
  } catch {
    return null;
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
}

async function main() {
  if (!existsSync(OUTPUT_PATH)) { console.error('photos.json not found'); process.exit(1); }

  const data = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
  const needsPatch = data.filter(p => p.focalLength == null);

  console.log(`\n🔧  Patching focal length for ${needsPatch.length} of ${data.length} entries...\n`);

  let patched = 0, failed = 0;

  for (let i = 0; i < needsPatch.length; i++) {
    const entry = needsPatch[i];
    process.stdout.write(`[${String(i+1).padStart(3)}/${needsPatch.length}] ${entry.nasaId} ... `);

    const exif = await readExif(entry.photo, entry.nasaId);
    const flParsed = parseFloat(String(exif?.FocalLength ?? ''));
    const focalLength = isFinite(flParsed) && flParsed > 0 ? Math.round(flParsed) : undefined;

    if (focalLength) {
      entry.focalLength = focalLength;
      patched++;
      process.stdout.write(`✓  ${focalLength}mm\n`);
    } else {
      process.stdout.write('— no focal length in EXIF\n');
      failed++;
    }

    await sleep(DELAY_MS);
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log(`\n✅  Done. Patched: ${patched}  No EXIF focal length: ${failed}`);
  console.log(`    Output: ${OUTPUT_PATH}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
