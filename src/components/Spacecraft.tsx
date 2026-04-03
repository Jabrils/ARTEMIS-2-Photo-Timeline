import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMissionStore } from '../store/mission-store';
import { SCALE_FACTOR } from '../data/mission-config';

export default function Spacecraft() {
  const meshRef = useRef<THREE.Mesh>(null);
  const spacecraft = useMissionStore((s) => s.spacecraft);

  const pos: [number, number, number] = [
    spacecraft.x / SCALE_FACTOR,
    spacecraft.y / SCALE_FACTOR,
    spacecraft.z / SCALE_FACTOR,
  ];

  // Pulsing animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.3;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  const isVisible = spacecraft.earthDist > 0;

  return isVisible ? (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#00ff88" toneMapped={false} />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.15} toneMapped={false} />
      </mesh>
      <Html
        position={[0, 0.5, 0]}
        center
        zIndexRange={[0, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          color: '#00ff88',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          textShadow: '0 0 8px rgba(0,255,136,0.5)',
          whiteSpace: 'nowrap',
        }}>
          ORION
        </div>
      </Html>
    </group>
  ) : null;
}
