import { useFrame } from '@react-three/fiber';
import { useMissionStore } from '../store/mission-store';
import { lagrangeInterpolate } from '../data/interpolator';
import { SCALE_FACTOR } from '../data/mission-config';

/**
 * Invisible component that runs inside Canvas to drive spacecraft state.
 * Uses useFrame to interpolate position every render frame.
 */
export default function DataDriver() {
  useFrame(() => {
    const store = useMissionStore.getState();
    if (!store.oemData || store.oemData.length === 0) return;

    const now = new Date();
    const interpolated = lagrangeInterpolate(store.oemData, now);
    if (!interpolated) return;

    const speed = Math.sqrt(
      interpolated.vx ** 2 + interpolated.vy ** 2 + interpolated.vz ** 2
    ) * 3600; // km/s -> km/h

    const earthDist = Math.sqrt(
      interpolated.x ** 2 + interpolated.y ** 2 + interpolated.z ** 2
    );

    let moonDist: number | null = null;
    if (store.moonPosition) {
      const dx = interpolated.x - store.moonPosition.x;
      const dy = interpolated.y - store.moonPosition.y;
      const dz = interpolated.z - store.moonPosition.z;
      moonDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    store.setSpacecraft({
      x: interpolated.x,
      y: interpolated.y,
      z: interpolated.z,
      vx: interpolated.vx,
      vy: interpolated.vy,
      vz: interpolated.vz,
      speed,
      earthDist,
      moonDist,
    });
  });

  return null;
}
