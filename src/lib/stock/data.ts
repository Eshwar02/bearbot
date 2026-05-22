import type { StockQuote, StockHistory } from "@/types/stock";
import { yahoo } from "@/lib/stock/yahoo";
import { stockCache, CACHE_TTL } from "./cache";

type YahooChartMeta = {
  symbol?: string;
  currency?: string;
  exchangeName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  shortName?: string;
  longName?: string;
};

/**
 * Map a user-friendly range token to Yahoo chart API range + interval. Yahoo
 * rejects mismatched combinations (e.g. range=1y interval=1m), so we keep
 * this in one place.
 */
export type ChartRange = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "ALL";

const RANGE_PARAMS: Record<ChartRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
  ALL: { range: "max", interval: "1mo" },
};

type YahooChartResult = {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
  };
};

async function fetchChartResult(
  symbol: string,
  params: Record<string, string>
): Promise<YahooChartResult | null> {
  try {
    const search = new URLSearchParams(params);
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol
      )}?${search.toString()}`,
      {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    if (!res.ok) return null;
    const payload = (await res.json()) as {
      chart?: { result?: YahooChartResult[] };
    };
    return payload.chart?.result?.[0] || null;
  } catch {
    return null;
  }
}

function mapQuoteFromChart(symbol: string, chart: YahooChartResult): StockQuote | null {
  const meta = chart.meta;
  const quoteSeries = chart.indicators?.quote?.[0];
  const closeSeries = quoteSeries?.close || [];
  const lastClose = [...closeSeries].reverse().find((v) => v !== null && v !== undefined) ?? null;
  const price =
    meta?.regularMarketPrice ??
    lastClose ??
    meta?.chartPreviousClose ??
    meta?.previousClose ??
    null;

  if (price === null) return null;

  const previousClose = meta?.chartPreviousClose ?? meta?.previousClose ?? price;
  const change = price - previousClose;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

  return {
    symbol: meta?.symbol || symbol,
    name: meta?.shortName || meta?.longName || symbol,
    price,
    change,
    changePercent,
    volume: meta?.regularMarketVolume ?? 0,
    marketCap: 0,
    pe: null,
    high52: meta?.fiftyTwoWeekHigh ?? 0,
    low52: meta?.fiftyTwoWeekLow ?? 0,
    dayHigh: meta?.regularMarketDayHigh ?? price,
    dayLow: meta?.regularMarketDayLow ?? price,
    open: meta?.regularMarketOpen ?? previousClose,
    previousClose,
    currency: meta?.currency || "USD",
    exchange: meta?.exchangeName || "",
  };
}

function mapHistoryFromChart(chart: YahooChartResult): StockHistory {
  const timestamps = chart.timestamp || [];
  const quoteSeries = chart.indicators?.quote?.[0];
  if (!quoteSeries || timestamps.length === 0) return [];

  const opens = quoteSeries.open || [];
  const highs = quoteSeries.high || [];
  const lows = quoteSeries.low || [];
  const closes = quoteSeries.close || [];
  const volumes = quoteSeries.volume || [];

  const points: StockHistory = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close === null || close === undefined) continue;

    points.push({
      date: new Date(timestamps[i] * 1000).toISOString().split("T")[0],
      open: opens[i] ?? close,
      high: highs[i] ?? close,
      low: lows[i] ?? close,
      close,
      volume: volumes[i] ?? 0,
    });
  }

  return points;
}

/**
 * Fetch a real-time quote for a given symbol.
 * Returns null if the symbol is invalid or the request fails.
 */
export async function fetchQuote(symbol: string): Promise<StockQuote | null> {
  const cacheKey = `quote:${symbol.toUpperCase()}`;
  const cached = stockCache.get<StockQuote>(cacheKey);
  if (cached) {
    return cached;
  }

  // Use chart API directly — the yahoo-finance2 SDK's quote() is broken
  // (crumb/cookie auth issues, 429 rate limits). The v8 chart endpoint
  // works reliably and includes quote data in its `meta` field.
  try {
    const chart = await fetchChartResult(symbol, { range: "5d", interval: "1d" });
    if (!chart) return null;
    const quote = mapQuoteFromChart(symbol, chart);
    if (quote) {
      stockCache.set(cacheKey, quote, CACHE_TTL.QUOTE);
    }
    return quote;
  } catch (error) {
    console.error(
      `[fetchQuote] Failed for ${symbol}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Fetch historical OHLCV price data for a symbol.
 * @param symbol  - Yahoo Finance symbol (e.g. "AAPL" or "RELIANCE.NS")
 * @param years   - Number of years of history to fetch (default 10)
 * @param period1 - Optional explicit start date (overrides years param)
 * @param period2 - Optional explicit end date (defaults to today)
 * Returns an empty array on failure.
 */
