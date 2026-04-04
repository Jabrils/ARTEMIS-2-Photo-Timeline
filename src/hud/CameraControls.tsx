import { useMissionStore } from '../store/mission-store';
import type { CameraMode } from '../store/mission-store';

const PRESETS: Array<{ mode: CameraMode; label: string; shortLabel: string }> = [
  { mode: 'follow-orion', label: 'Follow Orion', shortLabel: 'Follow' },
  { mode: 'earth-view', label: 'Earth View', shortLabel: 'Earth' },
  { mode: 'moon-view', label: 'Moon View', shortLabel: 'Moon' },
  { mode: 'free', label: 'Free', shortLabel: 'Free' },
];

export default function CameraControls() {
  const cameraMode = useMissionStore((s) => s.cameraMode);
  const setCameraMode = useMissionStore((s) => s.setCameraMode);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      {PRESETS.map(({ mode, label, shortLabel }) => (
        <button
          key={mode}
          onClick={() => setCameraMode(mode)}
          className={`px-2 sm:px-3 py-1.5 rounded text-[10px] sm:text-xs font-mono transition-all min-h-[36px] sm:min-h-0 ${
            cameraMode === mode
              ? 'bg-[rgba(0,212,255,0.2)] text-hud-blue border border-hud-blue'
              : 'bg-[rgba(10,10,30,0.5)] text-gray-400 border border-transparent hover:border-[rgba(0,212,255,0.3)] hover:text-gray-200'
          }`}
        >
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
