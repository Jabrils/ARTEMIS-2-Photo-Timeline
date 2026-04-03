import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Press D to toggle camera debug overlay.
 * Uses direct DOM manipulation instead of drei's <Html> to avoid
 * pointer-event and rendering issues across camera modes.
 */
export default function CameraDebug() {
  const { camera } = useThree();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const visibleRef = useRef(false);
  const dirVec = useRef(new THREE.Vector3());

  useEffect(() => {
    const div = document.createElement('div');
    div.style.cssText = [
      'position:fixed', 'top:50px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)', 'border:1px solid #00d4ff', 'border-radius:8px',
      'padding:8px 16px', 'font-family:monospace', 'font-size:12px', 'color:#00d4ff',
      'z-index:9999', 'pointer-events:none', 'white-space:pre', 'display:none',
    ].join(';');
    document.body.appendChild(div);
    overlayRef.current = div;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        visibleRef.current = !visibleRef.current;
        div.style.display = visibleRef.current ? 'block' : 'none';
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (div.parentNode) div.parentNode.removeChild(div);
    };
  }, []);

  useFrame(() => {
    if (!visibleRef.current || !overlayRef.current) return;
    const p = camera.position;
    const dir = camera.getWorldDirection(dirVec.current);
    overlayRef.current.textContent =
      `CAM POS: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})\n` +
      `LOOK AT: (${(p.x + dir.x * 10).toFixed(2)}, ${(p.y + dir.y * 10).toFixed(2)}, ${(p.z + dir.z * 10).toFixed(2)})\n` +
      `Press D to hide`;
  });

  return null;
}
