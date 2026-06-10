#!/usr/bin/env node
/**
 * patch-elapsed-hours.mjs
 * Recomputes missionElapsedHours from the stored capturedAt ISO timestamp
 * with 4-decimal precision instead of 1-decimal (0.1h = 6-minute buckets).
 * No network requests needed — all data is already in photos.json.
 *
 * Usage: node tools/patch-elapsed-hours.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const LAUNCH_EPOCH = new Date('2026-04-01T22:35:00Z');
const OUTPUT_PATH  = resolve('public/photos.json');

const data = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));

let patched = 0, missing = 0;

for (const entry of data) {
  if (!entry.capturedAt) { missing++; continue; }
  const capturedAt = new Date(entry.capturedAt);
  if (isNaN(capturedAt.getTime())) { missing++; continue; }
  const precise = (capturedAt.getTime() - LAUNCH_EPOCH.getTime()) / 3_600_000;
  const rounded = Math.round(precise * 10000) / 10000; // 4 decimal places ≈ 0.36s precision
  if (entry.missionElapsedHours !== rounded) {
    entry.missionElapsedHours = rounded;
    patched++;
  }
}

data.sort((a, b) => a.missionElapsedHours - b.missionElapsedHours);
writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));

console.log(`\n✅  Patched ${patched} entries (${missing} skipped — no capturedAt)`);

// Show duplicate stats after patch
const dupes = {};
data.forEach(p => { dupes[p.missionElapsedHours] = (dupes[p.missionElapsedHours]||0)+1; });
const dupCount = Object.values(dupes).filter(c=>c>1).reduce((a,b)=>a+b,0);
console.log(`   Duplicate missionElapsedHours after patch: ${dupCount} of ${data.length}`);
console.log(`   Output: ${OUTPUT_PATH}\n`);
