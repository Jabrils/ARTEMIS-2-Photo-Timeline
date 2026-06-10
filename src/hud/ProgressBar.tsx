import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMission } from '../hooks/useMission';
import { useMissionStore } from '../store/mission-store';
import { MISSION_DURATION_HOURS, LAUNCH_EPOCH } from '../data/mission-config';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TOTAL_MISSION_HOURS = MISSION_DURATION_HOURS;

function isOrion(nasaId?: string) { return !!nasaId?.startsWith('art002'); }

function applyPhotoFilter<T extends { nasaId?: string; photo?: string; showInBoth?: boolean }>(
  items: T[], filter: 'all' | 'orion' | 'earth'
): T[] {
  if (filter === 'all') return items;
  return items.filter(m => {
    if (!m.photo) return true;          // non-photo milestones always shown
    if (m.showInBoth) return true;      // splashdown etc — relevant to both views
    return filter === 'orion' ? isOrion(m.nasaId) : !isOrion(m.nasaId);
  });
}

export default function ProgressBar() {
  const { progress, totalMs } = useMission();
  const setHoveredMilestoneHours = useMissionStore((s) => s.setHoveredMilestoneHours);
  const externalHoveredHours = useMissionStore((s) => s.hoveredMilestoneHours);
  const setSimTime = useMissionStore((s) => s.setSimTime);
  const setTimeMode = useMissionStore((s) => s.setTimeMode);
  const simEpochMs = useMissionStore((s) => s.timeControl.simEpochMs);
  const utcOffset = useMissionStore((s) => s.utcOffset);
  const setUtcOffset = useMissionStore((s) => s.setUtcOffset);
  const milestones    = useMissionStore((s) => s.milestones);
  const photoFilter   = useMissionStore((s) => s.photoFilter);
  const setPhotoFilter = useMissionStore((s) => s.setPhotoFilter);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [photoNavIndex, setPhotoNavIndex] = useState<number | null>(null);
  const isPhotoNavRef = useRef(false);

  const elapsedHours = totalMs / 3_600_000;

  const { milestoneData, currentIndex, photoMilestones, derivedPhotoIndex } = useMemo(() => {
    const filtered = applyPhotoFilter(milestones, photoFilter);
    const sorted = [...filtered].sort((a, b) => a.missionElapsedHours - b.missionElapsedHours);

    const data = sorted.map((m, i) => {
      const position = (m.missionElapsedHours / TOTAL_MISSION_HOURS) * 100;
      const isComplete = elapsedHours >= m.missionElapsedHours;
      const isNext = i > 0 && elapsedHours < m.missionElapsedHours &&
        elapsedHours >= sorted[i - 1].missionElapsedHours;
      return { ...m, position, isComplete, isNext, index: i };
    });

    let idx = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (elapsedHours >= sorted[i].missionElapsedHours) {
        idx = i;
        break;
      }
    }

    const photos = data.filter((m) => m.photo);

    // Match PhotoPanel: find closest photo within ±0.5h of current time.
    // Falls back to "last photo before current time" when no photo is in view.
    let derivedPhotoIdx = 0;
    let bestDelta = Infinity;
    let foundInWindow = false;
    for (let i = 0; i < photos.length; i++) {
      const delta = Math.abs(elapsedHours - photos[i].missionElapsedHours);
      if (delta <= 0.5 && delta < bestDelta) {
        bestDelta = delta;
        derivedPhotoIdx = i;
        foundInWindow = true;
      }
    }
    if (!foundInWindow) {
      for (let i = photos.length - 1; i >= 0; i--) {
        if (elapsedHours >= photos[i].missionElapsedHours) {
          derivedPhotoIdx = i;
          break;
        }
      }
    }

    return { milestoneData: data, currentIndex: idx, photoMilestones: photos, derivedPhotoIndex: derivedPhotoIdx };
  }, [elapsedHours, milestones, photoFilter]);

  // Reset explicit nav index when the user changes time from an external source
  // (scrubbing, clicking a milestone dot, etc.) — but not from our own nav buttons
  useEffect(() => {
    if (isPhotoNavRef.current) {
      isPhotoNavRef.current = false;
      return;
    }
    setPhotoNavIndex(null);
  }, [simEpochMs]);

  // Use explicit index from ← → buttons; fall back to derived from elapsed time
  const currentPhotoIndex = photoNavIndex ?? derivedPhotoIndex;

  // Compute external hover index from MissionEventsPanel
  const externalHoveredIndex = externalHoveredHours != null
    ? milestoneData.findIndex((m) => m.missionElapsedHours === externalHoveredHours)
    : null;
  const activeHoveredIndex = hoveredIndex ?? (externalHoveredIndex !== -1 ? externalHoveredIndex : null);

  const nextMilestone = milestoneData[currentIndex + 1] ?? null;
  const countdown = useMemo(() => {
    if (!nextMilestone) return null;
    const remainingHours = nextMilestone.missionElapsedHours - elapsedHours;
    if (remainingHours <= 0) return null;
    const d = Math.floor(remainingHours / 24);
    const h = Math.floor(remainingHours % 24);
    const m = Math.floor((remainingHours % 1) * 60);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
  }, [nextMilestone, elapsedHours]);

  function handlePhotoNav(index: number) {
    const target = photoMilestones[index];
    if (!target) return;
    isPhotoNavRef.current = true;
    setPhotoNavIndex(index);
    setTimeMode('sim');
    setSimTime(LAUNCH_EPOCH.getTime() + target.missionElapsedHours * 3_600_000);
  }

  function handleHover(i: number) {
    setHoveredIndex(i);
    setHoveredMilestoneHours(milestoneData[i].missionElapsedHours);
  }

  function handleLeave() {
    setHoveredIndex(null);
    setHoveredMilestoneHours(null);
  }

  return (
    <div className="bg-[rgba(10,10,30,0.7)] backdrop-blur-sm border border-[rgba(0,212,255,0.2)] rounded-lg px-3 sm:px-4 py-2 sm:py-3 min-w-0 col-span-2 sm:col-span-1 sm:flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] uppercase tracking-wider text-gray-400">Mission Progress</div>
        <div className="flex items-center gap-1">
          {(['all', 'orion', 'earth'] as const).map(f => (
            <button
              key={f}
              onClick={() => setPhotoFilter(f)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors ${
                photoFilter === f
                  ? 'text-[#00d4ff] border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.1)]'
                  : 'text-gray-500 border-[rgba(255,255,255,0.1)] hover:text-gray-300 hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'orion' ? '🚀 Orion' : '🌍 Earth'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Track wrapper — relative for markers, inner overflow-hidden for fill */}
        <div className="flex-1 relative h-2">
          {/* Fill bar */}
          <div className="absolute inset-0 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#ff8c00] to-[#00d4ff]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          {/* Milestone markers */}
          {milestoneData.map((m, i) => (
            <div
              key={m.name}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-2 -m-2 cursor-pointer"
              style={{ left: `${m.position}%` }}
              onMouseEnter={() => handleHover(i)}
              onMouseLeave={handleLeave}
              onTouchStart={() => handleHover(i)}
              onTouchEnd={handleLeave}
              onClick={() => {
                setTimeMode('sim');
                setSimTime(LAUNCH_EPOCH.getTime() + m.missionElapsedHours * 3_600_000);
              }}
            >
              {i === currentIndex ? (
                <motion.div
                  className={`rounded-full bg-[#00d4ff] cursor-pointer ${m.photo ? 'w-2.5 h-2.5 sm:w-[10px] sm:h-[10px]' : 'w-1.5 h-1.5 sm:w-[6px] sm:h-[6px]'}`}
                  animate={{
                    boxShadow: [
                      '0 0 4px rgba(0,212,255,0.4)',
                      '0 0 10px rgba(0,212,255,0.7)',
                    ],
                  }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                />
              ) : (
                <div
                  className={`rounded-full cursor-pointer ${m.photo
                    ? 'w-2.5 h-2.5 sm:w-[10px] sm:h-[10px] bg-[#ff8c00] shadow-[0_0_6px_rgba(255,140,0,0.5)]'
                    : `w-1.5 h-1.5 sm:w-[6px] sm:h-[6px] ${m.isComplete ? 'bg-[#00ff88] shadow-[0_0_4px_rgba(0,255,136,0.3)]' : 'bg-gray-600'}`
                  }`}
                />
              )}

              {/* Tooltip */}
              <AnimatePresence>
                {activeHoveredIndex === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute bottom-full mb-3 z-[var(--z-tooltip)] bg-[rgba(10,10,30,0.95)] backdrop-blur-md border border-[rgba(0,212,255,0.3)] rounded-lg overflow-hidden min-w-[140px] sm:min-w-[180px] max-w-[calc(100vw-2rem)] sm:max-w-[240px] whitespace-normal shadow-lg ${
                      m.position < 20 ? 'left-0' : m.position > 80 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                    }`}
                  >
                    {m.photo && (
                      <img
                        src={m.photo}
                        alt={m.name}
                        className="w-full h-28 object-cover"
                      />
                    )}
                    <div className="px-3 py-2">
                      <div className="text-xs text-white font-mono font-bold">{m.name}</div>
                      <div className="text-[11px] text-gray-300 mt-1 leading-relaxed">{m.description}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500">T+{m.missionElapsedHours}h</span>
                        {m.focalLength && (
                          <span className="text-[10px] text-gray-600">{m.focalLength}mm</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#00d4ff]/70 mt-0.5 italic">See marker on trajectory</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <span className="text-sm font-mono text-hud-blue font-bold whitespace-nowrap">
          {progress.toFixed(1)}%
        </span>
      </div>
      {/* Wall clock + elapsed info row */}
      <div className="flex items-center gap-1 mt-1">
        <button
          onClick={() => setUtcOffset(utcOffset - 1)}
          disabled={utcOffset <= -12}
          className="px-1.5 py-0.5 rounded font-mono text-[11px] text-gray-400 border border-[rgba(255,255,255,0.15)] hover:text-[#00d4ff] hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.08)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          title="Decrease UTC offset"
        >−</button>
        <span className="font-mono text-[9px] sm:text-[10px] text-[#00d4ff]/80 tabular-nums whitespace-nowrap px-0.5">
          {(() => {
            const d = new Date(simEpochMs + utcOffset * 3_600_000);
            const mon = MONTHS[d.getUTCMonth()];
            const day = String(d.getUTCDate()).padStart(2, '0');
            const hh = String(d.getUTCHours()).padStart(2, '0');
            const mm = String(d.getUTCMinutes()).padStart(2, '0');
            const sign = utcOffset >= 0 ? '+' : '−';
            return `${mon} ${day} ${hh}:${mm} UTC${sign}${Math.abs(utcOffset)}`;
          })()}
        </span>
        <button
          onClick={() => setUtcOffset(utcOffset + 1)}
          disabled={utcOffset >= 14}
          className="px-1.5 py-0.5 rounded font-mono text-[11px] text-gray-400 border border-[rgba(255,255,255,0.15)] hover:text-[#00d4ff] hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.08)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          title="Increase UTC offset"
        >+</button>
        <span className="text-gray-600 font-mono text-[9px] px-0.5">·</span>
        <span className="font-mono text-[9px] sm:text-[10px] text-gray-500 tabular-nums whitespace-nowrap">
          T+{elapsedHours.toFixed(1)}h / {TOTAL_MISSION_HOURS.toFixed(1)}h ({progress.toFixed(1)}%)
        </span>
      </div>

      {/* Photo nav arrows + countdown */}
      <div className="flex items-center gap-1.5 mt-1">
        <button
          onClick={() => handlePhotoNav(currentPhotoIndex - 1)}
          disabled={currentPhotoIndex === 0}
          className="px-2 py-0.5 rounded font-mono text-sm text-[#00d4ff] border border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.6)] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous photo"
        >←</button>
        <button
          onClick={() => handlePhotoNav(currentPhotoIndex + 1)}
          disabled={currentPhotoIndex === photoMilestones.length - 1}
          className="px-2 py-0.5 rounded font-mono text-sm text-[#00d4ff] border border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.6)] hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          aria-label="Next photo"
        >→</button>
        <div className="text-[9px] sm:text-[10px] text-[#00d4ff]/60 truncate">
          {nextMilestone && countdown
            ? `Next: ${nextMilestone.name} in ${countdown}`
            : 'Mission Complete'}
        </div>
      </div>
    </div>
  );
}
