import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import Card from '../Card';
import { loadTikTokAudience, loadAllDiscoTracks } from '../../utils/csvLoader';
import { TOOLTIP_STYLE } from '../../utils/constants';

interface GeoRow {
  country: string;
  tiktokPct: number;
  streamPct: number;
  untapped: boolean;
}

const COUNTRY_MAP: Record<string, string> = {
  'United States': 'us',
  'United Kingdom': 'uk',
  'Canada': 'canada',
  'Nigeria': 'nigeria',
  'South Africa': 'sa',
};

export default function GeoMismatch() {
  const [rows, setRows] = useState<GeoRow[]>([]);

  useEffect(() => {
    Promise.all([loadTikTokAudience(), loadAllDiscoTracks()]).then(
      ([audience, disco]) => {
        const totalDiscoStreams = (disco.total || []).reduce((s, t) => s + t.streams, 0);

        const countryStreamTotals: Record<string, number> = {};
        for (const [c, tracks] of Object.entries(disco)) {
          if (c === 'total') continue;
          countryStreamTotals[c] = tracks.reduce((s, t) => s + t.streams, 0);
        }

        const geoRows: GeoRow[] = audience.map((a) => {
          const streamKey = COUNTRY_MAP[a.country];
          const streamTotal = streamKey ? countryStreamTotals[streamKey] || 0 : 0;
          const streamPct = totalDiscoStreams > 0 ? (streamTotal / totalDiscoStreams) * 100 : 0;
          return {
            country: a.country,
            tiktokPct: a.percentage,
            streamPct,
            untapped: !streamKey || streamTotal === 0,
          };
        });

        geoRows.sort((a, b) => b.tiktokPct - a.tiktokPct);
        setRows(geoRows);
      }
    );
  }, []);

  return (
    <Card
      title="Geographic Audience Mismatch"
      subtitle="TikTok audience share vs streaming market share"
      info="Highlights gaps between where the TikTok audience lives and where streaming revenue comes from. Countries with high TikTok share but low streaming share represent untapped markets — places where social buzz hasn't yet converted to streams. Yellow bars indicate countries with TikTok presence but no matching streaming data."
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" fontSize={10} stroke="#525252" tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="country" width={100} fontSize={10} tick={{ fill: '#a1a1aa' }} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
          <Bar dataKey="tiktokPct" name="TikTok Audience %" barSize={10} radius={[0, 4, 4, 0]}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.untapped ? '#fbbf24' : '#a1a1aa'} />
            ))}
          </Bar>
          <Bar dataKey="streamPct" name="Streaming Share %" fill="#818cf8" barSize={10} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
