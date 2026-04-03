import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface TelemetryCardProps {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  color?: string;
}

export default function TelemetryCard({ label, value, unit, decimals = 0, color = '#00d4ff' }: TelemetryCardProps) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) =>
    v.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <div className="bg-[rgba(10,10,30,0.7)] backdrop-blur-sm border border-[rgba(0,212,255,0.2)] rounded-lg px-4 py-3 min-w-[140px]">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <motion.span
          className="text-xl font-bold font-mono"
          style={{ color }}
        >
          {display}
        </motion.span>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
    </div>
  );
}
