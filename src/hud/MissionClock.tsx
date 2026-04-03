import { useMission } from '../hooks/useMission';

export default function MissionClock() {
  const { formatted, currentPhase } = useMission();

  return (
    <div className="flex items-center gap-4">
      <span className="text-hud-blue font-mono text-lg font-bold tracking-wider">
        {formatted}
      </span>
      <span className="text-xs text-gray-400 uppercase tracking-wider">
        {currentPhase}
      </span>
    </div>
  );
}
