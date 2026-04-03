import { useMissionStore } from '../store/mission-store';
import type { CameraMode } from '../store/mission-store';

const PRESETS: Array<{ mode: CameraMode; label: string }> = [
  { mode: 'follow-orion', label: 'Follow Orion' },
  { mode: 'earth-view', label: 'Earth View' },
  { mode: 'moon-view', label: 'Moon View' },
  { mode: 'free', label: 'Free' },
];

export default function CameraControls() {
  const cameraMode = useMissionStore((s) => s.cameraMode);
  const setCameraMode = useMissionStore((s) => s.setCameraMode);

  return (
    <div className="flex items-center gap-2">
      {PRESETS.map(({ mode, label }) => (
        <button
          key={mode}
          onClick={() => setCameraMode(mode)}
          className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
            cameraMode === mode
              ? 'bg-[rgba(0,212,255,0.2)] text-hud-blue border border-hud-blue'
              : 'bg-[rgba(10,10,30,0.5)] text-gray-400 border border-transparent hover:border-[rgba(0,212,255,0.3)] hover:text-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
