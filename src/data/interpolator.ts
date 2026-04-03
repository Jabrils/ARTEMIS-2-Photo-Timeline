import type { StateVector } from './oem-parser';

/**
 * Lagrange polynomial interpolation for spacecraft state vectors.
 * Uses degree-8 interpolation (9 points) as specified by OEM metadata.
 */
export function lagrangeInterpolate(
  vectors: StateVector[],
  targetEpoch: Date,
  degree: number = 8,
): { x: number; y: number; z: number; vx: number; vy: number; vz: number } | null {
  if (vectors.length === 0) return null;

  const t = targetEpoch.getTime();

  // Clamp to data range
  const firstEpoch = vectors[0].epochMs;
  const lastEpoch = vectors[vectors.length - 1].epochMs;
  if (t < firstEpoch || t > lastEpoch) {
    // Return nearest endpoint if outside range
    const nearest = t < firstEpoch ? vectors[0] : vectors[vectors.length - 1];
    return { x: nearest.x, y: nearest.y, z: nearest.z, vx: nearest.vx, vy: nearest.vy, vz: nearest.vz };
  }

  // Find the closest data point
  let closestIdx = 0;
  let minDist = Math.abs(vectors[0].epochMs - t);
  for (let i = 1; i < vectors.length; i++) {
    const dist = Math.abs(vectors[i].epochMs - t);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  // Select window of (degree+1) points centered on closest
  const numPoints = Math.min(degree + 1, vectors.length);
  let startIdx = closestIdx - Math.floor(numPoints / 2);
  startIdx = Math.max(0, Math.min(startIdx, vectors.length - numPoints));
  const window = vectors.slice(startIdx, startIdx + numPoints);

  // Interpolate each component
  const components: Array<'x' | 'y' | 'z' | 'vx' | 'vy' | 'vz'> = ['x', 'y', 'z', 'vx', 'vy', 'vz'];
  const result = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };

  for (const comp of components) {
    result[comp] = lagrangeBasis(
      window.map(v => v.epochMs),
      window.map(v => v[comp]),
      t,
    );
  }

  return result;
}

/**
 * Evaluate the Lagrange interpolating polynomial at point t.
 * L(t) = sum(i=0..n) yi * product(j=0..n, j!=i) (t - tj) / (ti - tj)
 */
function lagrangeBasis(times: number[], values: number[], t: number): number {
  const n = times.length;
  let result = 0;

  for (let i = 0; i < n; i++) {
    let basis = 1;
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        basis *= (t - times[j]) / (times[i] - times[j]);
      }
    }
    result += values[i] * basis;
  }

  return result;
}
