import { useMissionStore } from '../store/mission-store';
import TelemetryCard from './TelemetryCard';
import MissionClock from './MissionClock';
import ProgressBar from './ProgressBar';
import DSNStatus from './DSNStatus';
import CameraControls from './CameraControls';

export default function HUD() {
  const spacecraft = useMissionStore((s) => s.spacecraft);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
      {/* Top bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-widest text-white">
            ARTEMIS <span className="text-hud-blue">II</span>
          </h1>
        </div>
        <MissionClock />
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-3">
        {/* DSN + Camera controls */}
        <div className="flex items-center justify-between pointer-events-auto">
          <DSNStatus />
          <CameraControls />
        </div>

        {/* Telemetry cards */}
        <div className="flex items-center gap-3 pointer-events-auto flex-wrap">
          <TelemetryCard
            label="Speed"
            value={spacecraft.speed}
            unit="km/h"
            color="#ff8c00"
          />
          <TelemetryCard
            label="Distance from Earth"
            value={spacecraft.earthDist}
            unit="km"
            color="#00d4ff"
          />
          <TelemetryCard
            label="Distance to Moon"
            value={spacecraft.moonDist ?? 0}
            unit="km"
            color="#aaaaaa"
          />
          <ProgressBar />
        </div>
      </div>
    </div>
  );
}
