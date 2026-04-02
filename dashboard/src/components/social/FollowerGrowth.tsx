import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Card from '../Card';
import { loadFollowerTrend, type FollowerTrend } from '../../utils/csvLoader';
import { formatNumber } from '../../utils/metrics';
import { TOOLTIP_STYLE } from '../../utils/constants';

interface PlatformStats {
  platform: string;
  first: number;
  last: number;
  gained: number;
  days: number;
  dailyRate: number;
}

interface MergedRow {
  date: string;
  instagram?: number;
  tiktok?: number;
}

export default function FollowerGrowth() {
  const [data, setData] = useState<MergedRow[]>([]);
  const [igStats, setIgStats] = useState<PlatformStats | null>(null);
  const [ttStats, setTtStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    Promise.all([
      loadFollowerTrend('instagram'),
      loadFollowerTrend('tiktok'),
    ]).then(([ig, tt]) => {
      const computeStats = (d: FollowerTrend[], name: string): PlatformStats => {
        const first = d[0]?.followers || 0;
        const last = d[d.length - 1]?.followers || 0;
        const gained = last - first;
        const days = d.length > 1 ? d.length - 1 : 1;
        return { platform: name, first, last, gained, days, dailyRate: gained / days };
      };

      setIgStats(computeStats(ig, 'Instagram'));
      setTtStats(computeStats(tt, 'TikTok'));

      const dateMap = new Map<string, MergedRow>();
      for (const r of ig) {
        if (!dateMap.has(r.date)) dateMap.set(r.date, { date: r.date });
        dateMap.get(r.date)!.instagram = r.followers;
      }
      for (const r of tt) {
        if (!dateMap.has(r.date)) dateMap.set(r.date, { date: r.date });
        dateMap.get(r.date)!.tiktok = r.followers;
      }
      setData([...dateMap.values()].sort((a, b) => a.date.localeCompare(b.date)));
    });
  }, []);

  const winner =
    igStats && ttStats
      ? igStats.dailyRate > ttStats.dailyRate
        ? 'Instagram'
        : 'TikTok'
      : null;

  return (
    <Card title="Follower Growth Comparison" subtitle="Instagram vs TikTok follower trajectory">
      <div className="mb-7 grid grid-cols-2 gap-4">
        {igStats && (
          <div className={`rounded-xl p-5 ${winner === 'Instagram' ? 'border border-pink-500/20 bg-pink-500/10' : 'bg-white/[0.03]'}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Instagram</p>
              {winner === 'Instagram' && (
                <span className="rounded-md bg-pink-500/20 px-1.5 py-0.5 text-[10px] font-medium text-pink-400">
                  Faster Growth
                </span>
              )}
            </div>
            <p className="mt-2 text-2xl font-bold text-pink-400">{formatNumber(igStats.last)}</p>
            <p className="text-xs text-emerald-400">
              +{formatNumber(igStats.gained)} total ({formatNumber(Math.round(igStats.dailyRate))}/day)
            </p>
          </div>
        )}
        {ttStats && (
          <div className={`rounded-xl p-5 ${winner === 'TikTok' ? 'border border-white/10 bg-white/[0.06]' : 'bg-white/[0.03]'}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">TikTok</p>
              {winner === 'TikTok' && (
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                  Faster Growth
                </span>
              )}
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-100">{formatNumber(ttStats.last)}</p>
            <p className="text-xs text-emerald-400">
              +{formatNumber(ttStats.gained)} total ({formatNumber(Math.round(ttStats.dailyRate))}/day)
            </p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" fontSize={10} stroke="#525252" tickFormatter={(d: string) => d.slice(5)} interval={6} />
          <YAxis fontSize={10} stroke="#525252" tickFormatter={(v: number) => formatNumber(v)} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value: any, name: any) => [
              Number(value).toLocaleString(),
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
