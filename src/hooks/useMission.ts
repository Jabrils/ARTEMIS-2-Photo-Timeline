import { useMemo } from 'react';
import { useMissionStore } from '../store/mission-store';
import { getMissionElapsed } from '../data/mission-config';

export function useMission() {
  const simEpochMs  = useMissionStore((s) => s.timeControl.simEpochMs);
  const milestones  = useMissionStore((s) => s.milestones);

  return useMemo(() => {
    const base = getMissionElapsed(new Date(simEpochMs));
    const elapsedHours = base.totalMs / 3_600_000;
    let currentPhase = 'Artemis II';
    for (const m of milestones) {
      if (elapsedHours >= m.missionElapsedHours) currentPhase = m.name;
    }
    return { ...base, currentPhase };
  }, [simEpochMs, milestones]);
}
