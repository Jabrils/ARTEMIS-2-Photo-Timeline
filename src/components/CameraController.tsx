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

// Cached bounding box for the trajectory — shared across all presets
let cachedBBox: {
  center: THREE.Vector3;
  range: number;
  cameraUp: THREE.Vector3;
  normal: THREE.Vector3;
} | null = null;

function computeTrajectoryBBox(oemData: StateVector[]) {
  if (cachedBBox) return cachedBBox;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const v of oemData) {
    const sx = v.x / SCALE_FACTOR, sy = v.y / SCALE_FACTOR, sz = v.z / SCALE_FACTOR;
    if (sx < minX) minX = sx; if (sx > maxX) maxX = sx;
    if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
    if (sz < minZ) minZ = sz; if (sz > maxZ) maxZ = sz;
  }

  const center = new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  const range = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const normal = getOrbitalPlaneNormal(oemData);

  // Camera up vector — align trajectory's widest extent horizontally
  const viewDir = normal.clone();
  const extents = [
    new THREE.Vector3(maxX - minX, 0, 0),
    new THREE.Vector3(0, maxY - minY, 0),
    new THREE.Vector3(0, 0, maxZ - minZ),
  ];
  let widestAxis = extents[0];
  let widestLen = 0;
  for (const ext of extents) {
    const projected = ext.clone().addScaledVector(viewDir, -ext.dot(viewDir));
    const len = projected.length();
    if (len > widestLen) {
      widestLen = len;
      widestAxis = projected;
    }
  }
  const cameraUp = new THREE.Vector3().crossVectors(widestAxis.normalize(), viewDir).normalize();
  if (cameraUp.y < 0) cameraUp.negate();

  cachedBBox = { center, range, cameraUp, normal };
  return cachedBBox;
}

/**
 * Compute camera position for a given direction from trajectory center.
 * All presets use the same distance (full trajectory fits in frame).
 */
function computePresetCamera(oemData: StateVector[], direction: THREE.Vector3, isMobile: boolean) {
  const bbox = computeTrajectoryBBox(oemData);
  const dist = bbox.range * (isMobile ? 2.2 : 1.8);
  const camPos = bbox.center.clone().addScaledVector(direction.normalize(), dist);
  return { camPos, target: bbox.center.clone(), cameraUp: bbox.cameraUp.clone() };
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
    const bbox = computeTrajectoryBBox(oemData);
    const dist = bbox.range * (isMobile ? 2.2 : 1.8);
    const camPos = bbox.center.clone().addScaledVector(bbox.normal, dist);
    camera.position.copy(camPos);
    camera.up.copy(bbox.cameraUp);
    if (controlsRef.current) {
      controlsRef.current.target.copy(bbox.center);
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

  // Camera presets — all show full trajectory from different angles
  useEffect(() => {
    if (cameraMode === 'free') return;

    const oemData = useMissionStore.getState().oemData;
    if (!oemData || oemData.length === 0) return;

    const bbox = computeTrajectoryBBox(oemData);

    switch (cameraMode) {
      case 'follow-orion': {
        // Same distance as plan view, angled to highlight Orion's current position
        // Uses velocity direction to tilt the view slightly toward where Orion is heading
        const sc = useMissionStore.getState().spacecraft;
        const orionDir = new THREE.Vector3(sc.x, sc.y, sc.z).normalize();
        // Blend: 70% orbital normal (so we see the full trajectory) + 30% from Orion's side
        const blended = bbox.normal.clone().multiplyScalar(0.7)
          .add(orionDir.multiplyScalar(0.3)).normalize();
        const { camPos, target } = computePresetCamera(oemData, blended, isMobile);
        targetPos.current.copy(camPos);
        targetLookAt.current.copy(target);
        camera.up.copy(bbox.cameraUp);
        break;
      }

      case 'earth-view': {
        // Full trajectory viewed from Earth's side
        // Direction: from trajectory center toward Earth (origin)
        const toEarth = bbox.center.clone().negate().normalize();
        // Blend with orbital normal so we don't look edge-on at the trajectory
        const blended = toEarth.multiplyScalar(0.5)
          .add(bbox.normal.clone().multiplyScalar(0.5)).normalize();
        const { camPos, target } = computePresetCamera(oemData, blended, isMobile);
        targetPos.current.copy(camPos);
        targetLookAt.current.copy(target);
        camera.up.copy(bbox.cameraUp);
        break;
      }

      case 'moon-view': {
        // Full trajectory viewed from Moon's side
        let maxDist = 0;
        let flyby = oemData[0];
        for (const v of oemData) {
          const d = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
          if (d > maxDist) { maxDist = d; flyby = v; }
        }
        const moonDir = new THREE.Vector3(flyby.x, flyby.y, flyby.z).normalize();
        // Direction: from trajectory center toward Moon
        // Blend with orbital normal for a 3/4 view
        const toMoon = new THREE.Vector3().subVectors(
          moonDir.clone().multiplyScalar(maxDist / SCALE_FACTOR),
          bbox.center,
        ).normalize();
        const blended = toMoon.multiplyScalar(0.5)
          .add(bbox.normal.clone().multiplyScalar(0.5)).normalize();
        const { camPos, target } = computePresetCamera(oemData, blended, isMobile);
        targetPos.current.copy(camPos);
        targetLookAt.current.copy(target);
        camera.up.copy(bbox.cameraUp);
        break;
      }
    }
  }, [cameraMode, isMobile, camera]);

  useFrame(() => {
    if (cameraMode === 'free') return;

    // Follow Orion: smoothly update camera angle as spacecraft moves
    if (cameraMode === 'follow-orion') {
      const oemData = useMissionStore.getState().oemData;
      if (oemData?.length) {
        const sc = useMissionStore.getState().spacecraft;
        const bbox = computeTrajectoryBBox(oemData);
        const orionDir = new THREE.Vector3(sc.x, sc.y, sc.z).normalize();
        const blended = bbox.normal.clone().multiplyScalar(0.7)
          .add(orionDir.multiplyScalar(0.3)).normalize();
        const dist = bbox.range * (isMobile ? 2.2 : 1.8);
        targetPos.current.copy(bbox.center).addScaledVector(blended, dist);
        targetLookAt.current.copy(bbox.center);
      }
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
      maxDistance={500}
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
