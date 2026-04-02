import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Card from '../Card';
import { loadAllDailyStreams, type DailyStream } from '../../utils/csvLoader';
import { formatNumber, mean } from '../../utils/metrics';
import { COUNTRY_COLORS, COUNTRY_LABELS, TOOLTIP_STYLE } from '../../utils/constants';

const COUNTRIES = ['us', 'uk', 'canada', 'nigeria', 'sa'] as const;

interface MergedRow {
  date: string;
  [key: string]: number | string;
}

export default function DailyStreamsChart() {
  const [data, setData] = useState<Record<string, DailyStream[]>>({});
  const [visible, setVisible] = useState<Set<string>>(new Set(COUNTRIES));

  useEffect(() => {
    loadAllDailyStreams().then(setData);
  }, []);

  const allDates = new Set<string>();
  for (const streams of Object.values(data)) {
    for (const s of streams) allDates.add(s.date);
  }
  const dates = [...allDates].sort();

  const merged: MergedRow[] = dates.map((date) => {
    const row: MergedRow = { date };
    for (const c of COUNTRIES) {
      const entry = (data[c] || []).find((d) => d.date === date);
      row[c] = entry?.streams ?? 0;
    }
    return row;
  });

  const toggle = (c: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  return (
    <Card title="Daily Streams by Country" subtitle="YTD daily streaming performance across markets">
      <div className="mb-6 grid gap-4 sm:grid-cols-5">
        {COUNTRIES.map((c) => {
          const streams = (data[c] || []).map((s) => s.streams).filter((v) => v > 0);
          if (streams.length === 0) return null;
          const avg = mean(streams);
          const min = Math.min(...streams);
          const max = Math.max(...streams);
          return (
            <div
              key={c}
              className="rounded-xl border bg-white/[0.02] p-4"
              style={{ borderColor: COUNTRY_COLORS[c] + '30' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COUNTRY_COLORS[c] }}
                />
                <span className="text-xs font-medium text-zinc-400">{COUNTRY_LABELS[c]}</span>
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">avg daily streams</p>
              <p className="text-lg font-bold text-white">{formatNumber(Math.round(avg))}</p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Low: <strong className="text-zinc-300">{formatNumber(min)}</strong></span>
                <span>High: <strong className="text-zinc-300">{formatNumber(max)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {COUNTRIES.map((c) => (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              visible.has(c)
                ? 'text-white'
                : 'bg-white/5 text-zinc-600'
            }`}
            style={visible.has(c) ? { backgroundColor: COUNTRY_COLORS[c] + '22', color: COUNTRY_COLORS[c], border: `1px solid ${COUNTRY_COLORS[c]}44` } : undefined}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: COUNTRY_COLORS[c] }}
            />
            {COUNTRY_LABELS[c]}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={merged} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            fontSize={10}
            stroke="#525252"
            tickFormatter={(d: string) => d.slice(5)}
            interval={6}
          />
          <YAxis fontSize={10} stroke="#525252" tickFormatter={(v: number) => formatNumber(v)} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              COUNTRY_LABELS[name] || name,
            ]}
            labelFormatter={(label: string) => `Date: ${label}`}
          />
          {COUNTRIES.map((c) =>
            visible.has(c) ? (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                stroke={COUNTRY_COLORS[c]}
                strokeWidth={2}
                dot={false}
                name={c}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
