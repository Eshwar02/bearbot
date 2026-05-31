/**
 * Fundamentals data layer.
 *
 * Wraps Yahoo Finance's v10 `quoteSummary` modules into typed, normalized
 * shapes the insights UI and chat tools can consume. Indian (.NS/.BO) tickers
 * have rich statement coverage here; US tickers also work but free Finnhub
 * does NOT include statement endpoints — for US fundamentals we still try
 * Yahoo first and the caller falls back to Finnhub metrics for ratios.
 *
 * Everything is cached in the existing in-process `stockCache` so a hot
 * company page (or chat tool call) does not re-hit Yahoo on every render.
 */

import { yahoo, type YahooQuoteSummary } from "./yahoo";
import { stockCache, CACHE_TTL } from "./cache";

// ── Shared types ─────────────────────────────────────────────────────

export type StatementPeriod = {
  endDate: string;       // ISO date, e.g. "2025-03-31"
  totalRevenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingExpense: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  ebitda: number | null;
  eps: number | null;
};

export type BalanceSheetPeriod = {
  endDate: string;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  totalDebt: number | null;
  cash: number | null;
  inventory: number | null;
};

export type CashflowPeriod = {
  endDate: string;
  operatingCashflow: number | null;
  investingCashflow: number | null;
  financingCashflow: number | null;
  freeCashflow: number | null;
  capex: number | null;
};

export type CompanyProfile = {
  symbol: string;
  longName: string;
  shortName: string;
  sector: string;
  industry: string;
  summary: string;
  website: string;
  country: string;
  employees: number | null;
  exchange: string;
  currency: string;
  marketCap: number | null;
};

export type KeyRatios = {
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  pegRatio: number | null;
  enterpriseValue: number | null;
  enterpriseToRevenue: number | null;
  enterpriseToEbitda: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  grossMargin: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  earningsGrowth: number | null;
  revenueGrowth: number | null;
  dividendYield: number | null;
  payoutRatio: number | null;
  beta: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
};

export type FundamentalsBundle = {
  profile: CompanyProfile;
  ratios: KeyRatios;
  incomeAnnual: StatementPeriod[];
  incomeQuarterly: StatementPeriod[];
  balanceAnnual: BalanceSheetPeriod[];
  balanceQuarterly: BalanceSheetPeriod[];
  cashflowAnnual: CashflowPeriod[];
  cashflowQuarterly: CashflowPeriod[];
  fetchedAt: string;
  source: "yahoo";
};

// ── Yahoo's "raw or number" unwrap ───────────────────────────────────

type NumLike = number | { raw?: number } | string | null | undefined;

function unwrapNumber(v: NumLike): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === "object" && "raw" in v && typeof v.raw === "number") {
    return Number.isFinite(v.raw) ? v.raw : null;
  }
  return null;
}

function isoFromYahooDate(v: unknown): string {
  if (!v) return "";
  if (typeof v === "number") return new Date(v * 1000).toISOString().slice(0, 10);
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (typeof v === "object" && v && "raw" in (v as Record<string, unknown>)) {
    const raw = (v as { raw?: unknown }).raw;
    if (typeof raw === "number") return new Date(raw * 1000).toISOString().slice(0, 10);
  }
  return "";
}

// ── Module → typed mappers ───────────────────────────────────────────

type RawStatement = {
  endDate?: NumLike;
  totalRevenue?: NumLike;
  costOfRevenue?: NumLike;
  grossProfit?: NumLike;
  totalOperatingExpenses?: NumLike;
  operatingIncome?: NumLike;
  netIncome?: NumLike;
  ebitda?: NumLike;
  dilutedEPS?: NumLike;
  basicEPS?: NumLike;
};

function mapIncome(rows: RawStatement[] | undefined): StatementPeriod[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    endDate: isoFromYahooDate(r.endDate),
    totalRevenue: unwrapNumber(r.totalRevenue),
    costOfRevenue: unwrapNumber(r.costOfRevenue),
    grossProfit: unwrapNumber(r.grossProfit),
    operatingExpense: unwrapNumber(r.totalOperatingExpenses),
    operatingIncome: unwrapNumber(r.operatingIncome),
    netIncome: unwrapNumber(r.netIncome),
    ebitda: unwrapNumber(r.ebitda),
    eps: unwrapNumber(r.dilutedEPS) ?? unwrapNumber(r.basicEPS),
  }));
}

type RawBalance = {
  endDate?: NumLike;
  totalAssets?: NumLike;
  totalLiab?: NumLike;
  totalStockholderEquity?: NumLike;
  totalDebt?: NumLike;
  shortLongTermDebt?: NumLike;
  longTermDebt?: NumLike;
  cash?: NumLike;
  inventory?: NumLike;
};

