/**
 * Finnhub API wrapper.
 *
 * Used for US-listed tickers where Yahoo's crumb-authed endpoints
 * regularly 401. Free tier covers:
 *  - /stock/profile2  (company profile)
 *  - /stock/metric    (PE, marketCap, 52w, beta, dividend yield, etc.)
 *
 * Indian (.NS/.BO) and EU tickers are not supported on the free tier — the
 * caller (data.ts) gates by symbol shape and falls back to Yahoo for those.
 */

import { stockCache, CACHE_TTL } from "./cache";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

function normalizeKey(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function readApiKey(): string {
  return normalizeKey(process.env.FINNHUB_API_KEY);
}

export function validateFinnhubSetup(): { valid: boolean; error?: string } {
  if (!readApiKey()) {
    return { valid: false, error: "FINNHUB_API_KEY environment variable is not set" };
  }
  return { valid: true };
}

/**
 * Finnhub free tier supports US-listed symbols only. Tickers with a market
 * suffix like ".NS" / ".BO" / ".L" / ".TO" are non-US — return false so the
 * caller falls back to Yahoo for those.
 */
export function isFinnhubSupportedSymbol(symbol: string): boolean {
  const trimmed = symbol.trim().toUpperCase();
  if (!trimmed) return false;
  if (trimmed.includes(".")) return false; // .NS, .BO, .L, .TO, .HK, etc.
  if (trimmed.includes(":")) return false; // some vendors prefix exchange
  return /^[A-Z0-9-]{1,10}$/.test(trimmed);
}

async function finnhubFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const apiKey = readApiKey();
  if (!apiKey) return null;

  const url = new URL(`${FINNHUB_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("token", apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`[finnhub] rate limit hit on ${path}`);
      } else if (res.status === 401 || res.status === 403) {
        console.warn(`[finnhub] auth rejected on ${path} (check FINNHUB_API_KEY)`);
      } else {
        console.warn(`[finnhub] HTTP ${res.status} on ${path}`);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[finnhub] fetch failed on ${path}:`, err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Company profile ────────────────────────────────────────────────────

export interface FinnhubProfile {
  name: string;
  ticker: string;
  exchange: string;
  country: string;
  currency: string;
  finnhubIndustry: string;
  weburl: string;
  logo: string;
  ipo: string;
  marketCapitalization: number; // in millions USD
  shareOutstanding: number; // in millions
  phone: string;
}

/**
 * Fetch the company profile for a US-listed ticker.
 * Returns null if the symbol is unsupported, the key is missing, or the
 * request fails. Cached for 1 hour (same TTL as Yahoo company info).
 */
export async function fetchFinnhubProfile(symbol: string): Promise<FinnhubProfile | null> {
  if (!isFinnhubSupportedSymbol(symbol)) return null;
  const upper = symbol.toUpperCase();
  const cacheKey = `finnhub:profile:${upper}`;
  const cached = stockCache.get<FinnhubProfile>(cacheKey);
  if (cached) return cached;

  const profile = await finnhubFetch<Partial<FinnhubProfile>>("/stock/profile2", { symbol: upper });
  if (!profile || !profile.name) return null;

  const full: FinnhubProfile = {
    name: profile.name ?? "",
    ticker: profile.ticker ?? upper,
    exchange: profile.exchange ?? "",
    country: profile.country ?? "",
    currency: profile.currency ?? "USD",
    finnhubIndustry: profile.finnhubIndustry ?? "",
    weburl: profile.weburl ?? "",
    logo: profile.logo ?? "",
    ipo: profile.ipo ?? "",
    marketCapitalization: profile.marketCapitalization ?? 0,
    shareOutstanding: profile.shareOutstanding ?? 0,
    phone: profile.phone ?? "",
  };
  stockCache.set(cacheKey, full, CACHE_TTL.COMPANY_INFO);
  return full;
}

// ── Metrics / fundamentals ────────────────────────────────────────────

interface FinnhubMetricResponse {
  metric?: Record<string, number | null | undefined>;
  series?: unknown;
}

export interface FinnhubMetrics {
  peTrailing: number | null;
  marketCap: number | null;          // in raw USD (we convert from millions)
  beta: number | null;
  eps: number | null;
  dividendYield: number | null;       // already in percentage points
  dividendPerShare: number | null;
  high52: number | null;
  low52: number | null;
  priceToBook: number | null;
  bookValue: number | null;
  debtToEquity: number | null;
  roeTrailing: number | null;
  roaTrailing: number | null;
  profitMargin: number | null;
  revenuePerShare: number | null;
  currentRatio: number | null;
  payoutRatio: number | null;
  ebitda: number | null;
  revenue: number | null;
  grossProfit: number | null;
  freeCashflow: number | null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

/**
 * Fetch the fundamentals/metrics block for a US-listed ticker.
 * Finnhub returns ~100 fields; we project only the ones the app uses.
 */
export async function fetchFinnhubMetrics(symbol: string): Promise<FinnhubMetrics | null> {
  if (!isFinnhubSupportedSymbol(symbol)) return null;
  const upper = symbol.toUpperCase();
  const cacheKey = `finnhub:metric:${upper}`;
  const cached = stockCache.get<FinnhubMetrics>(cacheKey);
  if (cached) return cached;

  const data = await finnhubFetch<FinnhubMetricResponse>("/stock/metric", {
    symbol: upper,
    metric: "all",
  });
  const m = data?.metric;
  if (!m || Object.keys(m).length === 0) return null;

  const metrics: FinnhubMetrics = {
    peTrailing: num(m.peTTM) ?? num(m.peBasicExclExtraTTM),
    // Finnhub returns marketCap in millions USD. Convert to raw so the rest of
    // the app's formatLargeNumber renders "1.23T" / "456.78B" correctly.
    marketCap: m.marketCapitalization != null ? Number(m.marketCapitalization) * 1_000_000 : null,
    beta: num(m.beta),
    eps: num(m.epsTTM) ?? num(m.epsBasicExclExtraTTM),
    dividendYield: num(m.dividendYieldIndicatedAnnual) ?? num(m["currentDividendYieldTTM"]),
    dividendPerShare: num(m.dividendPerShareTTM) ?? num(m["dividendPerShareAnnual"]),
    high52: num(m["52WeekHigh"]),
    low52: num(m["52WeekLow"]),
    priceToBook: num(m.pbAnnual) ?? num(m.pbQuarterly),
    bookValue: num(m.bookValuePerShareAnnual) ?? num(m.bookValuePerShareQuarterly),
    debtToEquity: num(m["totalDebt/totalEquityAnnual"]) ?? num(m["totalDebt/totalEquityQuarterly"]),
    roeTrailing: num(m.roeTTM) ?? num(m.roeRfy),
    roaTrailing: num(m.roaTTM) ?? num(m.roaRfy),
    profitMargin: num(m.netProfitMarginTTM) ?? num(m.netProfitMarginAnnual),
    revenuePerShare: num(m.revenuePerShareTTM),
    currentRatio: num(m.currentRatioAnnual) ?? num(m.currentRatioQuarterly),
    payoutRatio: num(m.payoutRatioTTM) ?? num(m.payoutRatioAnnual),
    ebitda: num(m.ebitdPerShareTTM),
    revenue: num(m.revenueTTM),
    grossProfit: num(m.grossMarginTTM),
    freeCashflow: num(m.freeCashFlowTTM),
  };
  stockCache.set(cacheKey, metrics, CACHE_TTL.COMPANY_INFO);
  return metrics;
}
