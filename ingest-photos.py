"""
Photo ingestion script for Artemis 2 Tracker.
Reads EXIF timestamps from all images in public/photos/ and outputs
mission-config.ts milestone entries with correct missionElapsedHours.

Usage:
    python ingest-photos.py
"""

import os
import json
from datetime import datetime, timezone, timedelta
from PIL import Image
from PIL.ExifTags import TAGS

LAUNCH_UTC = datetime(2026, 4, 1, 22, 35, 12, tzinfo=timezone.utc)
PHOTOS_DIR = os.path.join(os.path.dirname(__file__), 'public', 'photos')


def parse_offset(offset_str: str) -> timezone:
    """Parse OffsetTime string like '-05:00' or '+02:00' into a timezone."""
    sign = 1 if offset_str[0] == '+' else -1
    parts = offset_str[1:].split(':')
    hours, minutes = int(parts[0]), int(parts[1])
    return timezone(timedelta(hours=sign * hours, minutes=sign * minutes))


def get_exif(path: str) -> dict:
    img = Image.open(path)
    raw = img._getexif()
    if not raw:
        return {}
    return {TAGS.get(tag_id, tag_id): val for tag_id, val in raw.items()}


def photo_to_met(path: str) -> tuple[float, str] | None:
    """
    Returns (missionElapsedHours, iso_utc_string) or None if no usable EXIF.
    """
    exif = get_exif(path)

    original = exif.get('DateTimeOriginal')
    if not original:
        return None

    # Parse the local datetime
    subsec = exif.get('SubsecTimeOriginal', '0').ljust(6, '0')[:6]
    dt_local = datetime.strptime(original, '%Y:%m:%d %H:%M:%S')
    dt_local = dt_local.replace(microsecond=int(subsec))

    # Apply timezone offset if available
    offset_str = exif.get('OffsetTime')
    if offset_str:
        tz = parse_offset(offset_str)
        dt_utc = dt_local.replace(tzinfo=tz).astimezone(timezone.utc)
    else:
        print(f'  ⚠  No OffsetTime tag — assuming UTC (may be wrong!)')
        dt_utc = dt_local.replace(tzinfo=timezone.utc)

    elapsed_seconds = (dt_utc - LAUNCH_UTC).total_seconds()
    elapsed_hours = elapsed_seconds / 3600

    if elapsed_hours < 0:
        print(f'  ⚠  Photo predates launch — skipping')
        return None

    return elapsed_hours, dt_utc.isoformat()


def filename_to_name(fname: str) -> str:
    """Turn a filename into a human-readable default name."""
    stem = os.path.splitext(fname)[0]
    return stem.replace('-', ' ').replace('_', ' ').title()


def main():
    if not os.path.isdir(PHOTOS_DIR):
        print(f'Photos directory not found: {PHOTOS_DIR}')
        return

    photos = [
        f for f in sorted(os.listdir(PHOTOS_DIR))
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
    ]

    if not photos:
        print('No photos found in public/photos/')
        return

    print(f'Launch UTC: {LAUNCH_UTC.isoformat()}')
    print(f'Found {len(photos)} photo(s)\n')

    results = []
    for fname in photos:
        path = os.path.join(PHOTOS_DIR, fname)
        print(f'[photo]  {fname}')
        result = photo_to_met(path)
        if result is None:
            print('  → Skipped\n')
            continue
        elapsed, utc_iso = result
        print(f'  DateTimeOriginal UTC : {utc_iso}')
        print(f'  Mission elapsed      : T+{elapsed:.4f}h  (~T+{elapsed:.2f}h)\n')
        results.append({
            'fname': fname,
            'elapsed': round(elapsed, 4),
            'utc': utc_iso,
        })

    if not results:
        print('No photos with usable EXIF data.')
        return

    # Output ready-to-paste TypeScript
    print('-' * 60)
    print('Paste into MILESTONES in src/data/mission-config.ts:')
    print('-' * 60)
    for r in results:
        name = filename_to_name(r['fname'])
        path = f"/photos/{r['fname']}"
        hours = r['elapsed']
        print(
            f"  {{ name: '{name}', missionElapsedHours: {hours}, "
            f"description: '', photo: '{path}' }},"
        )

    # Also write a JSON summary for scripting use
    out_json = os.path.join(os.path.dirname(__file__), 'photo-manifest.json')
    with open(out_json, 'w') as f:
        json.dump(results, f, indent=2)
    print(f'\nManifest saved -> {out_json}')


if __name__ == '__main__':
    main()
