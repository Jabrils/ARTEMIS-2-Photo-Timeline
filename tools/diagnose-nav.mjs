import { readFileSync } from 'fs';

const d = JSON.parse(readFileSync('public/photos.json', 'utf-8'));
const photos = d.filter(p => p.photo).sort((a,b) => a.missionElapsedHours - b.missionElapsedHours);

// Count duplicates
const dupes = {};
photos.forEach(p => { dupes[p.missionElapsedHours] = (dupes[p.missionElapsedHours]||0)+1; });
const dupEntries = Object.entries(dupes).filter(([,c])=>c>1);
const dupCount = dupEntries.reduce((a,[,c])=>a+c, 0);
console.log(`Photos with duplicate missionElapsedHours: ${dupCount} of ${photos.length}`);
console.log(`Worst offenders:`, dupEntries.sort((a,b)=>b[1]-a[1]).slice(0,5));

// Test the index mismatch at a few key times
for (const elapsedHours of [0, 30, 120.0, 120.5, 143, 180]) {
  // derivedPhotoIndex: last photo AT OR BEFORE current time
  let derived = 0;
  for (let i = photos.length-1; i>=0; i--) {
    if (elapsedHours >= photos[i].missionElapsedHours) { derived=i; break; }
  }

  // What PhotoPanel shows: closest photo within ±0.5h
  const inWindow = photos
    .map((p,i) => ({...p, i, delta: Math.abs(elapsedHours - p.missionElapsedHours)}))
    .filter(p => p.delta <= 0.5)
    .sort((a,b) => a.delta - b.delta);
  const pip = inWindow[0];

  const mismatch = pip && pip.i !== derived;
  console.log(`T+${elapsedHours}h: derived=${derived}(${photos[derived]?.missionElapsedHours}h)  PIP=${pip?.i ?? 'none'}(${pip?.missionElapsedHours ?? 'none'}h)  MISMATCH=${mismatch}`);
  if (mismatch) {
    console.log(`  → clicking → would go to photo[${derived+1}] but PIP shows photo[${pip.i}]`);
    console.log(`  → first click appears to do nothing (navigates to already-visible photo)`);
  }
}
