import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Card from '../Card';
import { loadEngagementRate, type EngagementRate } from '../../utils/csvLoader';
import { linearRegression } from '../../utils/metrics';
import { TOOLTIP_STYLE } from '../../utils/constants';

interface MergedRow {
  date: string;
  instagram?: number;
  tiktok?: number;
}

interface SlopeInfo {
  slope: number;
  avg: number;
  trending: 'up' | 'down' | 'flat';
}

export default function EngagementTrend() {
  const [data, setData] = useState<MergedRow[]>([]);
  const [igSlope, setIgSlope] = useState<SlopeInfo | null>(null);
  const [ttSlope, setTtSlope] = useState<SlopeInfo | null>(null);

  useEffect(() => {
    Promise.all([
      loadEngagementRate('instagram'),
      loadEngagementRate('tiktok'),
    ]).then(([ig, tt]) => {
      const dateMap = new Map<string, MergedRow>();

      for (const r of ig) {
        if (!dateMap.has(r.date)) dateMap.set(r.date, { date: r.date });
        dateMap.get(r.date)!.instagram = r.rate;
      }
      for (const r of tt) {
        if (!dateMap.has(r.date)) dateMap.set(r.date, { date: r.date });
        dateMap.get(r.date)!.tiktok = r.rate;
      }

      const merged = [...dateMap.values()].sort((a, b) => a.date.localeCompare(b.date));
      setData(merged);

      const igVals = ig.map((r) => r.rate);
      const ttVals = tt.map((r) => r.rate);
      const igReg = linearRegression(igVals);
      const ttReg = linearRegression(ttVals);
      const igAvg = igVals.reduce((s, v) => s + v, 0) / igVals.length;
      const ttAvg = ttVals.reduce((s, v) => s + v, 0) / ttVals.length;

      setIgSlope({
        slope: igReg.slope, avg: igAvg,
        trending: igReg.slope > 0.001 ? 'up' : igReg.slope < -0.001 ? 'down' : 'flat',
      });
      setTtSlope({
        slope: ttReg.slope, avg: ttAvg,
        trending: ttReg.slope > 0.001 ? 'up' : ttReg.slope < -0.001 ? 'down' : 'flat',
      });
    });
  }, []);

  const trendIcon = (t: 'up' | 'down' | 'flat') =>
    t === 'up' ? '↑' : t === 'down' ? '↓' : '→';

  const trendColor = (t: 'up' | 'down' | 'flat') =>
    t === 'up' ? 'text-emerald-400' : t === 'down' ? 'text-red-400' : 'text-zinc-500';

  return (
    <Card title="Engagement Rate Trend" subtitle="Instagram vs TikTok engagement over time">
      <div className="mb-7 grid grid-cols-2 gap-4">
        {igSlope && (
          <div className="rounded-xl border border-pink-500/20 bg-pink-500/10 p-5">
            <p className="text-xs font-medium text-zinc-400">Instagram</p>
            <p className="mt-2 text-2xl font-bold text-pink-400">{igSlope.avg.toFixed(2)}%</p>
            <p className={`text-xs font-medium ${trendColor(igSlope.trending)}`}>
              {trendIcon(igSlope.trending)} Trending {igSlope.trending === 'up' ? 'Up' : igSlope.trending === 'down' ? 'Down' : 'Flat'}
              <span className="ml-1 text-zinc-600">({igSlope.slope > 0 ? '+' : ''}{igSlope.slope.toFixed(4)}/day)</span>
            </p>
          </div>
        )}
        {ttSlope && (
          <div className="rounded-xl bg-white/[0.03] p-5">
            <p className="text-xs font-medium text-zinc-400">TikTok</p>
            <p className="mt-2 text-2xl font-bold text-zinc-100">{ttSlope.avg.toFixed(2)}%</p>
            <p className={`text-xs font-medium ${trendColor(ttSlope.trending)}`}>
              {trendIcon(ttSlope.trending)} Trending {ttSlope.trending === 'up' ? 'Up' : ttSlope.trending === 'down' ? 'Down' : 'Flat'}
              <span className="ml-1 text-zinc-600">({ttSlope.slope > 0 ? '+' : ''}{ttSlope.slope.toFixed(4)}/day)</span>
            </p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" fontSize={10} stroke="#525252" tickFormatter={(d: string) => d.slice(5)} interval={6} />
          <YAxis fontSize={10} stroke="#525252" />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}%`,
              name === 'instagram' ? 'Instagram' : 'TikTok',
            ]}
          />
          <Line type="monotone" dataKey="instagram" stroke="#f472b6" strokeWidth={2} dot={false} connectNulls name="instagram" />
          <Line type="monotone" dataKey="tiktok" stroke="#e2e8f0" strokeWidth={2} dot={false} connectNulls name="tiktok" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
