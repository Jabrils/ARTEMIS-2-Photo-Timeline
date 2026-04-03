import { useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * Press D to toggle camera debug overlay.
 * Shows current camera position and lookAt target coordinates.
 * Find the view you like, then share the numbers.
 */
export default function CameraDebug() {
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState({ px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 });
  const { camera } = useThree();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setVisible((v) => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useFrame(() => {
    if (!visible) return;
    // Get the lookAt target from the camera's direction
    const dir = camera.getWorldDirection({ x: 0, y: 0, z: 0 } as any);
    setInfo({
      px: Math.round(camera.position.x * 100) / 100,
      py: Math.round(camera.position.y * 100) / 100,
      pz: Math.round(camera.position.z * 100) / 100,
      tx: Math.round((camera.position.x + dir.x * 10) * 100) / 100,
      ty: Math.round((camera.position.y + dir.y * 10) * 100) / 100,
      tz: Math.round((camera.position.z + dir.z * 10) * 100) / 100,
    });
  });

  if (!visible) return null;

  return (
    <Html fullscreen zIndexRange={[100, 100]}>
      <div style={{
        position: 'fixed',
        top: 50,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid #00d4ff',
        borderRadius: 8,
        padding: '8px 16px',
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#00d4ff',
        zIndex: 9999,
        pointerEvents: 'none',
        whiteSpace: 'pre',
      }}>
{`CAM POS: (${info.px}, ${info.py}, ${info.pz})
LOOK AT: (${info.tx}, ${info.ty}, ${info.tz})
Press D to hide`}
      </div>
    </Html>
  );
}
