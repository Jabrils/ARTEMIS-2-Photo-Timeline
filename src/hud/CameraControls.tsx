import { useMissionStore } from '../store/mission-store';
import type { CameraMode, FollowOrionLookAt } from '../store/mission-store';

const PRESETS: Array<{ mode: CameraMode; label: string; shortLabel: string }> = [
  { mode: 'follow-orion', label: 'Follow Orion', shortLabel: 'Follow' },
  { mode: 'earth-view', label: 'Earth View', shortLabel: 'Earth' },
  { mode: 'moon-view', label: 'Moon View', shortLabel: 'Moon' },
  { mode: 'free', label: 'Free', shortLabel: 'Free' },
];

const LOOKAT_TARGETS: Array<{ target: FollowOrionLookAt; label: string }> = [
  { target: 'forward', label: 'Trajectory' },
  { target: 'moon', label: 'Moon' },
  { target: 'earth', label: 'Earth' },
];

export default function CameraControls() {
  const cameraMode = useMissionStore((s) => s.cameraMode);
  const setCameraMode = useMissionStore((s) => s.setCameraMode);
  const followOrionLookAt = useMissionStore((s) => s.followOrionLookAt);
  const setFollowOrionLookAt = useMissionStore((s) => s.setFollowOrionLookAt);

  return (
    <div className="flex flex-col gap-1.5">
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

      {cameraMode === 'follow-orion' && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] sm:text-[10px] font-mono text-gray-500 mr-0.5">Look at:</span>
          {LOOKAT_TARGETS.map(({ target, label }) => (
            <button
              key={target}
              onClick={() => setFollowOrionLookAt(target)}
              className={`px-2 py-1 rounded text-[9px] sm:text-[10px] font-mono transition-all ${
                followOrionLookAt === target
                  ? 'bg-[rgba(0,212,255,0.15)] text-hud-blue border border-[rgba(0,212,255,0.6)]'
                  : 'bg-[rgba(10,10,30,0.4)] text-gray-500 border border-[rgba(255,255,255,0.1)] hover:border-[rgba(0,212,255,0.3)] hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
