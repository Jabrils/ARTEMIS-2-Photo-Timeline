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
{ name: '55193049251 43A64Bf74D O', missionElapsedHours: 115.7399, description: '', photo: '/photos/55193049251_43a64bf74d_o.jpg' },
  { name: '55193054686 6Ed51F4F15 O', missionElapsedHours: 120.7884, description: '', photo: '/photos/55193054686_6ed51f4f15_o.jpg' },
  { name: '55193206753 03E267F92B O', missionElapsedHours: 117.1093, description: '', photo: '/photos/55193206753_03e267f92b_o.jpg' },
  { name: '55193337359 950011Bf2D O', missionElapsedHours: 118.9135, description: '', photo: '/photos/55193337359_950011bf2d_o.jpg' },
  { name: '55194789840 D7Cf899D17 O', missionElapsedHours: 134.3808, description: '', photo: '/photos/55194789840_d7cf899d17_o.jpg' },
  { name: '55195413602 C4306Fea38 O', missionElapsedHours: 115.7927, description: '', photo: '/photos/55195413602_c4306fea38_o.jpg' },
  { name: '55197506830 A07D2D54Ba O', missionElapsedHours: 122.0055, description: '', photo: '/photos/55197506830_a07d2d54ba_o.jpg' },
  { name: '55197737178 9B35Dbcb12 O', missionElapsedHours: 119.9758, description: '', photo: '/photos/55197737178_9b35dbcb12_o.jpg' },
  { name: '55199312161 F84Ab3Fd2E O', missionElapsedHours: 116.1087, description: '', photo: '/photos/55199312161_f84ab3fd2e_o.jpg' },
  { name: '55204753657 Ff68Ec545E O', missionElapsedHours: 120.5687, description: '', photo: '/photos/55204753657_ff68ec545e_o.jpg' },
  { name: '55206199989 Da419A08F0 O', missionElapsedHours: 212.0045, description: '', photo: '/photos/55206199989_da419a08f0_o.jpg' },
  { name: 'Recovery Preparations', missionElapsedHours: 144.93, description: 'U.S. Navy MH-60 Seahawks from HSC-23 depart USS John P. Murtha during recovery training in the Pacific Ocean off the coast of California. Photo: NASA/Bill Ingalls', photo: '/photos/NHQ202604070017~orig.jpg' },
  { name: 'Earth Sliver (Day 3)', missionElapsedHours: 48.96, description: 'A sliver of Earth illuminated against the blackness of space, photographed through an Orion spacecraft window on the third day of the mission. Credit: NASA', photo: '/photos/art002e009166~orig.jpg' },
  { name: 'Earth Sliver (Day 3) II', missionElapsedHours: 49.06, description: 'Peering out the window of the Orion spacecraft at a sliver of the Earth illuminated against the blackness of space. Third day of the mission. Credit: NASA', photo: '/photos/art002e009174~orig.jpg' },
  { name: 'Lunar Sphere of Influence', missionElapsedHours: 103.17, description: 'Before going to sleep on flight day 5, the crew photographed the Moon as Orion entered the lunar sphere of influence at 12:37 AM EDT. About an hour later Christina Koch said: "We are now falling to the Moon rather than rising away from Earth." Credit: NASA', photo: '/photos/art002e009210~orig.jpg' },
  { name: 'Lunar Crescent (Return)', missionElapsedHours: 143.03, description: 'The Artemis II crew captures a thin lunar crescent as they travel back to Earth, ~23h after the lunar flyby. OpNav session photographed by Christina Koch. Credit: NASA', photo: '/photos/art002e016354~orig.jpg' },
  { name: '55206394005 D4B2519114 O', missionElapsedHours: 120.0756, description: '', photo: '/photos/55206394005_d4b2519114_o.jpg' },
  { name: '55207787628 774Eb096Db O', missionElapsedHours: 122.095, description: '', photo: '/photos/55207787628_774eb096db_o.jpg' },
  { name: '55207839868 Ece0677074 O', missionElapsedHours: 120.7922, description: '', photo: '/photos/55207839868_ece0677074_o.jpg' },
  { name: '55207935871 Acaeaa8692 O', missionElapsedHours: 118.869, description: '', photo: '/photos/55207935871_acaeaa8692_o.jpg' },
  { name: '55208327975 1D1E5Aa651 O', missionElapsedHours: 120.1128, description: '', photo: '/photos/55208327975_1d1e5aa651_o.jpg' },
  { name: '55224193193 4D929Dc577 O', missionElapsedHours: 25.1578, description: '', photo: '/photos/55224193193_4d929dc577_o.jpg' },
  { name: '55224434240 A7078727Ff O', missionElapsedHours: 22.5048, description: '', photo: '/photos/55224434240_a7078727ff_o.jpg' },
  { name: 'Lunar Flyby', missionElapsedHours: 120.0881, description: '', photo: '/photos/lunar-flyby.jpg' },
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
