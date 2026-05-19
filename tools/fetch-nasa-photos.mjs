#!/usr/bin/env node
/**
 * fetch-nasa-photos.mjs
 *
 * Processes NASA Images photos and writes public/photos.json.
 * NASA's search API blocks programmatic access, so provide IDs via a text file.
 *
 * Usage:
 *   node tools/fetch-nasa-photos.mjs --ids=tools/nasa-ids.txt   # process a list of IDs
 *   node tools/fetch-nasa-photos.mjs --ids=tools/nasa-ids.txt --reset  # clear manifest first
 *
 * ID list format (tools/nasa-ids.txt) — one NASA ID per line, # for comments:
 *   # Artemis II mission photos
 *   art002e009166
 *   art002e004462
 *   NHQ202604070017
 *
 * How to get IDs:
 *   1. Browse https://images.nasa.gov/search?q=artemis+II&media=image&yearStart=2026&yearEnd=2026
 *   2. Click each photo — the ID is in the URL: /details/art002e009166
 *   3. Add each ID to tools/nasa-ids.txt
 *
 * Requirements: Node 18+, exiftool on PATH
 */

import { execSync }                                       from 'child_process';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { tmpdir }                                         from 'os';
import { join, resolve }                                  from 'path';

// ─── Mission constants ────────────────────────────────────────────────────────
const LAUNCH_EPOCH  = new Date('2026-04-01T22:35:00Z');
const MISSION_END   = new Date('2026-04-11T00:08:00Z'); // T+217.53h

// ─── Config ───────────────────────────────────────────────────────────────────
const OUTPUT_PATH   = resolve('public/photos.json');
const EXIF_DELAY_MS = 150;   // pause between EXIF downloads (be polite to NASA CDN)
const RANGE_BYTES   = 131071; // 128KB — enough to capture EXIF in most JPEGs

