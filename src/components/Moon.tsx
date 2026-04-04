import { useState, useMemo, useEffect } from 'react';
import { useTexture, Html } from '@react-three/drei';
import { useMissionStore } from '../store/mission-store';
import { SCALE_FACTOR } from '../data/mission-config';

type Vec3 = { x: number; y: number; z: number };

/** Find the trajectory point with maximum angular rate change (sharpest curve). */
function findMaxCurvatureIndex(data: Vec3[]): number {
  let maxCurvature = 0;
  let idx = Math.floor(data.length / 2);
  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1], curr = data[i], next = data[i + 1];
    const v1x = curr.x - prev.x, v1y = curr.y - prev.y, v1z = curr.z - prev.z;
    const v2x = next.x - curr.x, v2y = next.y - curr.y, v2z = next.z - curr.z;
    const dot = v1x * v2x + v1y * v2y + v1z * v2z;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);
    if (mag1 === 0 || mag2 === 0) continue;
    const curvature = 1 - dot / (mag1 * mag2);
    if (curvature > maxCurvature) { maxCurvature = curvature; idx = i; }
  }
  return idx;
}

/** Circumcenter of triangle ABC in 3D via perpendicular bisector intersection. Returns null if degenerate. */
function circumcenter3D(A: Vec3, B: Vec3, C: Vec3): Vec3 | null {
  const abx = B.x - A.x, aby = B.y - A.y, abz = B.z - A.z;
  const acx = C.x - A.x, acy = C.y - A.y, acz = C.z - A.z;
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  const abMidX = (A.x + B.x) / 2, abMidY = (A.y + B.y) / 2, abMidZ = (A.z + B.z) / 2;
  const acMidX = (A.x + C.x) / 2, acMidY = (A.y + C.y) / 2, acMidZ = (A.z + C.z) / 2;
  const d1x = aby * nz - abz * ny, d1y = abz * nx - abx * nz, d1z = abx * ny - aby * nx;
  const d2x = acy * nz - acz * ny, d2y = acz * nx - acx * nz, d2z = acx * ny - acy * nx;
  const rx = acMidX - abMidX, ry = acMidY - abMidY, rz = acMidZ - abMidZ;
  const d1d1 = d1x * d1x + d1y * d1y + d1z * d1z;
  const d1d2 = d1x * d2x + d1y * d2y + d1z * d2z;
  const d2d2 = d2x * d2x + d2y * d2y + d2z * d2z;
  const denom = d1d1 * d2d2 - d1d2 * d1d2;
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((rx * d1x + ry * d1y + rz * d1z) * d2d2 - (rx * d2x + ry * d2y + rz * d2z) * d1d2) / denom;
  return { x: abMidX + t * d1x, y: abMidY + t * d1y, z: abMidZ + t * d1z };
}

export default function Moon() {
  const texture = useTexture('/textures/moon.jpg');
  const oemData = useMissionStore((s) => s.oemData);
  const [hovered, setHovered] = useState(false);

  const flybyPos = useMemo((): [number, number, number] => {
    if (!oemData || oemData.length === 0) return [38.44, 0, 0];

    const sharpestIdx = findMaxCurvatureIndex(oemData);
    const span = Math.min(50, Math.floor(oemData.length / 10));
    const A = oemData[Math.max(0, sharpestIdx - span)];
    const B = oemData[sharpestIdx];
    const C = oemData[Math.min(oemData.length - 1, sharpestIdx + span)];

    const center = circumcenter3D(A, B, C);
    if (!center) return [B.x / SCALE_FACTOR, B.y / SCALE_FACTOR, B.z / SCALE_FACTOR];
    return [center.x / SCALE_FACTOR, center.y / SCALE_FACTOR, center.z / SCALE_FACTOR];
  }, [oemData]);

  const earthDistKm = Math.sqrt(flybyPos[0] ** 2 + flybyPos[1] ** 2 + flybyPos[2] ** 2) * SCALE_FACTOR;

  useEffect(() => {
    useMissionStore.getState().setMoonPosition({
      x: flybyPos[0], y: flybyPos[1], z: flybyPos[2],
    });
  }, [flybyPos]);

  return (
    <group position={flybyPos}>
      {/* Moon sphere */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial map={texture} emissive="#cccccc" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <Html
        position={[0, 0.9, 0]}
        center
        zIndexRange={[0, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          color: '#aaaaaa',
          fontSize: '10px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          textShadow: '0 0 6px rgba(170,170,170,0.4)',
          whiteSpace: 'nowrap',
        }}>MOON</div>
      </Html>
      {hovered && (
        <Html position={[1.0, 0, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(10,10,30,0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(170,170,170,0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            minWidth: '200px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ fontSize: '12px', color: '#aaaaaa', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Moon
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <InfoRow label="Type" value="Natural Satellite" />
              <InfoRow label="Radius" value="1,737 km" />
              <InfoRow label="Mass" value="7.35 × 10²² kg" />
              <InfoRow label="Gravity" value="1.62 m/s²" />
              <InfoRow label="Orbital Period" value="27.3 days" />
              <InfoRow label="Earth Distance" value={`${Math.round(earthDistKm).toLocaleString()} km`} color="#00d4ff" />
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function InfoRow({ label, value, color = '#ffffff' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '11px', color, fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}
