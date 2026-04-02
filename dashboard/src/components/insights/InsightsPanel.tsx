import { useEffect, useState } from 'react';
import Card from '../Card';
import {
  loadAllDailyStreams,
  loadAllDiscoTracks,
  loadSpotifyListeners,
  loadEngagementRate,
  loadFollowerTrend,
  loadTikTokAudience,
  loadTikTokTopTracks,
} from '../../utils/csvLoader';
import {
  coefficientOfVariation,
  cvLabel,
  linearRegression,
  listenerTrendStrength,
  hhi,
  hhiLabel,
  fuzzyMatch,
  mean,
  rollingCorrelation,
  formatNumber,
} from '../../utils/metrics';
import { COUNTRY_LABELS } from '../../utils/constants';

interface Insight {
  type: 'strength' | 'weakness' | 'opportunity';
  title: string;
  description: string;
}

export default function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    Promise.all([
      loadAllDailyStreams(),
      loadAllDiscoTracks(),
      loadSpotifyListeners(),
      loadEngagementRate('instagram'),
      loadEngagementRate('tiktok'),
      loadFollowerTrend('instagram'),
      loadFollowerTrend('tiktok'),
      loadTikTokAudience(),
      loadTikTokTopTracks(),
    ]).then(
      ([dailyStreams, disco, spotify, igER, ttER, igFollowers, ttFollowers, ttAudience, ttTracks]) => {
        const results: Insight[] = [];

        const countryTotals = Object.entries(dailyStreams).map(([c, d]) => ({
          country: c,
          total: d.reduce((s, v) => s + v.streams, 0),
        }));
        countryTotals.sort((a, b) => b.total - a.total);
        const topMarket = countryTotals[0];
        if (topMarket) {
          results.push({
            type: 'strength',
            title: `${COUNTRY_LABELS[topMarket.country]} Dominates Streaming`,
            description: `The US accounts for ${formatNumber(topMarket.total)} streams YTD, significantly outperforming other markets. This is the primary revenue-generating territory.`,
          });
        }

        const top5ByCountry = Object.entries(disco).map(([c, tracks]) => ({
          country: c,
          top5: tracks.slice(0, 5).map((t) => t.title),
        }));
        const titleCounts: Record<string, number> = {};
        for (const { country, top5 } of top5ByCountry) {
          if (country === 'total') continue;
          for (const t of top5) {
            titleCounts[t] = (titleCounts[t] || 0) + 1;
          }
        }
        const crossMarketHits = Object.entries(titleCounts)
          .filter(([, count]) => count >= 3)
          .sort((a, b) => b[1] - a[1]);
        if (crossMarketHits.length > 0) {
          results.push({
            type: 'strength',
            title: 'Cross-Market Hit Songs',
            description: `${crossMarketHits.map(([t, c]) => `"${t}" (${c} markets)`).join(', ')} appear in the top 5 across multiple countries, indicating broad audience appeal.`,
          });
        }

        const igAvg = mean(igER.map((r) => r.rate));
        const ttAvg = mean(ttER.map((r) => r.rate));
        const bestER = igAvg > ttAvg ? 'Instagram' : 'TikTok';
        const bestERval = Math.max(igAvg, ttAvg);
        results.push({
          type: 'strength',
          title: `Strong ${bestER} Engagement`,
          description: `${bestER} leads with an average engagement rate of ${bestERval.toFixed(2)}%, suggesting an active and responsive audience on this platform.`,
        });

        const totalHHI = hhi((disco.total || []).map((t) => t.streams));
        const { label: hhiLbl } = hhiLabel(totalHHI);
        if (hhiLbl === 'Healthy Spread') {
          results.push({
            type: 'strength',
            title: 'Healthy Catalog Distribution',
            description: `The overall streaming catalog has a low concentration index (HHI: ${totalHHI.toFixed(4)}), meaning streams are well-distributed across multiple songs.`,
          });
        }

        const cvEntries = Object.entries(dailyStreams).map(([c, d]) => ({
          country: c,
          cv: coefficientOfVariation(d.map((s) => s.streams)),
        }));
        cvEntries.sort((a, b) => b.cv - a.cv);
        const mostVolatile = cvEntries[0];
        if (mostVolatile && cvLabel(mostVolatile.cv).label === 'Volatile') {
          results.push({
            type: 'weakness',
            title: `Volatile Streaming in ${COUNTRY_LABELS[mostVolatile.country]}`,
            description: `${COUNTRY_LABELS[mostVolatile.country]} has the highest streaming variability (CV: ${mostVolatile.cv.toFixed(3)}), indicating inconsistent daily performance.`,
          });
        }

        const igSlope = linearRegression(igER.map((r) => r.rate)).slope;
        const ttSlope = linearRegression(ttER.map((r) => r.rate)).slope;
        if (igSlope < -0.001) {
          results.push({
            type: 'weakness',
            title: 'Instagram Engagement Declining',
            description: `Instagram engagement rate shows a downward trend (slope: ${igSlope.toFixed(4)}/day). Content strategy may need refreshing.`,
          });
        }
        if (ttSlope < -0.001) {
          results.push({
            type: 'weakness',
            title: 'TikTok Engagement Declining',
            description: `TikTok engagement rate shows a downward trend (slope: ${ttSlope.toFixed(4)}/day). Consider experimenting with new content formats.`,
          });
        }

        const changes = spotify.map((r) => r.change);
        const { strength } = listenerTrendStrength(changes);
        if (strength === 'Weak') {
          results.push({
            type: 'weakness',
            title: 'Weak Spotify Listener Retention',
            description: `Monthly listener trends show high fluctuation, with many days of listener loss.`,
          });
        }

        for (const [country, tracks] of Object.entries(disco)) {
          if (country === 'total') continue;
          const h = hhi(tracks.map((t) => t.streams));
          const { label } = hhiLabel(h);
          if (label === 'High Concentration') {
            results.push({
              type: 'weakness',
              title: `High Song Dependency in ${COUNTRY_LABELS[country]}`,
              description: `Streaming in ${COUNTRY_LABELS[country]} is heavily concentrated on a few tracks (HHI: ${h.toFixed(4)}).`,
            });
          }
        }

        for (const [platform, fData, eData] of [
          ['Instagram', igFollowers, igER],
          ['TikTok', ttFollowers, ttER],
        ] as const) {
          const rateMap = new Map(eData.map((r) => [r.date, r.rate]));
          const aligned = fData
            .filter((f) => rateMap.has(f.date))
            .map((f) => ({ followers: f.followers, rate: rateMap.get(f.date)! }));
          if (aligned.length > 7) {
            const fChanges = aligned.map((_, i) =>
              i > 0 ? aligned[i].followers - aligned[i - 1].followers : 0
            );
            const rChanges = aligned.map((_, i) =>
              i > 0 ? aligned[i].rate - aligned[i - 1].rate : 0
            );
            const corr = rollingCorrelation(fChanges, rChanges, 7);
            const avg = mean(corr.filter((_, i) => i >= 6));
            if (avg < -0.1) {
              results.push({
                type: 'weakness',
                title: `Hollow ${platform} Growth`,
                description: `On ${platform}, engagement rate drops as followers grow (r=${avg.toFixed(2)}), suggesting low-quality follower acquisition.`,
              });
            }
          }
        }

        const streamCountries = new Set(Object.keys(dailyStreams));
        const countryKeyMap: Record<string, string> = {
          'United States': 'us', 'United Kingdom': 'uk', 'Canada': 'canada',
          'Nigeria': 'nigeria', 'South Africa': 'sa',
        };
        const untapped = ttAudience
          .filter((a) => !countryKeyMap[a.country] || !streamCountries.has(countryKeyMap[a.country]))
          .filter((a) => a.percentage > 1);
        if (untapped.length > 0) {
          results.push({
            type: 'opportunity',
            title: 'Untapped TikTok Markets',
            description: `${untapped.map((u) => `${u.country} (${u.percentage}%)`).join(', ')} have significant TikTok audiences but no tracked streaming data.`,
          });
        }

        const discoTotal = disco.total || [];
        const discoTop = new Set(discoTotal.slice(0, 10).map((t) => t.title));
        const viralNotStreaming = ttTracks
          .slice(0, 10)
          .filter((tt) => !discoTotal.some((d) => fuzzyMatch(tt.track, d.title) && discoTop.has(d.title)));
        if (viralNotStreaming.length > 0) {
          results.push({
            type: 'opportunity',
            title: 'Convert TikTok Virality to Streams',
            description: `Tracks like ${viralNotStreaming.slice(0, 3).map((t) => `"${t.track}" (${formatNumber(t.views)} views)`).join(', ')} are popular on TikTok but not top streaming tracks.`,
          });
        }

        const igGained = igFollowers.length > 1
          ? igFollowers[igFollowers.length - 1].followers - igFollowers[0].followers : 0;
        const ttGained = ttFollowers.length > 1
          ? ttFollowers[ttFollowers.length - 1].followers - ttFollowers[0].followers : 0;
        const igDaily = igGained / Math.max(igFollowers.length - 1, 1);
        const ttDaily = ttGained / Math.max(ttFollowers.length - 1, 1);
        if (Math.abs(igDaily - ttDaily) > 5) {
          const faster = igDaily > ttDaily ? 'Instagram' : 'TikTok';
          const slower = faster === 'Instagram' ? 'TikTok' : 'Instagram';
          results.push({
            type: 'opportunity',
            title: `Double Down on ${faster}`,
            description: `${faster} gains followers at ${Math.round(Math.max(igDaily, ttDaily))}/day vs ${slower} at ${Math.round(Math.min(igDaily, ttDaily))}/day.`,
          });
        }

        const firstMonth = spotify.filter((s) => s.date.startsWith('2026-01'));
        const lastMonth = spotify.filter((s) => s.date.startsWith('2026-03'));
        if (firstMonth.length > 0 && lastMonth.length > 0) {
          const firstAvg = mean(firstMonth.map((s) => s.listeners));
          const lastAvg = mean(lastMonth.map((s) => s.listeners));
          if (lastAvg < firstAvg) {
            results.push({
              type: 'opportunity',
              title: 'Re-engage Lapsed Spotify Listeners',
              description: `Average monthly listeners dropped from ${formatNumber(Math.round(firstAvg))} in January to ${formatNumber(Math.round(lastAvg))} in March.`,
            });
          }
        }

        setInsights(results);
      }
    );
  }, []);

  const strengths = insights.filter((i) => i.type === 'strength');
  const opportunities = insights.filter((i) => i.type === 'opportunity');

  const typeStyles = {
    strength: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-400',
      title: 'text-emerald-400',
    },
    weakness: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      dot: 'bg-red-400',
      title: 'text-red-400',
    },
    opportunity: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      dot: 'bg-amber-400',
      title: 'text-amber-400',
    },
  };

  const renderSection = (
    label: string,
    items: Insight[],
    type: 'strength' | 'weakness' | 'opportunity'
  ) => {
    const styles = typeStyles[type];
    return (
      <div>
        <h3 className="mb-3 text-lg font-semibold text-white">{label}</h3>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${styles.dot}`} />
                <div>
                  <p className={`font-semibold ${styles.title}`}>{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-zinc-600">No {label.toLowerCase()} identified.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-14">
      <Card title="Key Insights" subtitle="Analysis of strengths and opportunities">
        <div className="grid gap-8 lg:grid-cols-2">
          {renderSection('Strengths', strengths, 'strength')}
          {renderSection('Opportunities', opportunities, 'opportunity')}
        </div>
      </Card>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm" style={{ marginTop: 40 }}>
        <h3 className="text-base font-semibold text-white">Summary</h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          The artist's strong DSP performance and rising social engagement present a prime opportunity
          for monetization. By leveraging social media as the primary touchpoint, we can implement a
          D2C strategy that efficiently funnels listeners into loyal customers.
        </p>
      </div>
    </div>
  );
}
