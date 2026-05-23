import type { StockQuote, StockHistory, FundamentalsExtended } from "@/types/stock";
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
  "1D": { range: "1d", interval: "1m" },
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

function mapHistoryFromChart(
  chart: YahooChartResult,
  /** When true, keep full ISO timestamps. Intraday ranges (1D / 1W) need
   *  this so 1-min / 30-min candles don't all collapse to the same date. */
  intraday = false
): StockHistory {
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

    const iso = new Date(timestamps[i] * 1000).toISOString();
    points.push({
      date: intraday ? iso : iso.split("T")[0],
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
  const intraday = range === "1D" || range === "1W";
  const history = mapHistoryFromChart(chart, intraday);
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
  (StockQuote & FundamentalsExtended) | null
> {
  const base = await fetchQuote(symbol);
  if (!base) return null;

  type NumberField = { raw?: number } | number;

  type SummaryDetail = {
    marketCap?: NumberField;
    sharesOutstanding?: NumberField;
    dividendYield?: NumberField;
    beta?: NumberField;
    trailingEps?: NumberField;
    averageVolume?: NumberField;
    trailingPE?: NumberField;
    priceToBook?: NumberField;
    bookValue?: NumberField;
    debtToEquity?: NumberField;
    returnOnEquity?: NumberField;
    profitMargins?: NumberField;
    revenueGrowth?: NumberField;
    earningsGrowth?: NumberField;
    dividendRate?: NumberField;
    payoutRatio?: NumberField;
    enterpriseValue?: NumberField;
    totalCash?: NumberField;
    freeCashflow?: NumberField;
    operatingCashflow?: NumberField;
    ebitda?: NumberField;
    totalRevenue?: NumberField;
    grossProfits?: NumberField;
    currentRatio?: NumberField;
    returnOnAssets?: NumberField;
  };

  const readNum = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v && typeof v === "object" && "raw" in v) {
      const raw = (v as { raw?: unknown }).raw;
      if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    }
    return null;
  };

  const emptyFundamentals: FundamentalsExtended = {
    marketCap: 0,
    sharesOutstanding: null,
    dividendYield: null,
    beta: null,
    eps: null,
    averageVolume: null,
    roe: null,
    priceToBook: null,
    bookValue: null,
    debtToEquity: null,
    profitMargins: null,
    revenueGrowth: null,
    earningsGrowth: null,
    dividendRate: null,
    payoutRatio: null,
    enterpriseValue: null,
    totalCash: null,
    freeCashflow: null,
    operatingCashflow: null,
    ebitda: null,
    revenue: null,
    grossProfit: null,
    currentRatio: null,
    returnOnAssets: null,
  };

  try {
    const result = (await yahoo.quoteSummary(symbol, {
      modules: ["summaryDetail", "defaultKeyStatistics", "price"],
    })) as {
      summaryDetail?: Record<string, NumberField>;
      defaultKeyStatistics?: Record<string, NumberField>;
      price?: Record<string, NumberField>;
    };
    const s = result.summaryDetail || {};
    const k = result.defaultKeyStatistics || {};
    const p = result.price || {};

    return {
      ...base,
      marketCap: readNum(p.marketCap) ?? readNum(s.marketCap) ?? 0,
      sharesOutstanding: readNum(k.sharesOutstanding),
      dividendYield: readNum(s.dividendYield),
      beta: readNum(s.beta),
      eps: readNum(k.trailingEps),
      averageVolume: readNum(s.averageVolume),
      pe: readNum(s.trailingPE) ?? base.pe,
      roe: readNum(k.returnOnEquity) ?? readNum(s.returnOnEquity),
      priceToBook: readNum(k.priceToBook) ?? readNum(s.priceToBook),
      bookValue: readNum(k.bookValue) ?? readNum(s.bookValue),
      debtToEquity: readNum(k.debtToEquity) ?? readNum(s.debtToEquity),
      profitMargins: readNum(k.profitMargins) ?? readNum(s.profitMargins),
      revenueGrowth: readNum(s.revenueGrowth),
      earningsGrowth: readNum(k.earningsGrowth),
      dividendRate: readNum(s.dividendRate),
      payoutRatio: readNum(s.payoutRatio),
      enterpriseValue: readNum(k.enterpriseValue) ?? readNum(s.enterpriseValue),
      totalCash: readNum(s.totalCash),
      freeCashflow: readNum(k.freeCashflow) ?? readNum(s.freeCashflow),
      operatingCashflow: readNum(k.operatingCashflow) ?? readNum(s.operatingCashflow),
      ebitda: readNum(k.ebitda) ?? readNum(s.ebitda),
      revenue: readNum(s.totalRevenue) ?? readNum(k.revenue),
      grossProfit: readNum(s.grossProfits) ?? readNum(k.grossProfit),
      currentRatio: readNum(s.currentRatio) ?? readNum(k.currentRatio),
      returnOnAssets: readNum(k.returnOnAssets) ?? readNum(s.returnOnAssets),
    };
  } catch {
    return { ...base, ...emptyFundamentals };
  }
}

export interface CompanyInfoFull {
  sector: string;
  industry: string;
  description: string;
  employees: number | null;
  website: string;
  country: string;
  // Extended fields — populated when Yahoo provides them.
  city: string;
  state: string;
  address: string;
  phone: string;
  exchange: string;
  exchangeTimezone: string;
  currency: string;
  quoteType: string;
  longName: string;
  ceo: string;
  ipoDate: string;
  // ETF/Fund-specific
  fundFamily: string;
  fundCategory: string;
  legalType: string;
}

/**
 * Fetch company profile / summary info. Merges multiple Yahoo quoteSummary
 * modules so we recover data for equities, ETFs, mutual funds, and Indian
 * tickers (whose `assetProfile` is often sparse). Falls back gracefully so
 * the page never shows a blank section if at least one module returns data.
 */
export async function fetchCompanyInfo(symbol: string): Promise<CompanyInfoFull> {
  const cacheKey = `company:${symbol.toUpperCase()}`;
  const cached = stockCache.get<CompanyInfoFull>(cacheKey);
  if (cached) return cached;

  const empty: CompanyInfoFull = {
    sector: "",
    industry: "",
    description: "",
    employees: null,
    website: "",
    country: "",
    city: "",
    state: "",
    address: "",
    phone: "",
    exchange: "",
    exchangeTimezone: "",
    currency: "",
    quoteType: "",
    longName: "",
    ceo: "",
    ipoDate: "",
    fundFamily: "",
    fundCategory: "",
    legalType: "",
  };

  type AssetProfile = {
    sector?: string;
    industry?: string;
    longBusinessSummary?: string;
    fullTimeEmployees?: number;
    website?: string;
    country?: string;
    city?: string;
    state?: string;
    address1?: string;
    phone?: string;
    companyOfficers?: Array<{ name?: string; title?: string }>;
  };
  type SummaryProfile = AssetProfile;
  type FundProfile = {
    family?: string;
    categoryName?: string;
    legalType?: string;
    longName?: string;
  };
  type PriceModule = {
    exchangeName?: string;
    exchange?: string;
    exchangeTimezoneShortName?: string;
    exchangeTimezoneName?: string;
    currency?: string;
    quoteType?: string;
    longName?: string;
    shortName?: string;
  };
  type SummaryDetailModule = {
    startDate?: number | { raw?: number };
  };

  // Request a broad set of modules. Each is optional — Yahoo returns
  // whatever it has for that symbol.
  try {
    const result = (await yahoo.quoteSummary(symbol, {
      modules: [
        "assetProfile",
        "summaryProfile",
        "fundProfile",
        "price",
        "summaryDetail",
      ],
    })) as {
      assetProfile?: AssetProfile;
      summaryProfile?: SummaryProfile;
      fundProfile?: FundProfile;
      price?: PriceModule;
      summaryDetail?: SummaryDetailModule;
    };

    const ap = result.assetProfile || {};
    const sp = result.summaryProfile || {};
    const fp = result.fundProfile || {};
    const pr = result.price || {};
    const sd = result.summaryDetail || {};

    // Prefer assetProfile when present, otherwise summaryProfile.
    const profile: AssetProfile = { ...sp, ...ap };

    const officers = profile.companyOfficers || [];
    const ceoEntry =
      officers.find((o) =>
        /CEO|Chief Executive/i.test(o.title || "")
      ) || officers[0];

    const ipoRaw =
      typeof sd.startDate === "object"
        ? sd.startDate?.raw
        : (sd.startDate as number | undefined);
    const ipoDate =
      typeof ipoRaw === "number" && Number.isFinite(ipoRaw)
        ? new Date(ipoRaw * 1000).toISOString().split("T")[0]
        : "";

    const info: CompanyInfoFull = {
      sector: profile.sector || "",
      industry: profile.industry || "",
      description: profile.longBusinessSummary || "",
      employees: profile.fullTimeEmployees ?? null,
      website: profile.website || "",
      country: profile.country || "",
      city: profile.city || "",
      state: profile.state || "",
      address: profile.address1 || "",
      phone: profile.phone || "",
      exchange: pr.exchangeName || pr.exchange || "",
      exchangeTimezone: pr.exchangeTimezoneShortName || pr.exchangeTimezoneName || "",
      currency: pr.currency || "",
      quoteType: pr.quoteType || "",
      longName: pr.longName || pr.shortName || fp.longName || "",
      ceo: ceoEntry?.name || "",
      ipoDate,
      fundFamily: fp.family || "",
      fundCategory: fp.categoryName || "",
      legalType: fp.legalType || "",
    };

    stockCache.set(cacheKey, info, CACHE_TTL.COMPANY_INFO);
    return info;
  } catch {
    stockCache.set(cacheKey, empty, CACHE_TTL.COMPANY_INFO);
    return empty;
  }
}
