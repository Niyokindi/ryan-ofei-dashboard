import { useEffect, useState } from 'react';
import Card from '../Card';
import { loadTikTokTopTracks, loadDiscoTracks } from '../../utils/csvLoader';
import { fuzzyMatch, formatNumber } from '../../utils/metrics';

interface FunnelRow {
  track: string;
  tiktokViews: number;
  discoStreams: number;
  conversionRatio: number;
  matched: boolean;
}

export default function TikTokStreamingFunnel() {
  const [rows, setRows] = useState<FunnelRow[]>([]);

  useEffect(() => {
    Promise.all([loadTikTokTopTracks(), loadDiscoTracks('total')]).then(
      ([ttTracks, discoTracks]) => {
        const top8 = ttTracks.slice(0, 8);
        const funnel: FunnelRow[] = top8.map((tt) => {
          const match = discoTracks.find((d) => fuzzyMatch(tt.track, d.title));
          const discoStreams = match?.streams || 0;
          return {
            track: tt.track.length > 35 ? tt.track.slice(0, 32) + '...' : tt.track,
            tiktokViews: tt.views,
            discoStreams,
            conversionRatio: tt.views > 0 ? discoStreams / tt.views : 0,
            matched: !!match,
          };
        });
        setRows(funnel);
      }
    );
  }, []);

  return (
    <Card
      title="TikTok → Streaming Conversion"
      subtitle="Top TikTok tracks vs Disco streaming presence"
      info="Compares top-performing TikTok tracks to their streaming numbers on Disco. The conversion ratio shows what percentage of TikTok views translated into actual streams. Tracks marked 'Opportunity' are popular on TikTok but have no matching Disco presence — these are candidates for distribution or playlist pitching."
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs text-zinc-500">
              <th className="pb-3 pr-3 font-medium">Track</th>
              <th className="pb-3 pr-3 font-medium text-right">TikTok Views</th>
              <th className="pb-3 pr-3 font-medium text-right">Disco Streams</th>
              <th className="pb-3 font-medium text-right">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-white/[0.03] ${
                  !r.matched ? 'bg-amber-500/5' : ''
                }`}
              >
                <td className="py-2.5 pr-3">
                  <span className="font-medium text-zinc-200">{r.track}</span>
                  {!r.matched && (
                    <span className="ml-1.5 rounded-md bg-amber-500/20 px-1 py-0.5 text-[10px] text-amber-400">
                      Opportunity
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-right text-zinc-400">
                  {formatNumber(r.tiktokViews)}
                </td>
                <td className="py-2.5 pr-3 text-right text-zinc-400">
                  {r.discoStreams > 0 ? formatNumber(r.discoStreams) : '—'}
                </td>
                <td className="py-2.5 text-right">
                  {r.matched ? (
                    <span className="text-emerald-400">{(r.conversionRatio * 100).toFixed(1)}%</span>
                  ) : (
                    <span className="text-zinc-600">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
