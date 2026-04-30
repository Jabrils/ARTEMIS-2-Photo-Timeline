export const LAUNCH_EPOCH = new Date('2026-04-01T22:35:00Z');
export const MISSION_DURATION_DAYS = 217.53 / 24; // 9.064 days — NASA actual splashdown T+217.53h
export const MISSION_DURATION_HOURS = MISSION_DURATION_DAYS * 24; // 217.53h
export const MISSION_END_EPOCH = new Date(LAUNCH_EPOCH.getTime() + MISSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

export const SCALE_FACTOR = 10_000; // 1 Three.js unit = 10,000 km

export interface CrewMember {
  name: string;
  role: string;
  agency: string;
}

export const CREW: CrewMember[] = [
  { name: 'Reid Wiseman', role: 'Commander', agency: 'NASA' },
  { name: 'Victor Glover', role: 'Pilot', agency: 'NASA' },
  { name: 'Christina Koch', role: 'Mission Specialist', agency: 'NASA' },
  { name: 'Jeremy Hansen', role: 'Mission Specialist', agency: 'CSA' },
];

export interface Milestone {
  name: string;
  missionElapsedHours: number;
  description: string;
  photo?: string; // path relative to /public
}

export const MILESTONES: Milestone[] = [
  { name: 'Capturing the Details of the Moon and the Beauty of Earth', missionElapsedHours: 120.45, description: 'Closest approach — 6,543 km (4,066 mi) above lunar far side', photo: '/photos/lunar-flyby.jpg' },
];

export function getMissionElapsed(now: Date = new Date()): {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  progress: number;
  currentPhase: string;
} {
  const totalMs = now.getTime() - LAUNCH_EPOCH.getTime();
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number, d = 2) => String(n).padStart(d, '0');
  const formatted = `M+ ${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const totalDurationMs = MISSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const progress = Math.min(100, Math.max(0, (totalMs / totalDurationMs) * 100));

  const elapsedHours = totalMs / (1000 * 60 * 60);
  let currentPhase = MILESTONES[0].name;
  for (const m of MILESTONES) {
    if (elapsedHours >= m.missionElapsedHours) {
      currentPhase = m.name;
    }
  }

  return { totalMs, days, hours, minutes, seconds, formatted, progress, currentPhase };
}
