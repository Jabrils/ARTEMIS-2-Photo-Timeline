import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMissionStore } from '../store/mission-store';
import type { ChatPart } from '../hooks/useChat';

const LAUNCH_EPOCH_MS = Date.UTC(2026, 3, 1, 22, 35, 0);

interface Props {
  part: Extract<ChatPart, { type: 'chart' }>;
}

export default function ChatChart({ part }: Props) {
  const oemData = useMissionStore((s) => s.oemData);

  const chartData = useMemo(() => {
    if (!oemData || oemData.length === 0) return [];

    // Sample every 20th point for performance
    const sampled = [];
    for (let i = 0; i < oemData.length; i += 20) {
      const v = oemData[i];
      const metHours = (v.epochMs - LAUNCH_EPOCH_MS) / 3600000;
      let value: number;

      switch (part.chartType) {
        case 'velocity':
          value = Math.sqrt(v.vx ** 2 + v.vy ** 2 + v.vz ** 2) * 3600; // km/h
          break;
        case 'earth-distance':
        default:
          value = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2); // km
          break;
      }

      sampled.push({
        met: `${metHours.toFixed(0)}h`,
        metHours,
        value: Math.round(value),
      });
    }
    return sampled;
  }, [oemData, part.chartType]);

  if (chartData.length === 0) {
    return <div className="text-gray-400 text-xs my-2">Loading trajectory data...</div>;
  }

  const unit = part.chartType === 'velocity' ? 'km/h' : 'km';
  const color = part.chartType === 'velocity' ? '#ff8c00' : '#00d4ff';

  return (
    <div className="my-2 bg-[rgba(0,0,0,0.3)] rounded-lg p-2">
      <div className="text-[10px] text-gray-400 mb-1">{part.title}</div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="met"
            tick={{ fontSize: 9, fill: '#666' }}
            interval={Math.floor(chartData.length / 5)}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#666' }}
            width={55}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
          />
          <Tooltip
            contentStyle={{ background: '#0a0a1a', border: '1px solid #00d4ff33', fontSize: 11 }}
            labelStyle={{ color: '#888' }}
            formatter={(v) => [`${Number(v).toLocaleString()} ${unit}`, part.title]}
          />
          <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
