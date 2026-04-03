import { useMemo, useRef } from 'react';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function Stars() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      const r = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}
