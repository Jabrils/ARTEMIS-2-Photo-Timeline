import { motion } from 'framer-motion';
import { useMission } from '../hooks/useMission';

export default function ProgressBar() {
  const { progress } = useMission();

  return (
    <div className="bg-[rgba(10,10,30,0.7)] backdrop-blur-sm border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 min-w-[140px]">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Mission Progress</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#ff8c00] to-[#00d4ff]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <span className="text-sm font-mono text-hud-blue font-bold">
          {progress.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
