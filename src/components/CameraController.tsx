import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../store/mission-store';
import { SCALE_FACTOR } from '../data/mission-config';

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

export default function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const cameraMode = useMissionStore((s) => s.cameraMode);
  const setCameraMode = useMissionStore((s) => s.setCameraMode);
  const isMobile = useIsMobile();
  const hasAutoFit = useRef(false);
  const isUserInteracting = useRef(false);

  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  // When user starts dragging, switch to free mode to stop animation
  const onControlStart = useCallback(() => {
    isUserInteracting.current = true;
    if (cameraMode !== 'free') {
      setCameraMode('free');
    }
  }, [cameraMode, setCameraMode]);

  const onControlEnd = useCallback(() => {
    isUserInteracting.current = false;
  }, []);

  // Auto-fit camera to show full trajectory on first load
  useEffect(() => {
    if (hasAutoFit.current) return;
    const oemData = useMissionStore.getState().oemData;
    if (!oemData || oemData.length === 0) return;
    hasAutoFit.current = true;

    const { cx, cy, cz, dist } = computeTrajectoryBounds(oemData, isMobile);
    camera.position.set(cx, cy + dist * 0.3, cz + dist);
    if (controlsRef.current) {
      controlsRef.current.target.set(cx, cy, cz);
    }
  }, [camera, isMobile]);

  // Subscribe to store changes for auto-fit trigger
  useEffect(() => {
    const unsub = useMissionStore.subscribe((state) => {
      if (hasAutoFit.current || !state.oemData || state.oemData.length === 0) return;
      hasAutoFit.current = true;

      const { cx, cy, cz, dist } = computeTrajectoryBounds(state.oemData, isMobile);
      camera.position.set(cx, cy + dist * 0.3, cz + dist);
      if (controlsRef.current) {
        controlsRef.current.target.set(cx, cy, cz);
      }
    });
    return unsub;
  }, [camera, isMobile]);

  // Set camera targets when mode changes
  useEffect(() => {
    if (cameraMode === 'free') return;

    const sc = useMissionStore.getState().spacecraft;
    const orionPos = new THREE.Vector3(
      sc.x / SCALE_FACTOR,
      sc.y / SCALE_FACTOR,
      sc.z / SCALE_FACTOR,
    );

    // Midpoint between Earth (origin) and Orion
    const midpoint = orionPos.clone().multiplyScalar(0.5);

    switch (cameraMode) {
      case 'follow-orion':
        targetPos.current.copy(orionPos).add(new THREE.Vector3(2, 2, 5));
        targetLookAt.current.copy(orionPos);
        break;
      case 'earth-view':
        // Earth centered in frame, camera backed up to see full trajectory
        targetPos.current.set(0, 10, 35);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 'moon-view': {
        const oemData = useMissionStore.getState().oemData;
        if (oemData && oemData.length > 0) {
          // Find flyby point (max distance from Earth)
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
          targetPos.current.copy(moonPos).add(new THREE.Vector3(3, 2, 6));
          targetLookAt.current.copy(moonPos);
        }
        break;
      }
    }
  }, [cameraMode]);

  useFrame(() => {
    if (cameraMode === 'free' || isUserInteracting.current) return;

    // Continuously track Orion for follow modes
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
      onEnd={onControlEnd}
    />
  );
}

function computeTrajectoryBounds(oemData: { x: number; y: number; z: number }[], isMobile: boolean) {
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
  const dist = range * (isMobile ? 1.2 : 0.9);
  return { cx, cy, cz, dist };
}
