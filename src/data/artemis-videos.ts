/**
 * Curated YouTube video lookup for Artemis II mission content.
 * Video IDs map to official NASA YouTube content.
 * Update these IDs with actual Artemis II flight footage as it's published.
 */
export const ARTEMIS_VIDEOS: Array<{ keywords: string[]; videoId: string; title: string }> = [
  { keywords: ['launch', 'liftoff', 'takeoff', 'sls'], videoId: 'nB1PWhXmqFk', title: 'Artemis II Launch from Kennedy Space Center' },
  { keywords: ['tli', 'translunar', 'injection', 'burn', 'engine'], videoId: 'nB1PWhXmqFk', title: 'Translunar Injection Burn' },
  { keywords: ['crew', 'astronaut', 'wiseman', 'glover', 'koch', 'hansen'], videoId: 'dOxDfn2re0o', title: 'Meet the Artemis II Crew' },
  { keywords: ['moon', 'lunar', 'flyby'], videoId: 'nB1PWhXmqFk', title: 'Artemis II Lunar Flyby' },
  { keywords: ['orion', 'spacecraft', 'capsule'], videoId: 'dOxDfn2re0o', title: 'Inside the Orion Spacecraft' },
  { keywords: ['trajectory', 'path', 'route', 'orbit'], videoId: 'dOxDfn2re0o', title: 'Artemis II Mission Trajectory Explained' },
  { keywords: ['splashdown', 'return', 'reentry', 're-entry', 'landing'], videoId: 'nB1PWhXmqFk', title: 'Artemis II Splashdown and Recovery' },
  { keywords: ['heat shield', 'thermal'], videoId: 'dOxDfn2re0o', title: "Orion's Heat Shield Technology" },
  { keywords: ['dsn', 'deep space network', 'communication', 'antenna'], videoId: 'dOxDfn2re0o', title: 'Deep Space Network: Tracking Artemis II' },
  { keywords: ['artemis', 'program', 'overview', 'mission'], videoId: 'nB1PWhXmqFk', title: 'NASA Artemis II Mission Overview' },
];

export function findVideo(query: string): { videoId: string; title: string } | null {
  const lower = query.toLowerCase();
  for (const v of ARTEMIS_VIDEOS) {
    if (v.keywords.some((k) => lower.includes(k))) return { videoId: v.videoId, title: v.title };
  }
  return null;
}
