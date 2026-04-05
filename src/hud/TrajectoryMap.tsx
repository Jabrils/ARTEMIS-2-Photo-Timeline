import { useMemo } from 'react';
import { useMissionStore } from '../store/mission-store';
import { SCALE_FACTOR, LAUNCH_EPOCH } from '../data/mission-config';

const DOWNSAMPLE = 16;
const SVG_W = 180;
const SVG_H = 140;
const PAD = 12;

type Vec3 = { x: number; y: number; z: number };

/** Compute two orthogonal in-plane axes from the orbital plane normal. */
function computePlaneBasis(data: Vec3[]) {
  const i0 = 0;
  const i1 = Math.floor(data.length * 0.25);
  const i2 = Math.floor(data.length * 0.5);

  const v1x = data[i1].x - data[i0].x, v1y = data[i1].y - data[i0].y, v1z = data[i1].z - data[i0].z;
  const v2x = data[i2].x - data[i0].x, v2y = data[i2].y - data[i0].y, v2z = data[i2].z - data[i0].z;

  let nx = v1y * v2z - v1z * v2y;
  let ny = v1z * v2x - v1x * v2z;
  let nz = v1x * v2y - v1y * v2x;
  const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
  nx /= nLen; ny /= nLen; nz /= nLen;
  if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }

  // U = normalize(N × [0,1,0])
  let ux = nz, uz = -nx;
  const uLen = Math.sqrt(ux * ux + uz * uz);
  if (uLen < 1e-6) { ux = 1; uz = 0; } else { ux /= uLen; uz /= uLen; }

  // V = N × U
  const vx = ny * uz - nz * 0;
  const vy = nz * ux - nx * uz;
  const vz = nx * 0 - ny * ux;

  return { ux, uz, vx, vy, vz };
}

function proj(p: Vec3, b: ReturnType<typeof computePlaneBasis>): [number, number] {
  return [p.x * b.ux + p.z * b.uz, p.x * b.vx + p.y * b.vy + p.z * b.vz];
}

export default function TrajectoryMap() {
  const oemData = useMissionStore((s) => s.oemData);
  const spacecraft = useMissionStore((s) => s.spacecraft);
  const moonPosition = useMissionStore((s) => s.moonPosition);

  const mapData = useMemo(() => {
    if (!oemData || oemData.length < 10) return null;

    const basis = computePlaneBasis(oemData);

    // Downsample + project
    const pts: { u: number; v: number; epochMs: number }[] = [];
    for (let i = 0; i < oemData.length; i += DOWNSAMPLE) {
      const p = oemData[i];
      const [u, v] = proj(p, basis);
      pts.push({ u, v, epochMs: p.epochMs });
    }
    // Always include last point
    if ((oemData.length - 1) % DOWNSAMPLE !== 0) {
      const last = oemData[oemData.length - 1];
      const [u, v] = proj(last, basis);
      pts.push({ u, v, epochMs: last.epochMs });
    }

    // Compute bounds
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const p of pts) {
      if (p.u < minU) minU = p.u;
      if (p.u > maxU) maxU = p.u;
      if (p.v < minV) minV = p.v;
      if (p.v > maxV) maxV = p.v;
    }
    const rangeU = maxU - minU || 1;
    const rangeV = maxV - minV || 1;

    // Scale to fit SVG with padding, preserving aspect ratio
    const usable_w = SVG_W - PAD * 2;
    const usable_h = SVG_H - PAD * 2;
    const scale = Math.min(usable_w / rangeU, usable_h / rangeV);
    const offU = PAD + (usable_w - rangeU * scale) / 2;
    const offV = PAD + (usable_h - rangeV * scale) / 2;

    const toSvg = (u: number, v: number): [number, number] => [
      offU + (u - minU) * scale,
      offV + (v - minV) * scale,
    ];

    const svgPts = pts.map((p) => ({ ...p, svg: toSvg(p.u, p.v) }));

    // Earth at origin
    const [eu, ev] = proj({ x: 0, y: 0, z: 0 }, basis);
    const earthSvg = toSvg(eu, ev);

    // Moon
    let moonSvg: [number, number] | null = null;
    if (moonPosition) {
      const [mu, mv] = proj(
        { x: moonPosition.x * SCALE_FACTOR, y: moonPosition.y * SCALE_FACTOR, z: moonPosition.z * SCALE_FACTOR },
        basis
      );
      moonSvg = toSvg(mu, mv);
    }

    return { svgPts, earthSvg, moonSvg, basis, toSvg, minU, minV, scale: scale, offU, offV };
  }, [oemData, moonPosition]);

  if (!mapData) return null;

  const now = Date.now();
  const { svgPts, earthSvg, moonSvg, basis, toSvg } = mapData;

  // Split past / future
  let splitIdx = svgPts.length - 1;
  for (let i = 0; i < svgPts.length; i++) {
    if (svgPts[i].epochMs > now) { splitIdx = i; break; }
  }
  const pastStr = svgPts.slice(0, splitIdx + 1).map((p) => `${p.svg[0]},${p.svg[1]}`).join(' ');
  const futureStr = svgPts.slice(splitIdx).map((p) => `${p.svg[0]},${p.svg[1]}`).join(' ');

  // Orion position
  let orionSvg: [number, number] | null = null;
  if (spacecraft.x !== 0 || spacecraft.y !== 0 || spacecraft.z !== 0) {
    const [ou, ov] = proj({ x: spacecraft.x, y: spacecraft.y, z: spacecraft.z }, basis);
    orionSvg = toSvg(ou, ov);
  }

  return (
    <div className="bg-[rgba(10,10,30,0.7)] backdrop-blur-sm border border-[rgba(0,212,255,0.2)] rounded-lg p-1">
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
        {/* Past trajectory */}
        {pastStr && (
          <polyline
            points={pastStr}
            fill="none"
            stroke="#ff8c00"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Future trajectory */}
        {futureStr && (
          <polyline
            points={futureStr}
            fill="none"
            stroke="#00d4ff"
            strokeWidth="1"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Earth */}
        <circle cx={earthSvg[0]} cy={earthSvg[1]} r={3} fill="#4488dd" />
        {/* Moon */}
        {moonSvg && <circle cx={moonSvg[0]} cy={moonSvg[1]} r={2} fill="#aaaaaa" />}
        {/* Orion */}
        {orionSvg && (
          <>
            <circle cx={orionSvg[0]} cy={orionSvg[1]} r={4} fill="rgba(0,255,136,0.2)" />
            <circle cx={orionSvg[0]} cy={orionSvg[1]} r={2} fill="#00ff88" />
          </>
        )}
      </svg>
    </div>
  );
}