function mapBalance(rows: RawBalance[] | undefined): BalanceSheetPeriod[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const debt =
      unwrapNumber(r.totalDebt) ??
      ((unwrapNumber(r.shortLongTermDebt) ?? 0) + (unwrapNumber(r.longTermDebt) ?? 0) || null);
    return {
      endDate: isoFromYahooDate(r.endDate),
      totalAssets: unwrapNumber(r.totalAssets),
      totalLiabilities: unwrapNumber(r.totalLiab),
      totalEquity: unwrapNumber(r.totalStockholderEquity),
      totalDebt: debt,
      cash: unwrapNumber(r.cash),
      inventory: unwrapNumber(r.inventory),
    };
  });
}

type RawCashflow = {
  endDate?: NumLike;
  totalCashFromOperatingActivities?: NumLike;
  totalCashflowsFromInvestingActivities?: NumLike;
  totalCashFromFinancingActivities?: NumLike;
  capitalExpenditures?: NumLike;
  freeCashFlow?: NumLike;
};

function mapCashflow(rows: RawCashflow[] | undefined): CashflowPeriod[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const op = unwrapNumber(r.totalCashFromOperatingActivities);
    const capex = unwrapNumber(r.capitalExpenditures);
    const fcfExplicit = unwrapNumber(r.freeCashFlow);
    const fcf = fcfExplicit ?? (op != null && capex != null ? op + capex : null);
    return {
      endDate: isoFromYahooDate(r.endDate),
      operatingCashflow: op,
      investingCashflow: unwrapNumber(r.totalCashflowsFromInvestingActivities),
      financingCashflow: unwrapNumber(r.totalCashFromFinancingActivities),
      capex,
      freeCashflow: fcf,
    };
  });
}

function mapProfile(symbol: string, qs: YahooQuoteSummary | null): CompanyProfile {
  const ap = qs?.assetProfile || qs?.summaryProfile || {};
  const price = qs?.price || {};
  return {
    symbol,
    longName: (price.longName as string) || (price.shortName as string) || symbol,
    shortName: (price.shortName as string) || symbol,
    sector: ap.sector || "",
    industry: ap.industry || "",
    summary: ap.longBusinessSummary || "",
    website: ap.website || "",
    country: ap.country || "",
    employees: typeof ap.fullTimeEmployees === "number" ? ap.fullTimeEmployees : null,
    exchange: (price.exchangeName as string) || (price.exchange as string) || "",
    currency: (price.currency as string) || "USD",
    marketCap: unwrapNumber(price.marketCap as NumLike),
  };
}