// ─── Flags ────────────────────────────────────────────────────────────────────
const RESET    = process.argv.includes('--reset');
const IDS_FLAG = process.argv.find(a => a.startsWith('--ids='));
const IDS_FILE = IDS_FLAG ? IDS_FLAG.replace('--ids=', '') : 'tools/nasa-ids.txt';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadManifest() {
  if (RESET || !existsSync(OUTPUT_PATH)) return [];
  try { return JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8')); }
  catch { return []; }
}

function elapsed(utcDate) {
  return Math.round((utcDate.getTime() - LAUNCH_EPOCH.getTime()) / 360_000) / 10;
  // rounds to 1 decimal place (nearest 0.1h)
}

/**
 * Parse DateTimeOriginal → UTC Date.
 *
 * Spacecraft cameras (art002e*): EXIF time IS UTC despite -05:00 offset metadata.
 * Ground cameras (NHQ*): EXIF time is local, apply OffsetTimeOriginal to get UTC.
 * Everything else: assume UTC (conservative).
 */
function exifToUtc(exif, nasaId) {
  const raw = exif?.DateTimeOriginal;
  if (!raw) return null;

  // Normalise "2026:04:03 23:32:38[.xx][-05:00]" → ISO-parseable
  const iso = String(raw)
    .replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
    .replace(/(\.\d+)?([+-]\d{2}:\d{2})?$/, (_, sub, tz) => (sub || '') + (tz || ''));

  const id = nasaId.toLowerCase();

  if (id.startsWith('art002')) {
    // Strip any offset — clock was UTC, offset metadata is wrong
    const noTz = iso.replace(/[+-]\d{2}:\d{2}$/, '');
    return new Date(noTz + 'Z');
  }

  if (id.startsWith('nhq')) {
    // Ground photo — offset is correct; if missing assume UTC
    if (/[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso);
    const off = exif.OffsetTimeOriginal || exif.OffsetTime || '+00:00';
    return new Date(iso + off);
  }

  // Default: treat as UTC
  const noTz = iso.replace(/[+-]\d{2}:\d{2}$/, '');
  return new Date(noTz + 'Z');
}

/**
 * Download the first RANGE_BYTES of a JPEG URL and run exiftool on it.
 * Returns the parsed exif object, or null on failure.
 */
async function readExif(url, nasaId) {
  const tmp = join(tmpdir(), `artemis_${nasaId}.jpg`);
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


// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  Artemis II Photo Fetcher');
  console.log(`    Mission window: ${LAUNCH_EPOCH.toISOString()} → ${MISSION_END.toISOString()}`);
  if (RESET) console.log('    Mode: RESET (clearing existing manifest)');
  console.log('');

  // ── 1. Read ID list ────────────────────────────────────────────────────────
  const idsPath = resolve(IDS_FILE);
  if (!existsSync(idsPath)) {
    console.error(`❌  ID file not found: ${idsPath}`);
    console.error(`    Create it with one NASA ID per line. Example:`);
    console.error(`      art002e009166`);
    console.error(`      art002e004462`);
    console.error(`      NHQ202604070017`);
    console.error(`\n    Browse https://images.nasa.gov/search?q=artemis+II&media=image&yearStart=2026&yearEnd=2026`);
    console.error(`    The ID is in the URL when you click a photo: /details/art002e009166\n`);
    process.exit(1);
  }

  const rawIds = readFileSync(idsPath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  const nasaIds = [...new Set(rawIds)]; // deduplicate
  console.log(`📋  Loaded ${nasaIds.length} IDs from ${IDS_FILE}\n`);

  // ── 2. Load existing manifest ──────────────────────────────────────────────
  const existing    = loadManifest();
  const existingIds = new Set(existing.map(p => p.nasaId));
  console.log(`📦  Existing manifest: ${existing.length} entries\n`);

  // ── 3. Process each ID ────────────────────────────────────────────────────
  const results = [...existing];
  const stats   = { added: 0, skipped: 0, outOfWindow: 0, noExif: 0 };

  for (let i = 0; i < nasaIds.length; i++) {
    const nasaId = nasaIds[i];
    const prefix = `[${String(i + 1).padStart(3)}/${nasaIds.length}] ${nasaId}`;

    if (existingIds.has(nasaId)) {
      console.log(`${prefix} — already in manifest`);
      stats.skipped++;
      continue;
    }

    const url = `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~orig.jpg`;
    process.stdout.write(`${prefix} ... `);

    const exif = await readExif(url, nasaId);
    if (!exif) {
      process.stdout.write('⚠  no EXIF (skipped)\n');
      stats.noExif++;
      await sleep(EXIF_DELAY_MS);
      continue;
    }

    const capturedAt = exifToUtc(exif, nasaId);
    if (!capturedAt || isNaN(capturedAt.getTime())) {
      process.stdout.write('⚠  unreadable date (skipped)\n');
      stats.noExif++;
      await sleep(EXIF_DELAY_MS);
      continue;
    }

    if (capturedAt < LAUNCH_EPOCH || capturedAt > MISSION_END) {
      process.stdout.write(`✗  out of window (${capturedAt.toISOString()})\n`);
      stats.outOfWindow++;
      await sleep(EXIF_DELAY_MS);
      continue;
    }

    const missionElapsedHours = elapsed(capturedAt);
    const focalLength  = exif.FocalLength ? Math.round(Number(exif.FocalLength)) : undefined;
    const camera       = [exif.Make, exif.Model].filter(Boolean).join(' ') || undefined;
    const description  = (exif['Caption-Abstract'] || '').slice(0, 400);

    results.push({
      nasaId,
      name: nasaId,
      missionElapsedHours,
      description,
      photo: url,
      focalLength,
      camera,
      capturedAt: capturedAt.toISOString(),
    });

    stats.added++;
    process.stdout.write(`✓  T+${missionElapsedHours}h${focalLength ? `  ${focalLength}mm` : ''}  ${camera ?? ''}\n`);
    await sleep(EXIF_DELAY_MS);
  }

  // ── 4. Sort and write ──────────────────────────────────────────────────────
  results.sort((a, b) => a.missionElapsedHours - b.missionElapsedHours);
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));

  console.log(`
✅  Done.
    Added:           ${stats.added}
    Skipped:         ${stats.skipped}  (already in manifest)
    Out of window:   ${stats.outOfWindow}
    No EXIF / error: ${stats.noExif}
    ─────────────────────────────
    Total in manifest: ${results.length}
    Output: ${OUTPUT_PATH}
`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
