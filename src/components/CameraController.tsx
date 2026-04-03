import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../store/mission-store';
import { SCALE_FACTOR } from '../data/mission-config';

export default function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const cameraMode = useMissionStore((s) => s.cameraMode);
  const spacecraft = useMissionStore((s) => s.spacecraft);

  const targetPos = useRef(new THREE.Vector3(0, 5, 25));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
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
        targetPos.current.set(0, 2, 5);
        targetLookAt.current.copy(orionPos);
        break;
      case 'moon-view': {
        const moon = useMissionStore.getState().moonPosition;
        if (moon) {
          targetPos.current.set(
            moon.x / SCALE_FACTOR + 2,
            moon.y / SCALE_FACTOR + 2,
            moon.z / SCALE_FACTOR + 5,
          );
        }
        targetLookAt.current.set(0, 0, 0);
        break;
      }
      case 'free':
      default:
        break;
    }
  }, [cameraMode]);

  useFrame(() => {
    if (cameraMode === 'free') return;

    camera.position.lerp(targetPos.current, 0.02);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.02);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={200}
    />
  );
}
