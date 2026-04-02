import { useEffect, useState } from 'react';
import Card from '../Card';
import { loadAllDailyStreams } from '../../utils/csvLoader';
import { coefficientOfVariation, cvLabel } from '../../utils/metrics';
import { COUNTRY_LABELS } from '../../utils/constants';

interface CVEntry {
  country: string;
  label: string;
  cv: number;
  color: string;
  isSteadiest: boolean;
}

export default function ConsistencyMetric() {
  const [entries, setEntries] = useState<CVEntry[]>([]);

  useEffect(() => {
    loadAllDailyStreams().then((data) => {
      const cvs = Object.entries(data).map(([country, streams]) => {
        const values = streams.map((s) => s.streams);
        const cv = coefficientOfVariation(values);
        const { label, color } = cvLabel(cv);
        return { country, label, cv, color, isSteadiest: false };
      });
      cvs.sort((a, b) => a.cv - b.cv);
      if (cvs.length > 0) cvs[0].isSteadiest = true;
      setEntries(cvs);
    });
  }, []);

  return (
    <Card
      title="Streaming Consistency"
      subtitle="Coefficient of Variation — lower = steadier"
      info="Ranks countries by how consistent their daily stream counts are. Uses the Coefficient of Variation (CV) — the ratio of standard deviation to mean. A lower CV means the daily streams stay close to the average with minimal spikes or drops. 'Very Steady' (CV < 0.10), 'Moderate' (0.10–0.20), 'Volatile' (> 0.20)."
    >
      <div className="space-y-3">
        {entries.map((e) => (
          <div
            key={e.country}
            className={`flex items-center justify-between rounded-xl px-5 py-4 text-sm ${
              e.isSteadiest
                ? 'border border-emerald-500/20 bg-emerald-500/10'
                : 'bg-white/[0.03]'
            }`}
          >
            <span className="font-medium text-zinc-200">
              {COUNTRY_LABELS[e.country]}
              {e.isSteadiest && (
                <span className="ml-2 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400">
                  Steadiest
                </span>
              )}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">{e.cv.toFixed(3)}</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: e.color + '22', color: e.color }}
              >
                {e.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
