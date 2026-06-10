import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMissionStore } from '../store/mission-store';
import { LAUNCH_EPOCH } from '../data/mission-config';

export default function PhotoPanel() {
  const simEpochMs   = useMissionStore((s) => s.timeControl.simEpochMs);
  const milestones   = useMissionStore((s) => s.milestones);
  const photoFilter  = useMissionStore((s) => s.photoFilter);

  const isOrion = (nasaId?: string) => !!nasaId?.startsWith('art002');

  const activePhoto = useMemo(() => {
    const elapsedHours = (simEpochMs - LAUNCH_EPOCH.getTime()) / 3_600_000;
    const candidates = milestones
      .filter((m) => {
        if (!m.photo) return false;
        if (m.showInBoth) return Math.abs(elapsedHours - m.missionElapsedHours) <= 0.5;
        if (photoFilter === 'orion' && !isOrion(m.nasaId)) return false;
        if (photoFilter === 'earth' && isOrion(m.nasaId)) return false;
        return Math.abs(elapsedHours - m.missionElapsedHours) <= 0.5;
      })
      .map((m) => ({ ...m, delta: Math.abs(elapsedHours - m.missionElapsedHours) }))
      .sort((a, b) => a.delta - b.delta);
    return candidates[0] ?? null;
  }, [simEpochMs, milestones, photoFilter]);

  const stem = activePhoto?.photo
    ? activePhoto.photo.replace(/^.*\//, '').replace(/\.[^.]+$/, '')
    : '';

  // Use stored EXIF title if available, otherwise fall back to filename
  const title = activePhoto?.title ?? stem;

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
          <div className="px-3 pt-1.5 pb-1">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-mono text-gray-300 leading-snug line-clamp-2 flex-1">{title}</span>
              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0 mt-0.5">
                {activePhoto.focalLength && (
                  <span className="text-[10px] font-mono text-[#00d4ff]/60">{activePhoto.focalLength}mm</span>
                )}
                <span className="text-[10px] font-mono text-[#00d4ff]/70">
                  T+{activePhoto.missionElapsedHours}h
                </span>
              </div>
            </div>
            {activePhoto.description && (
              <p className="text-[9px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{activePhoto.description}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {expanded && activePhoto && (
        <>
          {/* Backdrop — click outside to dismiss */}
          <div
            className="fixed inset-0 z-[60] bg-black/75 cursor-pointer"
            onClick={() => setExpanded(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[61] flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto max-w-[90vw] max-h-[90vh] flex flex-col relative">
              {/* Close button */}
              <button
                onClick={() => setExpanded(false)}
                className="absolute -top-8 right-0 text-gray-400 hover:text-white transition-colors text-sm font-mono flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                ESC
              </button>
              {/* Image — clicking does NOT dismiss */}
              <img
                src={activePhoto.photo}
                alt={title}
                className="max-w-full max-h-[80vh] object-contain rounded-t-lg border-x border-t border-[rgba(0,212,255,0.3)]"
              />
              {/* Caption bar */}
              <div className="bg-[rgba(10,10,30,0.92)] rounded-b-lg border-x border-b border-[rgba(0,212,255,0.3)] px-4 py-3 max-w-full">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[11px] font-mono text-gray-200 leading-snug flex-1">{title}</span>
                  <div className="flex items-center gap-2 whitespace-nowrap shrink-0 mt-0.5">
                    {activePhoto.focalLength && (
                      <span className="text-[10px] font-mono text-[#00d4ff]/60">{activePhoto.focalLength}mm</span>
                    )}
                    <span className="text-[10px] font-mono text-[#00d4ff]/70">
                      T+{activePhoto.missionElapsedHours}h
                    </span>
                  </div>
                </div>
                {activePhoto.description && (
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed max-h-20 overflow-y-auto">{activePhoto.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
