#!/usr/bin/env node
/**
 * add-photo.mjs
 * Add a single NASA photo to public/photos.json by ID.
 *
 * Usage:
 *   node tools/add-photo.mjs art002e021110
 *   node tools/add-photo.mjs NHQ202604070017
 */

import { execSync }                           from 'child_process';
import { writeFileSync, readFileSync,
         existsSync, unlinkSync,
         appendFileSync, mkdirSync }          from 'fs';
import { tmpdir }                             from 'os';
import { join, resolve }                      from 'path';

const LAUNCH_EPOCH  = new Date('2026-04-01T22:35:00Z');
const MISSION_END   = new Date('2026-04-11T00:08:00Z');
const OUTPUT_PATH   = resolve('public/photos.json');
const NO_EXIF_PATH  = resolve('tools/rejected/no-exif.txt');
const RANGE_BYTES   = 131071;

const nasaId = process.argv[2];
if (!nasaId) {
  console.error('Usage: node tools/add-photo.mjs <nasa-id>');
  console.error('Example: node tools/add-photo.mjs art002e021110');
  process.exit(1);
}

function elapsed(utcDate) {
  return Math.round((utcDate.getTime() - LAUNCH_EPOCH.getTime()) / 360) / 10000;
}

function exifToUtc(exif, id) {
  const raw = exif?.DateTimeOriginal;
  if (!raw) return null;
  const iso = String(raw).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
  const lid = id.toLowerCase();
  if (lid.startsWith('art002')) return new Date(iso.replace(/[+-]\d{2}:\d{2}$/, '') + 'Z');
  if (lid.startsWith('nhq')) {
    if (/[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso);
    const off = exif.OffsetTimeOriginal || exif.OffsetTime || '+00:00';
    return new Date(iso + off);
  }
  // Default: apply offset if present in EXIF, otherwise treat as UTC
  if (/[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso);
  const off = exif.OffsetTimeOriginal || exif.OffsetTime || '';
  if (off && /^[+-]\d{2}:\d{2}$/.test(off)) return new Date(iso + off);
  return new Date(iso.replace(/[+-]\d{2}:\d{2}$/, '') + 'Z');
}

async function main() {
  console.log(`\n📸  Adding: ${nasaId}`);

  // Load existing manifest
  const existing = existsSync(OUTPUT_PATH)
    ? JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'))
    : [];

  if (existing.some(p => p.nasaId === nasaId)) {
    console.log(`✓  Already in manifest — nothing to do.`);
    return;
  }

  const url = `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~orig.jpg`;
  console.log(`    URL: ${url}`);

  // Download first 128KB for EXIF
  const tmp = join(tmpdir(), `artemis_add_${nasaId}.jpg`);
  try {
    const res = await fetch(url, {
      headers: { Range: `bytes=0-${RANGE_BYTES}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok && res.status !== 206) {
      console.error(`❌  HTTP ${res.status} — image not found on NASA CDN`);
      console.error(`    Check the ID at: https://images.nasa.gov/details/${nasaId}`);
      process.exit(1);
    }
    writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    console.error(`❌  Fetch failed: ${e.message}`);
    process.exit(1);
  }

  let exif;
  try {
    const json = execSync(`exiftool -json -q "${tmp}"`, { encoding: 'utf-8', timeout: 10_000 });
    exif = JSON.parse(json)?.[0] ?? null;
  } finally {
    try { unlinkSync(tmp); } catch {}
  }

  if (!exif) {
    console.error(`❌  No EXIF data found.`);
    console.error(`    Check manually: https://images.nasa.gov/details/${nasaId}`);
    process.exit(1);
  }

  // Show all date-related EXIF for transparency
  console.log('\n    EXIF timestamps:');
  for (const [k, v] of Object.entries(exif)) {
    if (/date|time|offset/i.test(k)) console.log(`      ${k}: ${v}`);
  }

  const capturedAt = exifToUtc(exif, nasaId);
  if (!capturedAt || isNaN(capturedAt.getTime())) {
    console.error(`\n❌  Could not parse capture date.`);
    process.exit(1);
  }

  console.log(`\n    Capture UTC: ${capturedAt.toISOString()}`);

  if (capturedAt < LAUNCH_EPOCH || capturedAt > MISSION_END) {
    console.error(`\n❌  Out of mission window.`);
    console.error(`    Captured: ${capturedAt.toISOString()}`);
    console.error(`    Window:   ${LAUNCH_EPOCH.toISOString()} → ${MISSION_END.toISOString()}`);
    process.exit(1);
  }

  const missionElapsedHours = elapsed(capturedAt);
  const flParsed = parseFloat(String(exif.FocalLength ?? ''));
  const focalLength = isFinite(flParsed) && flParsed > 0 ? Math.round(flParsed) : undefined;
  const camera      = [exif.Make, exif.Model].filter(Boolean).join(' ') || undefined;
  const description = (exif['Caption-Abstract'] || '').slice(0, 400);
  const rawTitle    = String(exif.Title || exif.Headline || exif.ObjectName || '').trim();
  const title       = rawTitle && !/^[a-zA-Z0-9_\-~]+$/.test(rawTitle) ? rawTitle : undefined;

  const entry = {
    nasaId,
    name: nasaId,
    missionElapsedHours,
    title,
    description,
    photo: url,
    focalLength,
    camera,
    capturedAt: capturedAt.toISOString(),
  };

  existing.push(entry);
  existing.sort((a, b) => a.missionElapsedHours - b.missionElapsedHours);
  writeFileSync(OUTPUT_PATH, JSON.stringify(existing, null, 2));

  console.log(`\n✅  Added to manifest.`);
  console.log(`    T+${missionElapsedHours}h${focalLength ? `  ${focalLength}mm` : ''}  ${camera ?? ''}`);
  console.log(`    Total in manifest: ${existing.length}`);
  console.log(`\n    Refresh the browser to see it on the timeline.`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
