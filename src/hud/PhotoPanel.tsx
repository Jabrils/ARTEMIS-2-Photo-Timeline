import { useMemo, useState } from 'react';
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

  const [expanded, setExpanded] = useState(false);

  return (
    <>
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
          <div className="relative group cursor-pointer" onClick={() => setExpanded(true)}>
            <img
              src={activePhoto.photo}
              alt={stem}
              className="w-full object-cover"
            />
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] font-mono text-gray-400 truncate pr-2">{stem}</span>
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              {activePhoto.focalLength && (
                <span className="text-[10px] font-mono text-gray-500">{activePhoto.focalLength}mm</span>
              )}
              <span className="text-[10px] font-mono text-[#00d4ff]/70">
                T+{activePhoto.missionElapsedHours}h
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {expanded && activePhoto && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/70 cursor-pointer"
            onClick={() => setExpanded(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[61] flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto max-w-[90vw] max-h-[90vh] flex flex-col">
              <img
                src={activePhoto.photo}
                alt={stem}
                className="max-w-full max-h-[85vh] object-contain rounded-lg border border-[rgba(0,212,255,0.3)] cursor-pointer"
                onClick={() => setExpanded(false)}
              />
              <div className="flex items-center justify-between px-3 py-1.5 bg-[rgba(10,10,30,0.85)] rounded-b-lg border-x border-b border-[rgba(0,212,255,0.3)]">
                <span className="text-[10px] font-mono text-gray-400 truncate pr-2">{stem}</span>
                <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                  {activePhoto.focalLength && (
                    <span className="text-[10px] font-mono text-gray-500">{activePhoto.focalLength}mm</span>
                  )}
                  <span className="text-[10px] font-mono text-[#00d4ff]/70">
                    T+{activePhoto.missionElapsedHours}h
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
