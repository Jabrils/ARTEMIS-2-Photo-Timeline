#!/usr/bin/env node
/**
 * patch-other-offsets.mjs
 * Fixes timestamps for non-art002/non-NHQ entries whose UTC offset was ignored.
 * Usage: node tools/patch-other-offsets.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const LAUNCH      = new Date('2026-04-01T22:35:00Z');
const OUTPUT_PATH = resolve('public/photos.json');

const data = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
const suspects = data.filter(p =>
  p.nasaId &&
  !p.nasaId.toLowerCase().startsWith('art002') &&
  !p.nasaId.toLowerCase().startsWith('nhq')
);
console.log(`Checking ${suspects.length} non-art002/non-NHQ entries:`, suspects.map(p => p.nasaId).join(', '), '\n');

let fixed = 0;
for (const entry of suspects) {
  const url = `https://images-assets.nasa.gov/image/${entry.nasaId}/${entry.nasaId}~orig.jpg`;
  const tmp = join(tmpdir(), `patchoff_${entry.nasaId}.jpg`);
  process.stdout.write(`${entry.nasaId} ... `);
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-131071' }, signal: AbortSignal.timeout(15000) });
    if (!res.ok && res.status !== 206) { console.log(`fetch failed: ${res.status}`); continue; }
    writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
    const json = execSync(`exiftool -json -q "${tmp}"`, { encoding: 'utf-8', timeout: 10000 });
    const exif = JSON.parse(json)?.[0];
    if (!exif?.DateTimeOriginal) { console.log('no EXIF'); continue; }

    const raw = String(exif.DateTimeOriginal).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const off = exif.OffsetTimeOriginal || exif.OffsetTime || '';

    let utc;
    if (/[+-]\d{2}:\d{2}$/.test(raw)) utc = new Date(raw);
    else if (off && /^[+-]\d{2}:\d{2}$/.test(off)) utc = new Date(raw + off);
    else utc = new Date(raw + 'Z');

    const newElapsed = Math.round((utc.getTime() - LAUNCH.getTime()) / 360) / 10000;
    const diff = Math.abs(newElapsed - entry.missionElapsedHours);

    if (diff > 0.001) {
      console.log(`FIXED  T+${entry.missionElapsedHours}h → T+${newElapsed}h  (offset: ${off || 'none'})`);
      entry.missionElapsedHours = newElapsed;
      entry.capturedAt = utc.toISOString();
      fixed++;
    } else {
      console.log(`ok  T+${newElapsed}h`);
    }
  } catch (e) {
    console.log(`error: ${e.message}`);
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
}

data.sort((a, b) => a.missionElapsedHours - b.missionElapsedHours);
writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
console.log(`\nFixed ${fixed} entries. Output: ${OUTPUT_PATH}`);
