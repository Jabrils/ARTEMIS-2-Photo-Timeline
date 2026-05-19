import { useEffect } from 'react';
import { useMissionStore } from '../store/mission-store';
import type { Milestone } from '../data/mission-config';

export function usePhotosInit() {
  const setMilestones = useMissionStore((s) => s.setMilestones);

  useEffect(() => {
    fetch('/photos.json')
      .then((r) => r.json())
      .then((data: Milestone[]) => {
        const sorted = [...data].sort((a, b) => a.missionElapsedHours - b.missionElapsedHours);
        setMilestones(sorted);
      })
      .catch((err) => console.warn('photos.json not found — run npm run fetch-photos', err));
  }, [setMilestones]);
}
