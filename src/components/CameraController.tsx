import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../store/mission-store';
import { SCALE_FACTOR } from '../data/mission-config';
import type { StateVector } from '../data/oem-parser';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// Cached orbital plane normal — computed once from trajectory data
let cachedPlaneNormal: THREE.Vector3 | null = null;

function getOrbitalPlaneNormal(oemData: StateVector[]): THREE.Vector3 {
  if (cachedPlaneNormal) return cachedPlaneNormal;

  const i0 = 0;
  const i1 = Math.floor(oemData.length * 0.25);
  const i2 = Math.floor(oemData.length * 0.5);

  const v1 = new THREE.Vector3(
    oemData[i1].x - oemData[i0].x,
    oemData[i1].y - oemData[i0].y,
    oemData[i1].z - oemData[i0].z,
  ).normalize();
  const v2 = new THREE.Vector3(
    oemData[i2].x - oemData[i0].x,
    oemData[i2].y - oemData[i0].y,
    oemData[i2].z - oemData[i0].z,
  ).normalize();

  const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
  if (normal.y < 0) normal.negate();

  cachedPlaneNormal = normal;
  return normal;
}

/**
 * Compute camera position looking down at the trajectory's orbital plane.
 * Uses the cached orbital plane normal for a true top-down plan view.
 */
function computePlanView(oemData: StateVector[], isMobile: boolean) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const v of oemData) {
    const sx = v.x / SCALE_FACTOR, sy = v.y / SCALE_FACTOR, sz = v.z / SCALE_FACTOR;
    if (sx < minX) minX = sx; if (sx > maxX) maxX = sx;
    if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
    if (sz < minZ) minZ = sz; if (sz > maxZ) maxZ = sz;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const range = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const dist = range * (isMobile ? 1.8 : 1.4);

  const normal = getOrbitalPlaneNormal(oemData);

  return {
    camPos: new THREE.Vector3(
      cx + normal.x * dist,
      cy + normal.y * dist,
      cz + normal.z * dist,
    ),
    target: new THREE.Vector3(cx, cy, cz),
  };
}

export default function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const cameraMode = useMissionStore((s) => s.cameraMode);
  const setCameraMode = useMissionStore((s) => s.setCameraMode);
  const isMobile = useIsMobile();
  const hasAutoFit = useRef(false);

  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  const onControlStart = useCallback(() => {
    if (cameraMode !== 'free') {
      setCameraMode('free');
    }
  }, [cameraMode, setCameraMode]);

  const applyPlanView = useCallback((oemData: StateVector[]) => {
    const { camPos, target } = computePlanView(oemData, isMobile);
    camera.position.copy(camPos);
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
    }
  }, [camera, isMobile]);

  // Auto-fit on first load
  useEffect(() => {
    if (hasAutoFit.current) return;
    const oemData = useMissionStore.getState().oemData;
    if (!oemData || oemData.length === 0) return;
    hasAutoFit.current = true;
    applyPlanView(oemData);
  }, [applyPlanView]);

  useEffect(() => {
    const unsub = useMissionStore.subscribe((state) => {
      if (hasAutoFit.current || !state.oemData || state.oemData.length === 0) return;
      hasAutoFit.current = true;
      applyPlanView(state.oemData);
    });
    return unsub;
  }, [applyPlanView]);

  // Camera presets — each mode uses a purpose-built strategy
  useEffect(() => {
    if (cameraMode === 'free') return;

    const oemData = useMissionStore.getState().oemData;
    const sc = useMissionStore.getState().spacecraft;
    const orionPos = new THREE.Vector3(
      sc.x / SCALE_FACTOR,
      sc.y / SCALE_FACTOR,
      sc.z / SCALE_FACTOR,
    );

    switch (cameraMode) {
      case 'follow-orion': {
        // Velocity-aligned chase cam — trail behind spacecraft, look ahead
        const vel = new THREE.Vector3(sc.vx, sc.vy, sc.vz);
        const speed = vel.length();
        const dir = speed > 0.01 ? vel.normalize() : orionPos.clone().normalize();
        const normal = oemData?.length ? getOrbitalPlaneNormal(oemData) : new THREE.Vector3(0, 1, 0);
        const trail = isMobile ? 30 : 25;
        const elev = isMobile ? 10 : 8;
        targetPos.current.copy(orionPos)
          .addScaledVector(dir, -trail)
          .addScaledVector(normal, elev);
        targetLookAt.current.copy(orionPos)
          .addScaledVector(dir, 5);
        break;
      }

      case 'earth-view': {
        // Near Earth, looking outward at the departing spacecraft
        const elev = isMobile ? 4 : 3;
        const back = isMobile ? 6 : 5;
        targetPos.current.set(0, elev, back);
        targetLookAt.current.copy(orionPos);
        break;
      }

      case 'moon-view': {
        // Above Moon along orbital plane normal — shows flyby loop
        if (oemData && oemData.length > 0) {
          let maxDist = 0;
          let flyby = oemData[0];
          for (const v of oemData) {
            const d = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
            if (d > maxDist) { maxDist = d; flyby = v; }
          }
          const dir = new THREE.Vector3(flyby.x, flyby.y, flyby.z).normalize();
          const moonPos = new THREE.Vector3(
            (flyby.x - dir.x * 10637) / SCALE_FACTOR,
            (flyby.y - dir.y * 10637) / SCALE_FACTOR,
            (flyby.z - dir.z * 10637) / SCALE_FACTOR,
          );
          const normal = getOrbitalPlaneNormal(oemData);
          const dist = isMobile ? 18 : 15;
          targetPos.current.copy(moonPos).addScaledVector(normal, dist);
          targetLookAt.current.copy(moonPos);
        }
        break;
      }

    }
  }, [cameraMode, isMobile]);

  useFrame(() => {
    if (cameraMode === 'free') return;

    // Follow Orion: update chase cam every frame to track moving spacecraft
    if (cameraMode === 'follow-orion') {
      const sc = useMissionStore.getState().spacecraft;
      const oemData = useMissionStore.getState().oemData;
      const orionPos = new THREE.Vector3(sc.x / SCALE_FACTOR, sc.y / SCALE_FACTOR, sc.z / SCALE_FACTOR);
      const vel = new THREE.Vector3(sc.vx, sc.vy, sc.vz);
      const speed = vel.length();
      const dir = speed > 0.01 ? vel.normalize() : orionPos.clone().normalize();
      const normal = oemData?.length ? getOrbitalPlaneNormal(oemData) : new THREE.Vector3(0, 1, 0);
      const trail = isMobile ? 30 : 25;
      const elev = isMobile ? 10 : 8;
      targetPos.current.copy(orionPos).addScaledVector(dir, -trail).addScaledVector(normal, elev);
      targetLookAt.current.copy(orionPos).addScaledVector(dir, 5);
    }

    // Earth View: track spacecraft as it moves away from Earth
    if (cameraMode === 'earth-view') {
      const sc = useMissionStore.getState().spacecraft;
      targetLookAt.current.set(sc.x / SCALE_FACTOR, sc.y / SCALE_FACTOR, sc.z / SCALE_FACTOR);
    }

    camera.position.lerp(targetPos.current, 0.03);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.03);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={300}
      touches={{
        ONE: isMobile ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_ROTATE,
      }}
      rotateSpeed={isMobile ? 0.5 : 1}
      panSpeed={isMobile ? 0.5 : 1}
      onStart={onControlStart}
    />
  );
}
