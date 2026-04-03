import { useTexture } from '@react-three/drei';
import { useMissionStore } from '../store/mission-store';
import { SCALE_FACTOR } from '../data/mission-config';

export default function Moon() {
  const texture = useTexture('/textures/moon.jpg');
  const moonPosition = useMissionStore((s) => s.moonPosition);

  // Scale moon position from km to scene units
  const pos: [number, number, number] = moonPosition
    ? [moonPosition.x / SCALE_FACTOR, moonPosition.y / SCALE_FACTOR, moonPosition.z / SCALE_FACTOR]
    : [38.44, 0, 0]; // Fallback: mean distance

  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.1737, 32, 32]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
