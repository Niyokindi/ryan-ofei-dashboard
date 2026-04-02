export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function coefficientOfVariation(values: number[]): number {
  const m = mean(values);
  if (m === 0) return 0;
  return stddev(values) / Math.abs(m);
}

export function cvLabel(cv: number): { label: string; color: string } {
  if (cv < 0.1) return { label: 'Very Steady', color: '#10b981' };
  if (cv < 0.2) return { label: 'Moderate', color: '#f59e0b' };
  return { label: 'Volatile', color: '#ef4444' };
}

export function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
    sumY2 += values[i] * values[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const ssRes = values.reduce((s, v, i) => s + (v - (intercept + slope * i)) ** 2, 0);
  const ssTot = values.reduce((s, v) => s + (v - sumY / n) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

export type TrendStrength = 'Strong' | 'Normal' | 'Weak';

export function listenerTrendStrength(changes: number[]): {
  strength: TrendStrength;
  cv: number;
  lossDayPct: number;
} {
  const cv = coefficientOfVariation(changes.map(Math.abs));
  const lossDays = changes.filter((c) => c < 0).length;
  const lossDayPct = changes.length > 0 ? lossDays / changes.length : 0;

  let strength: TrendStrength;
  if (cv < 0.5 && lossDayPct < 0.25) {
    strength = 'Strong';
  } else if (cv > 1.5 || lossDayPct > 0.5) {
    strength = 'Weak';
  } else {
    strength = 'Normal';
  }

  return { strength, cv, lossDayPct };
}

export function strengthColor(s: TrendStrength): string {
  if (s === 'Strong') return '#10b981';
  if (s === 'Normal') return '#f59e0b';
  return '#ef4444';
}

/** Herfindahl-Hirschman Index: sum of squared shares */
export function hhi(values: number[]): number {
  const total = values.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  return values.reduce((s, v) => s + (v / total) ** 2, 0);
}

export function hhiLabel(h: number): { label: string; color: string } {
  if (h < 0.05) return { label: 'Healthy Spread', color: '#10b981' };
  if (h < 0.15) return { label: 'Moderate', color: '#f59e0b' };
  return { label: 'High Concentration', color: '#ef4444' };
}

export function monthOverMonthRetention(
  data: { date: string; value: number }[]
): { month: string; avg: number; retention: number | null }[] {
  const byMonth: Record<string, number[]> = {};
  for (const d of data) {
    const month = d.date.slice(0, 7); // "2026-01"
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(d.value);
  }

  const months = Object.keys(byMonth).sort();
  return months.map((m, i) => {
    const avg = mean(byMonth[m]);
    const prevAvg = i > 0 ? mean(byMonth[months[i - 1]]) : null;
    const retention = prevAvg !== null && prevAvg !== 0 ? (avg / prevAvg) * 100 : null;
    return { month: m, avg, retention };
  });
}

export function rollingCorrelation(
  xs: number[],
  ys: number[],
  window: number = 7
): number[] {
  const n = Math.min(xs.length, ys.length);
  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i < window - 1) {
      result.push(0);
      continue;
    }
    const xWin = xs.slice(i - window + 1, i + 1);
    const yWin = ys.slice(i - window + 1, i + 1);
    const mx = mean(xWin);
    const my = mean(yWin);
    let num = 0, denX = 0, denY = 0;
    for (let j = 0; j < window; j++) {
      const dx = xWin[j] - mx;
      const dy = yWin[j] - my;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    result.push(den === 0 ? 0 : num / den);
  }
  return result;
}

/** Simple fuzzy title matching: normalize and check inclusion */
export function fuzzyMatch(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  // Check first significant word match for short titles
  const wordsA = na.split(' ').filter((w) => w.length > 2);
  const wordsB = nb.split(' ').filter((w) => w.length > 2);
  if (wordsA.length === 1 && wordsB.some((w) => w === wordsA[0])) return true;
  if (wordsB.length === 1 && wordsA.some((w) => w === wordsB[0])) return true;

  return false;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}
