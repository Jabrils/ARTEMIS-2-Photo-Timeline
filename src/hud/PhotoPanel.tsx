import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMissionStore } from '../store/mission-store';
import { MILESTONES, LAUNCH_EPOCH } from '../data/mission-config';

export default function PhotoPanel() {
  const simEpochMs = useMissionStore((s) => s.timeControl.simEpochMs);

  const activePhoto = useMemo(() => {
    const elapsedHours = (simEpochMs - LAUNCH_EPOCH.getTime()) / 3_600_000;
    const candidates = MILESTONES
      .filter((m) => m.photo && Math.abs(elapsedHours - m.missionElapsedHours) <= 0.5)
      .map((m) => ({ ...m, delta: Math.abs(elapsedHours - m.missionElapsedHours) }))
      .sort((a, b) => a.delta - b.delta);
    return candidates[0] ?? null;
  }, [simEpochMs]);

  const stem = activePhoto?.photo
    ? activePhoto.photo.replace(/^.*\//, '').replace(/\.[^.]+$/, '')
    : '';

  return (
    <AnimatePresence>
      {activePhoto && (
        <motion.div
          key={activePhoto.photo}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute left-4 top-14 sm:top-16 w-72 sm:w-80 pointer-events-auto z-[var(--z-hud)] bg-[rgba(10,10,30,0.85)] backdrop-blur-sm border border-[rgba(0,212,255,0.3)] rounded-lg overflow-hidden"
        >
          <img
            src={activePhoto.photo}
            alt={stem}
            className="w-full object-cover"
          />
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] font-mono text-gray-400 truncate pr-2">{stem}</span>
            <span className="text-[10px] font-mono text-[#00d4ff]/70 whitespace-nowrap">
              T+{activePhoto.missionElapsedHours}h
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
