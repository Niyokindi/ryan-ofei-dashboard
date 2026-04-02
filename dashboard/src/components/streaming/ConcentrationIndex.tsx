import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import Card from '../Card';
import { loadAllDiscoTracks } from '../../utils/csvLoader';
import { hhi, hhiLabel } from '../../utils/metrics';
import { COUNTRY_LABELS, TOOLTIP_STYLE } from '../../utils/constants';

interface HHIEntry {
  name: string;
  country: string;
  hhi: number;
  color: string;
  label: string;
}

export default function ConcentrationIndex() {
  const [entries, setEntries] = useState<HHIEntry[]>([]);

  useEffect(() => {
    loadAllDiscoTracks().then((data) => {
      const results: HHIEntry[] = Object.entries(data).map(([country, tracks]) => {
        const streams = tracks.map((t) => t.streams);
        const h = hhi(streams);
        const { label, color } = hhiLabel(h);
        return {
          name: COUNTRY_LABELS[country] || country,
          country,
          hhi: h,
          color,
          label,
        };
      });
      results.sort((a, b) => b.hhi - a.hhi);
      setEntries(results);
    });
  }, []);

  return (
    <Card
      title="Catalog Concentration (HHI)"
      subtitle="How dependent are streams on top songs?"
      info="The Herfindahl-Hirschman Index (HHI) measures how concentrated streams are across the catalog. A low HHI (< 0.05) means streams are spread across many songs — a healthy, resilient catalog. A high HHI (> 0.15) means a few hit songs dominate, which is risky if those tracks lose traction. Each bar represents a country or the total."
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={entries} margin={{ left: 10, right: 10 }}>
          <XAxis dataKey="name" fontSize={10} stroke="#525252" />
          <YAxis fontSize={10} stroke="#525252" domain={[0, 'auto']} />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value: any) => [Number(value).toFixed(4), 'HHI']}
          />
          <ReferenceLine y={0.05} stroke="#fbbf2466" strokeDasharray="3 3" />
          <ReferenceLine y={0.15} stroke="#f8717166" strokeDasharray="3 3" />
          <Bar dataKey="hhi" radius={[6, 6, 0, 0]}>
            {entries.map((e, i) => (
              <Cell key={i} fill={e.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
