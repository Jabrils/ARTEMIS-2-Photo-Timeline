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

/** Compute top-down plan view camera: looks straight down, Earth on right, trajectory filling frame */
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

  // Center of the trajectory bounding box
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const rangeXZ = Math.max(maxX - minX, maxZ - minZ);
  const height = rangeXZ * (isMobile ? 1.4 : 1.0);

  return {
    // Camera above, looking straight down
    camPos: new THREE.Vector3(cx, cy + height, cz),
    // Look at trajectory center
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

  // When user starts dragging, switch to free mode
  const onControlStart = useCallback(() => {
    if (cameraMode !== 'free') {
      setCameraMode('free');
    }
  }, [cameraMode, setCameraMode]);

  // Set initial top-down plan view
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

  // Subscribe for auto-fit trigger
  useEffect(() => {
    const unsub = useMissionStore.subscribe((state) => {
      if (hasAutoFit.current || !state.oemData || state.oemData.length === 0) return;
      hasAutoFit.current = true;
      applyPlanView(state.oemData);
    });
    return unsub;
  }, [applyPlanView]);

  // Camera presets
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
      case 'follow-orion':
        targetPos.current.copy(orionPos).add(new THREE.Vector3(2, 2, 5));
        targetLookAt.current.copy(orionPos);
        break;

      case 'earth-view':
        // Top-down plan view — same as initial load
        if (oemData && oemData.length > 0) {
          const { camPos, target } = computePlanView(oemData, isMobile);
          targetPos.current.copy(camPos);
          targetLookAt.current.copy(target);
        }
        break;

      case 'moon-view':
        if (oemData && oemData.length > 0) {
          let maxDist = 0;
          let flyby = oemData[0];
          for (const v of oemData) {
            const d = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
            if (d > maxDist) { maxDist = d; flyby = v; }
          }
          const moonPos = new THREE.Vector3(
            flyby.x / SCALE_FACTOR,
            flyby.y / SCALE_FACTOR,
            flyby.z / SCALE_FACTOR,
          );
          targetPos.current.copy(moonPos).add(new THREE.Vector3(0, 5, 3));
          targetLookAt.current.copy(moonPos);
        }
        break;
    }
  }, [cameraMode, isMobile]);

  useFrame(() => {
    if (cameraMode === 'free') return;

    if (cameraMode === 'follow-orion') {
      const sc = useMissionStore.getState().spacecraft;
      const orionPos = new THREE.Vector3(sc.x / SCALE_FACTOR, sc.y / SCALE_FACTOR, sc.z / SCALE_FACTOR);
      targetPos.current.copy(orionPos).add(new THREE.Vector3(2, 2, 5));
      targetLookAt.current.copy(orionPos);
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
      maxDistance={200}
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
