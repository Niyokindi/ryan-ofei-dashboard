import { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../Card';
import { loadSpotifyListeners, type SpotifyListener } from '../../utils/csvLoader';
import {
  listenerTrendStrength,
  strengthColor,
  formatNumber,
  formatPct,
  type TrendStrength,
} from '../../utils/metrics';
import { TOOLTIP_STYLE } from '../../utils/constants';

export default function ListenerTrend() {
  const [data, setData] = useState<SpotifyListener[]>([]);
  const [strength, setStrength] = useState<TrendStrength>('Normal');
  const [cv, setCv] = useState(0);
  const [lossPct, setLossPct] = useState(0);

  useEffect(() => {
    loadSpotifyListeners().then((d) => {
      setData(d);
      const changes = d.map((r) => r.change);
      const result = listenerTrendStrength(changes);
      setStrength(result.strength);
      setCv(result.cv);
      setLossPct(result.lossDayPct);
    });
  }, []);

  const latest = data[data.length - 1];
  const first = data[0];
  const sColor = strengthColor(strength);

  return (
    <Card
      title="Listener Trend Strength"
      subtitle="Spotify monthly listeners stability"
      info="Measures how stable the monthly listener count is over time. 'Strong' means consistent audience retention with few loss days. 'Weak' indicates high day-to-day fluctuation and frequent listener drop-offs. Based on the Coefficient of Variation (CV) of daily listener changes and the percentage of days where listeners declined."
    >
      <div className="flex items-center gap-4">
        <span
          className="rounded-lg px-3.5 py-2 text-lg font-bold"
          style={{ backgroundColor: sColor + '22', color: sColor }}
        >
          {strength}
        </span>
        <div className="space-y-1 text-xs text-zinc-500">
          <p>CV of daily change: {cv.toFixed(2)}</p>
          <p>Loss days: {formatPct(lossPct * 100)}</p>
        </div>
      </div>

      {latest && first && (
        <div className="mt-4 flex gap-6 text-xs text-zinc-500">
          <span>Current: <strong className="text-zinc-200">{formatNumber(latest.listeners)}</strong></span>
          <span>Growth: <strong className="text-emerald-400">+{formatNumber(latest.listeners - first.listeners)}</strong></span>
        </div>
      )}

      <div className="mt-6">
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={data} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="listenerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value: any) => [formatNumber(Number(value)), 'Listeners']}
              labelFormatter={(l: any) => `Date: ${l}`}
            />
            <Area
              type="monotone"
              dataKey="listeners"
              stroke="#818cf8"
              fill="url(#listenerGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
