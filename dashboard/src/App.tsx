import Layout, { type Tab } from './components/Layout';
import TopSongsChart from './components/streaming/TopSongsChart';
import DailyStreamsChart from './components/streaming/DailyStreamsChart';
import ConsistencyMetric from './components/streaming/ConsistencyMetric';
import ListenerTrend from './components/streaming/ListenerTrend';
import ConcentrationIndex from './components/streaming/ConcentrationIndex';
import MonthlyRetention from './components/streaming/MonthlyRetention';
import EngagementTrend from './components/social/EngagementTrend';
import FollowerGrowth from './components/social/FollowerGrowth';
import TikTokStreamingFunnel from './components/social/TikTokStreamingFunnel';
import GeoMismatch from './components/social/GeoMismatch';
import FollowerEngagementRatio from './components/social/FollowerEngagementRatio';
import InsightsPanel from './components/insights/InsightsPanel';

function DataSourceFooter() {
  return (
    <footer className="mt-12 border-t border-white/[0.06] pt-6 pb-2 text-center text-xs text-zinc-600">
      Data sourced from <span className="text-zinc-400">Luminate</span> and <span className="text-zinc-400">Chartmetric</span>
    </footer>
  );
}

function StreamingTab() {
  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopSongsChart />
        </div>
        <ListenerTrend />
      </div>
      <DailyStreamsChart />
      <div className="grid gap-8 lg:grid-cols-2">
        <ConsistencyMetric />
        <ConcentrationIndex />
      </div>
      <MonthlyRetention />
      <DataSourceFooter />
    </div>
  );
}

function SocialMediaTab() {
  return (
    <div className="space-y-8">
      <EngagementTrend />
      <FollowerGrowth />
      <FollowerEngagementRatio />
      <div className="grid gap-8 lg:grid-cols-2">
        <TikTokStreamingFunnel />
        <GeoMismatch />
      </div>
      <DataSourceFooter />
    </div>
  );
}

function InsightsTab() {
  return <InsightsPanel />;
}

export default function App() {
  return (
    <Layout>
      {(tab: Tab) => {
        switch (tab) {
          case 'Streaming':
            return <StreamingTab />;
          case 'Social Media':
            return <SocialMediaTab />;
          case 'Insights':
            return <InsightsTab />;
        }
      }}
    </Layout>
  );
}
