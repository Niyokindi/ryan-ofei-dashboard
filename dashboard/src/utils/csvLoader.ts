import Papa from 'papaparse';

export interface DiscoTrack {
  title: string;
  streams: number;
}

export interface DailyStream {
  date: string;
  streams: number;
}

export interface SpotifyListener {
  date: string;
  listeners: number;
  change: number;
}

export interface EngagementRate {
  date: string;
  rate: number;
}

export interface FollowerTrend {
  date: string;
  followers: number;
  change: number;
}

export interface TikTokAudience {
  rank: number;
  country: string;
  audience: number;
  percentage: number;
}

export interface TikTokTrack {
  track: string;
  views: number;
  creations: number;
}

function parseNumber(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  return Number(String(val).replace(/,/g, '')) || 0;
}

const MONTH_MAP: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function normalizeDate(raw: string): string {
  const s = raw.trim().replace(/^"|"$/g, '');

  // "Jan 1, 2026" or "Mar 30, 2026"
  const longMatch = s.match(/^(\w{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (longMatch) {
    const [, mon, day, year] = longMatch;
    return `${year}-${MONTH_MAP[mon]}-${day.padStart(2, '0')}`;
  }

  // "01-Jan-26"
  const shortMatch = s.match(/^(\d{1,2})-(\w{3})-(\d{2})$/);
  if (shortMatch) {
    const [, day, mon, yr] = shortMatch;
    const year = Number(yr) < 50 ? `20${yr}` : `19${yr}`;
    return `${year}-${MONTH_MAP[mon]}-${day.padStart(2, '0')}`;
  }

  // Already ISO "2026-03-30"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  return s;
}

async function fetchCSV<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  const text = await res.text();
  const result = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  return result.data as T[];
}

export async function loadDiscoTracks(country: string): Promise<DiscoTrack[]> {
  const fileMap: Record<string, string> = {
    total: 'Total Disco Streams YTD.csv',
    us: 'US Disco Streams YTD.csv',
    uk: 'UK Disco Streams YTD.csv',
    canada: 'Canada Disco Streams YTD.csv',
    nigeria: 'Nigeria Disco Streams YTD.csv',
    sa: 'SA Disco Streams YTD.csv',
  };
  const file = fileMap[country.toLowerCase()];
  if (!file) return [];
  const raw = await fetchCSV<Record<string, string>>(`/data/disco/${file}`);
  return raw
    .filter((r) => r.Title && r.Title.trim() !== '')
    .map((r) => ({ title: r.Title.trim(), streams: parseNumber(r.Streams) }))
    .filter((r) => r.streams > 0)
    .sort((a, b) => b.streams - a.streams);
}

export async function loadAllDiscoTracks(): Promise<Record<string, DiscoTrack[]>> {
  const countries = ['total', 'us', 'uk', 'canada', 'nigeria', 'sa'];
  const entries = await Promise.all(
    countries.map(async (c) => [c, await loadDiscoTracks(c)] as const)
  );
  return Object.fromEntries(entries);
}

export async function loadDailyStreams(country: string): Promise<DailyStream[]> {
  const fileMap: Record<string, string> = {
    us: 'US YTD Streams.csv',
    uk: 'UK YTD Streams.csv',
    canada: 'Canada YTD Streams.csv',
    nigeria: 'Nigeria YTD Streams.csv',
    sa: 'SA YTD Streams.csv',
  };
  const file = fileMap[country.toLowerCase()];
  if (!file) return [];
  const raw = await fetchCSV<Record<string, string>>(`/data/streaming/${file}`);
  return raw
    .map((r) => ({ date: normalizeDate(r.Date), streams: parseNumber(r.Streams) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function loadAllDailyStreams(): Promise<Record<string, DailyStream[]>> {
  const countries = ['us', 'uk', 'canada', 'nigeria', 'sa'];
  const entries = await Promise.all(
    countries.map(async (c) => [c, await loadDailyStreams(c)] as const)
  );
  return Object.fromEntries(entries);
}

export async function loadSpotifyListeners(): Promise<SpotifyListener[]> {
  const raw = await fetchCSV<Record<string, string>>('/data/spotify/Spotify Monthly Listeners Trends.csv');
  return raw
    .map((r) => ({
      date: normalizeDate(r.Date),
      listeners: parseNumber(r.Data),
      change: parseNumber(r.Change),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function loadEngagementRate(platform: 'instagram' | 'tiktok'): Promise<EngagementRate[]> {
  const file =
    platform === 'instagram'
      ? '/data/instagram/Instagram Engagement Rate.csv'
      : '/data/tiktok/Tiktok Engagement Rate.csv';
  const raw = await fetchCSV<Record<string, string>>(file);
  return raw
    .map((r) => ({
      date: normalizeDate(r.Date),
      rate: Math.round(parseNumber(r.Data) * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function loadFollowerTrend(platform: 'instagram' | 'tiktok'): Promise<FollowerTrend[]> {
  const file =
    platform === 'instagram'
      ? '/data/instagram/Instagram Followers Trend.csv'
      : '/data/tiktok/TikTok Followers Trends.csv';
  const raw = await fetchCSV<Record<string, string>>(file);

  const sorted = raw
    .map((r) => ({
      date: normalizeDate(r.Date),
      followers: parseNumber(r.Followers),
      change: r.Change !== undefined ? parseNumber(r.Change) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Compute change for TikTok (no Change column in source)
  if (platform === 'tiktok') {
    for (let i = 1; i < sorted.length; i++) {
      sorted[i].change = sorted[i].followers - sorted[i - 1].followers;
    }
  }

  return sorted;
}

export async function loadTikTokAudience(): Promise<TikTokAudience[]> {
  const raw = await fetchCSV<Record<string, string>>('/data/tiktok/Tiktok Audience and Fanbase.csv');
  return raw.map((r) => ({
    rank: parseNumber(r.Rank),
    country: (r.Country || '').trim(),
    audience: parseNumber(r['Total TikTok Audience']),
    percentage: parseFloat((r['Total % of TikTok Audience'] || '0').replace('%', '')),
  }));
}

export async function loadTikTokTopTracks(): Promise<TikTokTrack[]> {
  const raw = await fetchCSV<Record<string, string>>('/data/tiktok/Tiktok Top Tracks.csv');
  return raw
    .map((r) => ({
      track: (r.Track || '').trim(),
      views: parseNumber(r['Creations Views']),
      creations: parseNumber(r.Creations),
    }))
    .filter((r) => r.track !== '')
    .sort((a, b) => b.views - a.views);
}
