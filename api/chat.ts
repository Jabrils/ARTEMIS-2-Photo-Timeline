import type { VercelRequest, VercelResponse } from '@vercel/node';

const LAUNCH_EPOCH_MS = Date.UTC(2026, 3, 1, 22, 35, 0); // April 1, 2026 22:35 UTC

const MISSION_FACTS = `You are ARTEMIS AI, an expert assistant for the Artemis II mission tracker.

MISSION FACTS:
- Launch: April 1, 2026, 6:35 PM EDT (22:35 UTC) from LC-39B, Kennedy Space Center, Florida
- Duration: Approximately 10 days (return around April 10-11, 2026)
- Crew: Reid Wiseman (Commander, NASA), Victor Glover (Pilot, NASA), Christina Koch (Mission Specialist, NASA), Jeremy Hansen (Mission Specialist, CSA - Canadian Space Agency)
- Vehicle: Orion spacecraft atop Space Launch System (SLS) Block 1 rocket
- Objective: First crewed Artemis mission. Test Orion's life support, navigation, and heat shield systems with humans aboard. Lunar flyby without landing.
- Trajectory: Launch -> Earth orbit -> Translunar Injection (TLI) -> Outbound coast (~4 days) -> Lunar flyby approximately 8,900 km (5,500 miles) above the far side of the Moon -> Free return trajectory -> Earth re-entry -> Pacific Ocean splashdown
- Record: Expected to surpass Apollo 13's record of 400,171 km (248,655 miles) for farthest humans from Earth
- Orion: Built by Lockheed Martin. Crew module can support 4 astronauts for up to 21 days. Features the largest heat shield ever built (5 meters diameter).
- European Service Module (ESM): Built by ESA (European Space Agency) and Airbus. Provides propulsion, power (4 solar arrays), thermal control, water, and air.
- SLS: Most powerful rocket ever flown. 98 meters (322 feet) tall. Produces 39.1 meganewtons (8.8 million pounds) of thrust at liftoff.
- Deep Space Network (DSN): Three ground stations (Goldstone CA, Canberra Australia, Madrid Spain) maintain communication with Orion throughout the mission.
- Previous mission: Artemis I was an uncrewed test flight in November 2022 that successfully orbited the Moon over 25.5 days.
- Future missions: Artemis III (planned ~2027-2028) will land astronauts on the lunar south pole, the first Moon landing since Apollo 17 in 1972.

RULES:
- Answer ONLY from the facts above, the current date/time context below, and general publicly known space knowledge
- If you don't know something, say "I don't have that specific information about the Artemis II mission"
- Keep answers concise (2-4 sentences for simple questions, more for complex ones)
- Be enthusiastic about space exploration
- Never speculate about mission anomalies, safety incidents, or crew health
- If asked about real-time telemetry data, direct users to the tracker dashboard
- ALWAYS use the current date/time context below to determine mission status — the mission HAS launched`;

function buildSystemPrompt(userTimezone?: string): string {
  const now = new Date();
  const utcStr = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // Compute MET
  const metMs = now.getTime() - LAUNCH_EPOCH_MS;
  const metDays = Math.floor(metMs / 86400000);
  const metHours = Math.floor((metMs % 86400000) / 3600000);
  const metMinutes = Math.floor((metMs % 3600000) / 60000);
  const metStr = `M+ ${String(metDays).padStart(2, '0')}:${String(metHours).padStart(2, '0')}:${String(metMinutes).padStart(2, '0')}`;

  // Determine mission phase based on MET
  let phase = 'Pre-launch';
  const metHoursTotal = metMs / 3600000;
  if (metHoursTotal < 0) phase = 'Pre-launch';
  else if (metHoursTotal < 5) phase = 'Earth Orbit / TLI';
  else if (metHoursTotal < 96) phase = 'Outbound Coast (heading toward the Moon)';
  else if (metHoursTotal < 130) phase = 'Lunar Flyby';
  else if (metHoursTotal < 220) phase = 'Return Coast (heading back to Earth)';
  else if (metHoursTotal < 240) phase = 'Entry / Splashdown';
  else phase = 'Mission Complete';

  // User timezone display
  let tzLine = '';
  if (userTimezone) {
    try {
      const localStr = now.toLocaleString('en-US', { timeZone: userTimezone, dateStyle: 'full', timeStyle: 'long' });
      tzLine = `\n- User's local time (${userTimezone}): ${localStr}`;
    } catch {
      // Invalid timezone, skip
    }
  }

  return `${MISSION_FACTS}

CURRENT DATE/TIME CONTEXT (use this to answer time-sensitive questions):
- Current UTC: ${utcStr}
- Mission Elapsed Time: ${metStr}
- Current mission phase: ${phase}${tzLine}
- The mission launched successfully on April 1, 2026. The crew is currently in space.`;
}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { messages, userTimezone } = req.body as {
    messages: Array<{ role: string; text: string }>;
    userTimezone?: string;
  };
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const geminiBody = {
    system_instruction: {
      parts: [{ text: buildSystemPrompt(userTimezone) }],
    },
    contents: messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
      topP: 0.9,
    },
  };

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'I could not generate a response. Please try again.';
    res.status(200).json({ text });
  } catch {
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
}
