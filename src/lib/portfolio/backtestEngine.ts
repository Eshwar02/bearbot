/**
 * Portfolio Backtest Engine
 *
 * Pure computation module — no Supabase, no UI, no auth.
 * Accepts holdings + date range, fetches historical OHLCV via yahoo.chart,
 * aligns all symbols on a shared date index, and computes performance metrics.
 */

import { yahoo } from "@/lib/stock/yahoo";

// ── Input / Output Types ─────────────────────────────────────────────

export interface BacktestHolding {
  symbol: string;
  quantity: number;
}

export interface EquityPoint {
  date: string; // ISO date string  "YYYY-MM-DD"
  value: number;
}

export interface BacktestMetrics {
  totalReturn: number;     // e.g. 0.35 = 35%
  cagr: number;            // annualised, e.g. 0.18 = 18%
  maxDrawdown: number;     // e.g. -0.12 = -12%
  volatility: number;      // annualised std-dev of daily returns
}

export interface BacktestResult {
  equityCurve: EquityPoint[];
  metrics: BacktestMetrics;
}

// ── In-memory cache (keyed by "symbol|period1|period2") ──────────────

const _priceCache = new Map<string, Map<string, number>>();

function cacheKey(symbol: string, p1: Date, p2: Date): string {
  return `${symbol}|${p1.toISOString()}|${p2.toISOString()}`;
}

// ── Helper: date → "YYYY-MM-DD" ──────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Fetch historical closes for one symbol, return date→close map ─────

async function fetchCloseMap(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<Map<string, number>> {
  const key = cacheKey(symbol, startDate, endDate);
  if (_priceCache.has(key)) return _priceCache.get(key)!;

  const closeMap = new Map<string, number>();

  try {
    const { quotes } = await yahoo.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    for (const q of quotes) {
      if (q.close !== null && q.close !== undefined) {
        const dateStr = toDateStr(new Date(q.date));
        closeMap.set(dateStr, q.close);
      }
    }
  } catch (err) {
    console.warn(`[backtestEngine] Failed to fetch history for ${symbol}:`, err);
  }

  _priceCache.set(key, closeMap);
  return closeMap;
}

// ── Metrics helpers ───────────────────────────────────────────────────

/** Total return: (end - start) / start */
function calcTotalReturn(start: number, end: number): number {
  if (start === 0) return 0;
  return (end - start) / start;
}

/**
 * CAGR: (endValue / startValue)^(1/years) - 1
 * years derived from actual date diff.
 */
function calcCAGR(start: number, end: number, startDate: Date, endDate: Date): number {
  if (start === 0) return 0;
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const years = (endDate.getTime() - startDate.getTime()) / msPerYear;
  if (years <= 0) return 0;
  return Math.pow(end / start, 1 / years) - 1;
}

/**
 * Max drawdown: largest peak-to-trough decline over the equity curve.
 * Returns a negative number (e.g. -0.15 = -15%).
 */
function calcMaxDrawdown(curve: EquityPoint[]): number {
  if (curve.length < 2) return 0;
  let peak = curve[0].value;
  let maxDD = 0;
  for (const point of curve) {
    if (point.value > peak) peak = point.value;
    const dd = peak > 0 ? (point.value - peak) / peak : 0;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD;
}

/**
 * Annualised volatility: std-dev of daily log-returns × √252.
 */
function calcVolatility(curve: EquityPoint[]): number {
  if (curve.length < 2) return 0;

  const dailyReturns: number[] = [];
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1].value;
    const curr = curve[i].value;
    if (prev > 0) dailyReturns.push(Math.log(curr / prev));
  }

  if (dailyReturns.length === 0) return 0;

  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    dailyReturns.length;

  return Math.sqrt(variance) * Math.sqrt(252); // annualise
}

// ── Main engine function ──────────────────────────────────────────────

/**
 * Run a portfolio backtest.
 *
 * @param holdings  Array of { symbol, quantity }
 * @param startDate Backtest start (inclusive)
 * @param endDate   Backtest end (inclusive)
 */
export async function backtestEngine(
  holdings: BacktestHolding[],
  startDate: Date,
  endDate: Date
): Promise<BacktestResult> {
  // Edge case: empty portfolio
  if (!holdings || holdings.length === 0) {
    return {
      equityCurve: [],
      metrics: { totalReturn: 0, cagr: 0, maxDrawdown: 0, volatility: 0 },
    };
  }

  // 1. Fetch historical closes for all symbols in parallel
  const closeMaps = await Promise.all(
    holdings.map((h) => fetchCloseMap(h.symbol, startDate, endDate))
  );

  // 2. Build the union of all trading dates across all symbols, sorted
  const dateSet = new Set<string>();
  for (const cm of closeMaps) {
    for (const d of cm.keys()) dateSet.add(d);
  }
  const allDates = Array.from(dateSet).sort();

  if (allDates.length === 0) {
    return {
      equityCurve: [],
      metrics: { totalReturn: 0, cagr: 0, maxDrawdown: 0, volatility: 0 },
    };
  }

  // 3. Forward-fill closes so missing market days carry the last known price
  //    Build a per-symbol price series over allDates
  const priceSeries: number[][] = holdings.map((_, si) => {
    const cm = closeMaps[si];
    const series: number[] = [];
    let last = 0;
    for (const d of allDates) {
      if (cm.has(d)) last = cm.get(d)!;
      series.push(last);
    }
    return series;
  });

  // 4. Compute daily portfolio value: Σ(quantity_i × close_i[t])
  const equityCurve: EquityPoint[] = allDates.map((date, ti) => {
    const value = holdings.reduce((sum, h, si) => {
      return sum + h.quantity * priceSeries[si][ti];
    }, 0);
    return { date, value };
  });

  // 5. Compute metrics
  const startValue = equityCurve[0].value;
  const endValue = equityCurve[equityCurve.length - 1].value;

  const metrics: BacktestMetrics = {
    totalReturn: calcTotalReturn(startValue, endValue),
    cagr: calcCAGR(startValue, endValue, startDate, endDate),
    maxDrawdown: calcMaxDrawdown(equityCurve),
    volatility: calcVolatility(equityCurve),
  };

  return { equityCurve, metrics };
}
