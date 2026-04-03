import type { VercelRequest, VercelResponse } from '@vercel/node';

const OEM_ZIP_URL = 'https://www.nasa.gov/wp-content/uploads/2026/03/artemis-ii-oem-2026-04-02-to-ei-v3.zip';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (_req.method === 'OPTIONS') return res.status(204).end();

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    // Fetch the ZIP file from NASA
    const upstream = await fetch(OEM_ZIP_URL);
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);

    const arrayBuffer = await upstream.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Simple ZIP extraction — find the file data after the local file header
    // ZIP local file header: PK\x03\x04, then at offset 26: filename length (2 bytes),
    // offset 28: extra field length (2 bytes), then filename, then extra, then file data
    const text = extractFirstFileFromZip(bytes);
    if (!text || (!text.includes('META_START') && !text.includes('CCSDS_OEM_VERS'))) {
      throw new Error('Invalid OEM data in ZIP');
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

  const compressionMethod = bytes[8] | (bytes[9] << 8);
  const compressedSize = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
  const filenameLen = bytes[26] | (bytes[27] << 8);
  const extraLen = bytes[28] | (bytes[29] << 8);
  const dataOffset = 30 + filenameLen + extraLen;

  if (compressionMethod === 0) {
    // Stored (no compression)
    const fileData = bytes.slice(dataOffset, dataOffset + compressedSize);
    return new TextDecoder().decode(fileData);
  } else if (compressionMethod === 8) {
    // Deflate — use DecompressionStream (available in Node 18+)
    try {
      const compressed = bytes.slice(dataOffset, dataOffset + compressedSize);
      // For serverless, use raw deflate decompression
      const { inflateRawSync } = require('zlib');
      const decompressed = inflateRawSync(Buffer.from(compressed));
      return decompressed.toString('utf-8');
    } catch {
      return null;
    }
  }

  return null;
}
