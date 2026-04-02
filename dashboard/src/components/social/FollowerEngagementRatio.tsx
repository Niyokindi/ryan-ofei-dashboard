import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Card from '../Card';
import {
  loadFollowerTrend,
  loadEngagementRate,
  type FollowerTrend,
  type EngagementRate,
} from '../../utils/csvLoader';
import { rollingCorrelation, mean } from '../../utils/metrics';
import { TOOLTIP_STYLE } from '../../utils/constants';

interface PlatformData {
  merged: { date: string; followers: number; rate: number }[];
  avgCorrelation: number;
  label: string;
}

function alignData(
  followers: FollowerTrend[],
  rates: EngagementRate[]
): { date: string; followers: number; rate: number }[] {
  const rateMap = new Map(rates.map((r) => [r.date, r.rate]));
  return followers
    .filter((f) => rateMap.has(f.date))
    .map((f) => ({
      date: f.date,
      followers: f.followers,
      rate: rateMap.get(f.date)!,
    }));
}

export default function FollowerEngagementRatio() {
  const [ig, setIg] = useState<PlatformData | null>(null);
  const [tt, setTt] = useState<PlatformData | null>(null);

  useEffect(() => {
    Promise.all([
      loadFollowerTrend('instagram'),
      loadEngagementRate('instagram'),
      loadFollowerTrend('tiktok'),
      loadEngagementRate('tiktok'),
    ]).then(([igF, igE, ttF, ttE]) => {
      const process = (
        followers: FollowerTrend[],
        rates: EngagementRate[]
      ): PlatformData => {
        const merged = alignData(followers, rates);
        const fChanges = merged.map((_, i) =>
          i > 0 ? merged[i].followers - merged[i - 1].followers : 0
        );
        const rChanges = merged.map((_, i) =>
          i > 0 ? merged[i].rate - merged[i - 1].rate : 0
        );
        const corr = rollingCorrelation(fChanges, rChanges, 7);
        const validCorr = corr.filter((_, i) => i >= 6);
        const avgCorrelation = mean(validCorr);

        let label: string;
        if (avgCorrelation > 0.1) label = 'Engaged Audience';
        else if (avgCorrelation < -0.1) label = 'Hollow Growth';
        else label = 'Neutral';

        return { merged, avgCorrelation, label };
      };

      setIg(process(igF, igE));
      setTt(process(ttF, ttE));
    });
  }, []);

  const corrColor = (avg: number) =>
    avg > 0.1 ? '#34d399' : avg < -0.1 ? '#f87171' : '#fbbf24';

  const renderPlatform = (
    label: string,
    data: PlatformData | null,
    followerColor: string,
    rateColor: string
  ) => {
    if (!data) return null;
    return (
      <div className="flex-1">
        <div className="mb-5 flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-200">{label}</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: corrColor(data.avgCorrelation) + '22', color: corrColor(data.avgCorrelation) }}
          >
            {data.label}
          </span>
          <span className="text-xs text-zinc-600">
            r = {data.avgCorrelation.toFixed(2)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.merged} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" fontSize={9} stroke="#525252" tickFormatter={(d: string) => d.slice(5)} interval={8} />
            <YAxis yAxisId="left" fontSize={9} orientation="left" stroke={followerColor} />
            <YAxis yAxisId="right" fontSize={9} orientation="right" stroke={rateColor} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [
                name === 'followers' ? value.toLocaleString() : `${value.toFixed(2)}%`,
                name === 'followers' ? 'Followers' : 'Engagement Rate',
              ]}
            />
            <Line yAxisId="left" type="monotone" dataKey="followers" stroke={followerColor} strokeWidth={2} dot={false} name="followers" />
            <Line yAxisId="right" type="monotone" dataKey="rate" stroke={rateColor} strokeWidth={2} dot={false} name="rate" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card
      title="Follower-to-Engagement Ratio"
      subtitle="Are new followers engaged or hollow?"
      info="Measures whether new followers actually interact with content. A positive correlation (r > 0.1) means follower growth comes with rising engagement — 'Engaged Audience.' A negative correlation (r < −0.1) signals followers are growing but engagement is dropping — 'Hollow Growth.' Neutral means no clear relationship."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {renderPlatform('Instagram', ig, '#f472b6', '#a78bfa')}
        {renderPlatform('TikTok', tt, '#e2e8f0', '#22d3ee')}
      </div>
    </Card>
  );
}
