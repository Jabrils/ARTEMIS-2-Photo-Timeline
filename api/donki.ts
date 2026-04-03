import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (_req.method === 'OPTIONS') return res.status(204).end();

  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');

  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

  try {
    const upstream = await fetch(`https://api.nasa.gov/DONKI/FLR?api_key=${apiKey}`);
    if (!upstream.ok) throw new Error(`DONKI upstream ${upstream.status}`);
    const data = await upstream.json();
    res.status(200).json(data);
  } catch {
    res.status(502).json({ error: 'Failed to fetch DONKI data' });
  }
}
