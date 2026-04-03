import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture('/textures/earth-day.jpg');

  useFrame((_state, delta) => {
    if (meshRef.current) {
      // Earth rotation: ~360deg per 24h
      meshRef.current.rotation.y += (delta / 86400) * Math.PI * 2;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.637, 64, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      {/* Atmosphere glow */}
      <mesh scale={1.05}>
        <sphereGeometry args={[0.637, 32, 32]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
