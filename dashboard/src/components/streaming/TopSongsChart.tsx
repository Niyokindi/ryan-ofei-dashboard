import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import Card from '../Card';
import { loadAllDiscoTracks, type DiscoTrack } from '../../utils/csvLoader';
import { formatNumber, formatPct } from '../../utils/metrics';
import { CHART_COLORS, COUNTRY_LABELS, TOOLTIP_STYLE } from '../../utils/constants';

const COUNTRIES = ['total', 'us', 'uk', 'canada', 'nigeria', 'sa'];

export default function TopSongsChart() {
  const [data, setData] = useState<Record<string, DiscoTrack[]>>({});
  const [country, setCountry] = useState('total');

  useEffect(() => {
    loadAllDiscoTracks().then(setData);
  }, []);

  const tracks = data[country] || [];
  const totalStreams = tracks.reduce((s, t) => s + t.streams, 0);
  const top5 = tracks.slice(0, 5);
  const top5Total = top5.reduce((s, t) => s + t.streams, 0);
  const otherTotal = totalStreams - top5Total;

  const barData = top5.map((t) => ({
    name: t.title.length > 25 ? t.title.slice(0, 22) + '...' : t.title,
    fullName: t.title,
    streams: t.streams,
    pct: totalStreams > 0 ? (t.streams / totalStreams) * 100 : 0,
  }));

  const pieData = [
    ...top5.map((t, i) => ({
      name: t.title.length > 20 ? t.title.slice(0, 17) + '...' : t.title,
      fullName: t.title,
      value: t.streams,
      pct: totalStreams > 0 ? (t.streams / totalStreams) * 100 : 0,
      color: CHART_COLORS[i],
    })),
    {
      name: 'Other',
      fullName: 'Other',
      value: otherTotal,
      pct: totalStreams > 0 ? (otherTotal / totalStreams) * 100 : 0,
      color: '#27272a',
    },
  ];

  return (
    <Card title="Top 5 Songs by Streams" subtitle="Catalog breakdown by country">
      <div className="mb-6">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition-colors hover:bg-white/10"
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c} className="bg-zinc-900">{COUNTRY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 60 }}>
              <XAxis type="number" tickFormatter={(v: number) => formatNumber(v)} fontSize={11} stroke="#525252" />
              <YAxis type="category" dataKey="name" width={140} fontSize={11} tick={{ fill: '#a1a1aa' }} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value: any) => [Number(value).toLocaleString(), 'Streams']}
                labelFormatter={(label: any) => {
                  const item = barData.find((d) => d.name === label);
                  return item?.fullName || String(label);
                }}
              />
              <Bar dataKey="streams" radius={[0, 6, 6, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                paddingAngle={2}
                stroke="none"
                label={(props: any) => (
                  <text x={props.x} y={props.y} fill={props.fill} fontSize={12} fontWeight={600} textAnchor="middle" dominantBaseline="central">
                    {`${Number(props.pct).toFixed(1)}%`}
                  </text>
                )}
                labelLine={false}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(_: any, __: any, props: any) => [
                  formatPct(props.payload.pct),
                  props.payload.fullName,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
