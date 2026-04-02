import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import Card from '../Card';
import { loadSpotifyListeners } from '../../utils/csvLoader';
import { monthOverMonthRetention, formatNumber, formatPct } from '../../utils/metrics';
import { TOOLTIP_STYLE } from '../../utils/constants';

const MONTH_NAMES: Record<string, string> = {
  '2026-01': 'January', '2026-02': 'February', '2026-03': 'March',
  '2026-04': 'April', '2026-05': 'May', '2026-06': 'June',
};

interface RetEntry {
  month: string;
  name: string;
  avg: number;
  retention: number | null;
}

export default function MonthlyRetention() {
  const [entries, setEntries] = useState<RetEntry[]>([]);

  useEffect(() => {
    loadSpotifyListeners().then((data) => {
      const result = monthOverMonthRetention(
        data.map((d) => ({ date: d.date, value: d.listeners }))
      );
      setEntries(
        result.map((r) => ({
          ...r,
          name: MONTH_NAMES[r.month] || r.month,
        }))
      );
    });
  }, []);

  const retentionData = entries
    .filter((e) => e.retention !== null)
    .map((e) => ({
      name: e.name,
      retention: Math.round((e.retention as number) * 100) / 100,
    }));

  return (
    <Card
      title="Monthly Listener Retention"
      subtitle="Spotify month-over-month audience retention"
      info="Tracks how well Spotify monthly listeners are retained from one month to the next. A retention above 100% means the audience grew, while below 100% means listeners dropped off. Consistent retention above 100% signals healthy, sustainable growth. The bar chart highlights growth months in green and decline months in red."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {entries.map((e) => (
          <div key={e.month} className="rounded-xl bg-white/[0.03] p-5 text-center">
            <p className="text-xs text-zinc-500">{e.name}</p>
            <p className="mt-2 text-xl font-bold text-white">
              {formatNumber(Math.round(e.avg))}
            </p>
            {e.retention !== null && (
              <p className={`mt-1.5 text-xs font-medium ${e.retention >= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                {e.retention >= 100 ? '+' : ''}{formatPct(e.retention - 100)} MoM
              </p>
            )}
          </div>
        ))}
      </div>

      {retentionData.length > 0 && (
        <div className="mt-7">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={retentionData} margin={{ left: 10, right: 10 }}>
              <XAxis dataKey="name" fontSize={10} stroke="#525252" />
              <YAxis fontSize={10} stroke="#525252" domain={[95, 'auto']} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Retention']}
              />
              <ReferenceLine y={100} stroke="#525252" strokeDasharray="3 3" />
              <Bar dataKey="retention" radius={[6, 6, 0, 0]}>
                {retentionData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.retention >= 100 ? '#34d399' : '#f87171'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
