export const LAUNCH_EPOCH = new Date('2026-04-01T22:35:00Z');
export const MISSION_DURATION_DAYS = 10;
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
}

export const MILESTONES: Milestone[] = [
  { name: 'Launch', missionElapsedHours: 0, description: 'SLS lifts off from LC-39B, Kennedy Space Center' },
  { name: 'Orbital Insertion', missionElapsedHours: 0.15, description: 'Orion enters initial Earth orbit' },
  { name: 'Translunar Injection', missionElapsedHours: 2, description: 'Upper stage fires for Moon trajectory' },
  { name: 'Service Module Separation', missionElapsedHours: 2.5, description: 'ICPS separates from Orion' },
  { name: 'Outbound Coast', missionElapsedHours: 24, description: 'Cruising toward the Moon' },
  { name: 'Lunar Flyby', missionElapsedHours: 96, description: 'Closest approach ~8,900 km above far side' },
  { name: 'Return Coast', missionElapsedHours: 144, description: 'Free return trajectory back to Earth' },
  { name: 'Entry Interface', missionElapsedHours: 228, description: 'Orion re-enters Earth atmosphere' },
  { name: 'Splashdown', missionElapsedHours: 240, description: 'Pacific Ocean recovery' },
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
