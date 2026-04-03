import type { VercelRequest, VercelResponse } from '@vercel/node';
import { inflateRawSync } from 'zlib';

const FALLBACK_OEM_URL = 'https://www.nasa.gov/wp-content/uploads/2026/03/artemis-ii-oem-2026-04-03-to-ei.zip';

// Module-level cache for discovered OEM URL (survives across requests in warm instances)
let cachedOemUrl: { url: string; expiry: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const OEM_URL_BASE = 'https://www.nasa.gov/wp-content/uploads/2026/03/artemis-ii-oem-';
const OEM_URL_SUFFIX = '-to-ei.zip';

async function discoverLatestOemUrl(): Promise<string> {
  // Return cached URL if still valid
  if (cachedOemUrl && Date.now() < cachedOemUrl.expiry) {
    return cachedOemUrl.url;
  }

  // Probe recent dates (today back 7 days) with HEAD requests
  const now = new Date();
  for (let daysBack = 0; daysBack < 7; daysBack++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - daysBack);
    const dateStr = d.toISOString().slice(0, 10);
    const url = `${OEM_URL_BASE}${dateStr}${OEM_URL_SUFFIX}`;
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      if (resp.ok) {
        cachedOemUrl = { url, expiry: Date.now() + CACHE_TTL };
        return url;
      }
    } catch {
      // Probe failed, try next date
    }
  }

  // All probes failed — fall back to hardcoded URL
  cachedOemUrl = { url: FALLBACK_OEM_URL, expiry: Date.now() + CACHE_TTL };
  return FALLBACK_OEM_URL;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (_req.method === 'OPTIONS') return res.status(204).end();

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    const oemUrl = await discoverLatestOemUrl();
    const upstream = await fetch(oemUrl);
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);

    const arrayBuffer = await upstream.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const text = extractFirstFileFromZip(bytes);
    if (text === null) {
      throw new Error('ZIP extraction failed: unsupported archive format');
    }
    if (!text.includes('META_START') && !text.includes('CCSDS_OEM_VERS')) {
      throw new Error('ZIP extracted but content is not valid OEM data');
    }

    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(text);
  } catch (err) {
    console.error('OEM fetch failed:', err);
    res.status(502).json({ error: 'Failed to fetch OEM data. Use /fallback-oem.asc' });
  }
}

function extractFirstFileFromZip(bytes: Uint8Array): string | null {
  // Check ZIP magic number
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4B || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    return null;
  }

  const flags = bytes[6] | (bytes[7] << 8);
  const compressionMethod = bytes[8] | (bytes[9] << 8);
  let compressedSize = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
  const filenameLen = bytes[26] | (bytes[27] << 8);
  const extraLen = bytes[28] | (bytes[29] << 8);
  const dataOffset = 30 + filenameLen + extraLen;

  // Data descriptor flag (bit 3): sizes in local header are 0,
  // read from central directory instead
  if (compressedSize === 0 && (flags & 0x08)) {
    compressedSize = readSizeFromCentralDirectory(bytes);
    if (compressedSize <= 0) return null;
  }

  if (compressionMethod === 0) {
    // Stored (no compression)
    return new TextDecoder().decode(bytes.slice(dataOffset, dataOffset + compressedSize));
  } else if (compressionMethod === 8) {
    // Deflate
    try {
      const decompressed = inflateRawSync(Buffer.from(bytes.slice(dataOffset, dataOffset + compressedSize)));
      return decompressed.toString('utf-8');
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Read compressedSize from the central directory when local header uses data descriptors.
 * Finds the End of Central Directory record, then reads the first central directory entry.
 */
function readSizeFromCentralDirectory(bytes: Uint8Array): number {
  // Find End of Central Directory (scan backward for PK\x05\x06)
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4B && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
      const cdOffset = bytes[i + 16] | (bytes[i + 17] << 8) | (bytes[i + 18] << 16) | (bytes[i + 19] << 24);
      // Verify central directory entry signature PK\x01\x02
      if (bytes[cdOffset] === 0x50 && bytes[cdOffset + 1] === 0x4B &&
          bytes[cdOffset + 2] === 0x01 && bytes[cdOffset + 3] === 0x02) {
        return bytes[cdOffset + 20] | (bytes[cdOffset + 21] << 8) |
               (bytes[cdOffset + 22] << 16) | (bytes[cdOffset + 23] << 24);
      }
    }
  }
  return -1;
}
