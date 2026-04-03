import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useMissionStore } from '../store/mission-store';
import { SCALE_FACTOR } from '../data/mission-config';

export default function Trajectory() {
  const oemData = useMissionStore((s) => s.oemData);

  const { pastPoints, futurePoints } = useMemo(() => {
    if (!oemData || oemData.length === 0) {
      return { pastPoints: [] as [number, number, number][], futurePoints: [] as [number, number, number][] };
    }

    const now = Date.now();
    const past: [number, number, number][] = [];
    const future: [number, number, number][] = [];

    for (const v of oemData) {
      const point: [number, number, number] = [
        v.x / SCALE_FACTOR,
        v.y / SCALE_FACTOR,
        v.z / SCALE_FACTOR,
      ];
      if (v.epochMs <= now) {
        past.push(point);
      } else {
        future.push(point);
      }
    }

    // Add current position to both for continuity
    if (past.length > 0 && future.length > 0) {
      future.unshift(past[past.length - 1]);
    }

    return { pastPoints: past, futurePoints: future };
  }, [oemData]);

  return (
    <group>
      {pastPoints.length >= 2 && (
        <Line
          points={pastPoints}
          color="#ff8c00"
          lineWidth={2}
        />
      )}
      {futurePoints.length >= 2 && (
        <Line
          points={futurePoints}
          color="#00d4ff"
          lineWidth={1}
          dashed
          dashSize={0.5}
          gapSize={0.3}
        />
      )}
    </group>
  );
}