export async function fetchHistory(
  symbol: string,
  years: number = 10,
  period1?: Date,
  period2?: Date
): Promise<StockHistory> {
  const defaultStart = new Date();
  defaultStart.setFullYear(defaultStart.getFullYear() - years);
  const from = period1 || defaultStart;
  const to = period2 || new Date();

  // Create a cache key that includes the date range to avoid cache collisions
  const cacheKey = `history:${symbol.toUpperCase()}:${years}:${Math.floor(from.getTime() / 86400000)}:${Math.floor(to.getTime() / 86400000)}`;
  const cached = stockCache.get<StockHistory>(cacheKey);
  if (cached) {
    return cached;
  }

  const chart = await fetchChartResult(symbol, {
    period1: Math.floor(from.getTime() / 1000).toString(),
    period2: Math.floor(to.getTime() / 1000).toString(),
    interval: "1d",
    events: "history",
  });

  if (!chart) return [];
  const history = mapHistoryFromChart(chart);
  if (history.length > 0) {
    stockCache.set(cacheKey, history, CACHE_TTL.HISTORY);
  }
  return history;
}

/**
 * Fetch a history series for a named range (1D/1W/1M/3M/6M/1Y/5Y/ALL).
 * Uses Yahoo's chart endpoint with the correct interval for each range, so
 * intraday ranges return fine-grained candles and long ranges return weekly
 * or monthly candles. Returns an empty array on failure.
 */
export async function fetchHistoryRange(
  symbol: string,
  range: ChartRange = "1M"
): Promise<StockHistory> {
  const params = RANGE_PARAMS[range];
  const cacheKey = `history-range:${symbol.toUpperCase()}:${range}`;
  const cached = stockCache.get<StockHistory>(cacheKey);
  if (cached) return cached;

  const chart = await fetchChartResult(symbol, {
    range: params.range,
    interval: params.interval,
  });
  if (!chart) return [];
  const history = mapHistoryFromChart(chart);
  if (history.length > 0) {
    // 1D / 1W are intraday and should refresh more often than long ranges.
    const ttl = range === "1D" || range === "1W" ? CACHE_TTL.QUOTE : CACHE_TTL.HISTORY;
    stockCache.set(cacheKey, history, ttl);
  }
  return history;
}

/**
 * Fetch a richer quote that includes marketCap, sharesOutstanding, etc. via
 * yahoo-finance2's summaryDetail module. Falls back to `fetchQuote` (chart
 * meta) if the summary call fails (Yahoo's auth path is occasionally flaky).
 */
export async function fetchQuoteFull(symbol: string): Promise<
  (StockQuote & {
    marketCap: number;
    sharesOutstanding: number | null;
    dividendYield: number | null;
    beta: number | null;
    eps: number | null;
    averageVolume: number | null;
  }) | null
> {
  const base = await fetchQuote(symbol);
  if (!base) return null;

  type SummaryDetail = {
    marketCap?: { raw?: number } | number;
    sharesOutstanding?: { raw?: number } | number;
    dividendYield?: { raw?: number } | number;
    beta?: { raw?: number } | number;
    trailingEps?: { raw?: number } | number;
    averageVolume?: { raw?: number } | number;
    trailingPE?: { raw?: number } | number;
  };

  const readNum = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v && typeof v === "object" && "raw" in v) {
      const raw = (v as { raw?: unknown }).raw;
      if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    }
    return null;
  };

  try {
    const result = (await yahoo.quoteSummary(symbol, {
      modules: ["summaryDetail", "defaultKeyStatistics", "price"],
    })) as {
      summaryDetail?: SummaryDetail;
      defaultKeyStatistics?: SummaryDetail;
      price?: SummaryDetail;
    };
    const summary = result.summaryDetail || {};
    const stats = result.defaultKeyStatistics || {};
    const price = result.price || {};

    return {
      ...base,
      marketCap: readNum(price.marketCap) ?? readNum(summary.marketCap) ?? 0,
      sharesOutstanding: readNum(stats.sharesOutstanding),
      dividendYield: readNum(summary.dividendYield),
      beta: readNum(summary.beta),
      eps: readNum(stats.trailingEps),
      averageVolume: readNum(summary.averageVolume),
      pe: readNum(summary.trailingPE) ?? base.pe,
    };
  } catch {
    return { ...base, marketCap: 0, sharesOutstanding: null, dividendYield: null, beta: null, eps: null, averageVolume: null };
  }
}

/**
 * Fetch company profile / summary info.
 */
export async function fetchCompanyInfo(symbol: string): Promise<{
  sector: string;
  industry: string;
  description: string;
  employees: number | null;
  website: string;
  country: string;
}> {
  const cacheKey = `company:${symbol.toUpperCase()}`;
  const cached = stockCache.get<{
    sector: string;
    industry: string;
    description: string;
    employees: number | null;
    website: string;
    country: string;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const result = await yahoo.quoteSummary(symbol, {
      modules: ["assetProfile"],
    });

    const profile = result.assetProfile;
    const info = {
      sector: profile?.sector || "Unknown",
      industry: profile?.industry || "Unknown",
      description: profile?.longBusinessSummary || "",
      employees: profile?.fullTimeEmployees ?? null,
      website: profile?.website || "",
      country: profile?.country || "",
    };
    stockCache.set(cacheKey, info, CACHE_TTL.COMPANY_INFO);
    return info;
  } catch {
    const fallback = {
      sector: "Unknown",
      industry: "Unknown",
      description: "",
      employees: null,
      website: "",
      country: "",
    };
    stockCache.set(cacheKey, fallback, CACHE_TTL.COMPANY_INFO);
    return fallback;
  }
}