function mapRatios(qs: YahooQuoteSummary | null): KeyRatios {
  const sd = (qs?.summaryDetail ?? {}) as Record<string, NumLike>;
  const ks = (qs?.defaultKeyStatistics ?? {}) as Record<string, NumLike>;
  // `financialData` module is included on demand below; we read it via a cast
  // off the same parent object since YahooQuoteSummary doesn't yet declare it.
  const fd = ((qs as Record<string, unknown> | null)?.financialData ?? {}) as Record<string, NumLike>;
  return {
    trailingPE: unwrapNumber(sd.trailingPE) ?? unwrapNumber(ks.trailingPE),
    forwardPE: unwrapNumber(sd.forwardPE) ?? unwrapNumber(ks.forwardPE),
    priceToBook: unwrapNumber(ks.priceToBook),
    priceToSales: unwrapNumber(sd.priceToSalesTrailing12Months),
    pegRatio: unwrapNumber(ks.pegRatio),
    enterpriseValue: unwrapNumber(ks.enterpriseValue),
    enterpriseToRevenue: unwrapNumber(ks.enterpriseToRevenue),
    enterpriseToEbitda: unwrapNumber(ks.enterpriseToEbitda),
    profitMargin: unwrapNumber(fd.profitMargins) ?? unwrapNumber(ks.profitMargins),
    operatingMargin: unwrapNumber(fd.operatingMargins),
    grossMargin: unwrapNumber(fd.grossMargins),
    returnOnAssets: unwrapNumber(fd.returnOnAssets),
    returnOnEquity: unwrapNumber(fd.returnOnEquity),
    debtToEquity: unwrapNumber(fd.debtToEquity),
    currentRatio: unwrapNumber(fd.currentRatio),
    quickRatio: unwrapNumber(fd.quickRatio),
    earningsGrowth: unwrapNumber(fd.earningsGrowth),
    revenueGrowth: unwrapNumber(fd.revenueGrowth),
    dividendYield: unwrapNumber(sd.dividendYield),
    payoutRatio: unwrapNumber(sd.payoutRatio),
    beta: unwrapNumber(ks.beta) ?? unwrapNumber(sd.beta),
    fiftyTwoWeekHigh: unwrapNumber(sd.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: unwrapNumber(sd.fiftyTwoWeekLow),
  };
}

// ── Public API ───────────────────────────────────────────────────────

const FUNDAMENTALS_TTL = 6 * 60 * 60; // 6h

/**
 * Pull the full fundamentals bundle for a ticker (profile + ratios + 4
 * statement periods annual & quarterly). Returns null only when Yahoo blocks
 * us entirely; partial coverage falls back to empty arrays so the UI can
 * render a graceful empty state per tab.
 */
export async function fetchFundamentals(symbol: string): Promise<FundamentalsBundle | null> {
  const upper = symbol.trim().toUpperCase();
  if (!upper) return null;
  const cacheKey = `insights:fundamentals:${upper}`;
  const cached = stockCache.get<FundamentalsBundle>(cacheKey);
  if (cached) return cached;

  const modules = [
    "assetProfile",
    "summaryProfile",
    "summaryDetail",
    "defaultKeyStatistics",
    "financialData",
    "price",
    "incomeStatementHistory",
    "incomeStatementHistoryQuarterly",
    "balanceSheetHistory",
    "balanceSheetHistoryQuarterly",
    "cashflowStatementHistory",
    "cashflowStatementHistoryQuarterly",
  ];

  const qs = (await yahoo.quoteSummary(upper, { modules })) as YahooQuoteSummary &
    Record<string, unknown>;

  const incomeAnnual = mapIncome(
    (qs?.incomeStatementHistory as { incomeStatementHistory?: RawStatement[] } | undefined)
      ?.incomeStatementHistory,
  );
  const incomeQuarterly = mapIncome(
    (qs?.incomeStatementHistoryQuarterly as { incomeStatementHistory?: RawStatement[] } | undefined)
      ?.incomeStatementHistory,
  );
  const balanceAnnual = mapBalance(
    (qs?.balanceSheetHistory as { balanceSheetStatements?: RawBalance[] } | undefined)
      ?.balanceSheetStatements,
  );
  const balanceQuarterly = mapBalance(
    (qs?.balanceSheetHistoryQuarterly as { balanceSheetStatements?: RawBalance[] } | undefined)
      ?.balanceSheetStatements,
  );
  const cashflowAnnual = mapCashflow(
    (qs?.cashflowStatementHistory as { cashflowStatements?: RawCashflow[] } | undefined)
      ?.cashflowStatements,
  );
  const cashflowQuarterly = mapCashflow(
    (qs?.cashflowStatementHistoryQuarterly as { cashflowStatements?: RawCashflow[] } | undefined)
      ?.cashflowStatements,
  );

  const bundle: FundamentalsBundle = {
    profile: mapProfile(upper, qs),
    ratios: mapRatios(qs),
    incomeAnnual,
    incomeQuarterly,
    balanceAnnual,
    balanceQuarterly,
    cashflowAnnual,
    cashflowQuarterly,
    fetchedAt: new Date().toISOString(),
    source: "yahoo",
  };

  stockCache.set(cacheKey, bundle, FUNDAMENTALS_TTL);
  return bundle;
}

/**
 * Recommendation trend acts as a lightweight "peers / sentiment" feed for the
 * Peers tab until we wire a richer peers source.
 */
export type RecommendationTrend = {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
};

export async function fetchRecommendationTrend(symbol: string): Promise<RecommendationTrend[]> {
  const upper = symbol.trim().toUpperCase();
  const cacheKey = `insights:rectrend:${upper}`;
  const cached = stockCache.get<RecommendationTrend[]>(cacheKey);
  if (cached) return cached;

  const qs = (await yahoo.quoteSummary(upper, {
    modules: ["recommendationTrend"],
  })) as Record<string, unknown>;

  const trend = (qs?.recommendationTrend as { trend?: Array<Record<string, unknown>> } | undefined)
    ?.trend;
  const mapped: RecommendationTrend[] = Array.isArray(trend)
    ? trend.map((t) => ({
        period: (t.period as string) || "",
        strongBuy: Number(t.strongBuy) || 0,
        buy: Number(t.buy) || 0,
        hold: Number(t.hold) || 0,
        sell: Number(t.sell) || 0,
        strongSell: Number(t.strongSell) || 0,
      }))
    : [];

  stockCache.set(cacheKey, mapped, CACHE_TTL.COMPANY_INFO);
  return mapped;
}
