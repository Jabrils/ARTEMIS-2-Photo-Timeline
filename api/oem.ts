import type { VercelRequest, VercelResponse } from '@vercel/node';

const OEM_URLS = [
  'https://nasa.gov/wp-content/uploads/2026/04/Artemis_II_OEM_latest.asc',
  'https://www.nasa.gov/wp-content/uploads/2026/04/Artemis_II_OEM_2026_04_02_to_EI_v3.asc',
];

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (_req.method === 'OPTIONS') return res.status(204).end();

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  for (const url of OEM_URLS) {
    try {
      const upstream = await fetch(url);
      if (upstream.ok) {
        const text = await upstream.text();
        if (text.includes('META_START') || text.includes('CCSDS_OEM_VERS')) {
          res.setHeader('Content-Type', 'text/plain');
          return res.status(200).send(text);
        }
      }
    } catch {
      continue;
    }
  }

  res.status(502).json({ error: 'Failed to fetch OEM data from any source' });
}
