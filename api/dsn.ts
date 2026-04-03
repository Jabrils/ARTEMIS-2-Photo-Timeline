import type { VercelRequest, VercelResponse } from '@vercel/node';

const DSN_URL = 'https://eyes.nasa.gov/apps/dsn-now/dsn.xml';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (_req.method === 'OPTIONS') return res.status(204).end();

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=10');

  try {
    const upstream = await fetch(DSN_URL);
    if (!upstream.ok) throw new Error(`DSN upstream ${upstream.status}`);
    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(text);
  } catch {
    res.status(502).json({ error: 'Failed to fetch DSN data' });
  }
}
