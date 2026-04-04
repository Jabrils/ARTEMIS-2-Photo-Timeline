import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMissionStore } from '../store/mission-store';
import type { RadiationZone } from '../store/mission-store';

const KP_COLOR: Record<string, string> = {
  low: 'bg-[#00ff88] shadow-[0_0_6px_rgba(0,255,136,0.5)]',
  mid: 'bg-[#ff8c00] shadow-[0_0_6px_rgba(255,140,0,0.5)]',
  high: 'bg-[#ff4444] shadow-[0_0_6px_rgba(255,68,68,0.5)]',
};

function kpColor(kp: number): string {
  if (kp <= 3) return KP_COLOR.low;
  if (kp <= 5) return KP_COLOR.mid;
  return KP_COLOR.high;
}

function kpDescription(kp: number): string {
  if (kp <= 1) return 'Quiet — minimal geomagnetic activity';
  if (kp <= 3) return 'Unsettled — low geomagnetic activity';
  if (kp <= 5) return 'Active — moderate geomagnetic storm';
  if (kp <= 7) return 'Storm — strong geomagnetic storm';
  return 'Severe — extreme geomagnetic storm';
}

const ZONE_COLOR: Record<RadiationZone, string> = {
  'clear': 'bg-[#00ff88] shadow-[0_0_6px_rgba(0,255,136,0.5)]',
  'deep-space': 'bg-[#00ff88] shadow-[0_0_6px_rgba(0,255,136,0.5)]',
  'outer-belt': 'bg-[#ff8c00] shadow-[0_0_6px_rgba(255,140,0,0.5)]',
  'slot-region': 'bg-[#ff8c00] shadow-[0_0_6px_rgba(255,140,0,0.5)]',
  'inner-belt': 'bg-[#ff4444] shadow-[0_0_6px_rgba(255,68,68,0.5)]',
};

const ZONE_LABEL: Record<RadiationZone, string> = {
  'clear': 'Clear',
  'deep-space': 'Deep Space',
  'outer-belt': 'Outer Belt',
  'slot-region': 'Slot Region',
  'inner-belt': 'Inner Belt',
};

const ZONE_DESCRIPTION: Record<RadiationZone, string> = {
  'clear': 'Below the Van Allen belts — minimal radiation exposure',
  'deep-space': 'Beyond the Van Allen belts — low background radiation',
  'outer-belt': 'Outer Van Allen belt (13,000–60,000 km) — elevated electron flux',
  'slot-region': 'Slot region between belts (6,000–13,000 km) — moderate radiation',
  'inner-belt': 'Inner Van Allen belt (1,000–6,000 km) — high proton radiation',
};

interface TooltipInfo {
  title: string;
  value: string;
  description: string;
}

const TOOLTIP_CONFIG: Record<string, (kp: number, wind: number, zone: RadiationZone) => TooltipInfo> = {
  kp: (kp) => ({
    title: 'Kp Index',
    value: `${kp} / 9`,
    description: kpDescription(kp),
  }),
  wind: (_kp, wind) => ({
    title: 'Solar Wind Speed',
    value: `${wind} km/s`,
    description: wind < 400
      ? 'Normal solar wind conditions'
      : wind < 500
        ? 'Elevated solar wind — minor particle flux increase'
        : 'High-speed solar wind stream — increased radiation risk',
  }),
  zone: (_kp, _wind, zone) => ({
    title: 'Radiation Zone',
    value: ZONE_LABEL[zone],
    description: ZONE_DESCRIPTION[zone],
  }),
  source: () => ({
    title: 'Data Source',
    value: 'Simulated',
    description: 'Synthetic data generated from mission trajectory and scripted solar events. Not live telemetry.',
  }),
};

export default function SpaceWeatherPanel() {
  const kpIndex = useMissionStore((s) => s.spaceWeather.kpIndex);
  const solarWindSpeed = useMissionStore((s) => s.spaceWeather.solarWindSpeed);
  const radiationZone = useMissionStore((s) => s.spaceWeather.radiationZone);
  const source = useMissionStore((s) => s.spaceWeather.source);
  const [hovered, setHovered] = useState<string | null>(null);

  const tooltip = hovered ? TOOLTIP_CONFIG[hovered](kpIndex, solarWindSpeed, radiationZone) : null;

  return (
    <div className="relative flex items-center gap-3 flex-wrap bg-[rgba(10,10,30,0.7)] backdrop-blur-sm border border-[rgba(0,212,255,0.2)] rounded-lg px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-gray-400">Space Weather</span>

      {/* Kp Index */}
      <div
        className="flex items-center gap-1.5 cursor-help"
        onMouseEnter={() => setHovered('kp')}
        onMouseLeave={() => setHovered(null)}
      >
        <div className={`w-2 h-2 rounded-full ${kpColor(kpIndex)}`} />
        <span className="text-xs text-white font-mono">Kp {kpIndex}</span>
      </div>

      {/* Solar Wind */}
      <div
        className="flex items-center gap-1 cursor-help"
        onMouseEnter={() => setHovered('wind')}
        onMouseLeave={() => setHovered(null)}
      >
        <span className="text-xs text-white font-mono">{solarWindSpeed}</span>
        <span className="text-[10px] text-gray-500">km/s</span>
      </div>

      {/* Radiation Zone */}
      <div
        className="flex items-center gap-1.5 cursor-help"
        onMouseEnter={() => setHovered('zone')}
        onMouseLeave={() => setHovered(null)}
      >
        <div className={`w-2 h-2 rounded-full ${ZONE_COLOR[radiationZone]}`} />
        <span className="text-xs text-white font-mono">{ZONE_LABEL[radiationZone]}</span>
      </div>

      {/* Source badge */}
      <div
        className="flex items-center gap-1 cursor-help"
        onMouseEnter={() => setHovered('source')}
        onMouseLeave={() => setHovered(null)}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
        <span className="text-[9px] text-gray-500 uppercase">{source === 'synthetic' ? 'SIM' : 'LIVE'}</span>
      </div>

      {/* Hover info card */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 z-50 bg-[rgba(10,10,30,0.9)] backdrop-blur-sm border border-[rgba(0,212,255,0.2)] rounded-lg px-3 py-2 min-w-[240px] max-w-[300px]"
          >
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{tooltip.title}</div>
            <div className="text-sm text-white font-mono font-bold">{tooltip.value}</div>
            <div className="text-[10px] text-gray-300 mt-1 leading-relaxed">{tooltip.description}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
