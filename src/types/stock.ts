import type { DailyBriefRow, PortfolioHoldingRow } from "./database";

// ── Market data types ────────────────────────────────────────────────

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number | null;
  high52: number;
  low52: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  currency: string;
  exchange: string;
}

export interface StockHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type StockHistory = StockHistoryPoint[];

export interface MACDResult {
  macdLine: number | null;
  signalLine: number | null;
  histogram: number | null;
}

export interface BreakoutZone {
  low: number;
  high: number;
  type: 'bullish' | 'bearish';
}

export interface TechnicalIndicators {
  sma20: number | null;
  sma50: number | null;
  ema20: number | null;
  rsi: number | null;
  macd: MACDResult;
  supportLevels: number[];
  resistanceLevels: number[];
  breakoutZones: BreakoutZone[];
  trend: "bullish" | "bearish" | "neutral";
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
}

export interface CompanyInfo {
  sector: string;
  industry: string;
  description: string;
  employees: number | null;
  website: string;
  country: string;
}

export interface CompanyInfoFull extends CompanyInfo {
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
  fundFamily: string;
  fundCategory: string;
  legalType: string;
}

export interface FundamentalsExtended {
  marketCap: number;
  sharesOutstanding: number | null;
  dividendYield: number | null;
  beta: number | null;
  eps: number | null;
  averageVolume: number | null;
  roe: number | null;
  priceToBook: number | null;
  bookValue: number | null;
  debtToEquity: number | null;
  profitMargins: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  dividendRate: number | null;
  payoutRatio: number | null;
  enterpriseValue: number | null;
  totalCash: number | null;
  freeCashflow: number | null;
  operatingCashflow: number | null;
  ebitda: number | null;
  revenue: number | null;
  grossProfit: number | null;
  currentRatio: number | null;
  returnOnAssets: number | null;
}

export interface StockAnalysis {
  quote: StockQuote;
  history: StockHistory;
  technicals: TechnicalIndicators;
  news: NewsItem[];
  macroRisks: string[];
  rawMaterialRisks: string[];
  companyInfo?: CompanyInfo;
}

// ── Portfolio types (DB row + computed fields) ───────────────────────

export interface PortfolioHolding extends PortfolioHoldingRow {
  name?: string;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

// ── Daily brief with parsed snapshot ─────────────────────────────────

export interface PortfolioSnapshotItem {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface MarketIndex {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface PortfolioSnapshot {
  holdings: PortfolioSnapshotItem[];
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  marketIndices?: MarketIndex[];
}

export interface DailyBrief extends Omit<DailyBriefRow, "portfolio_snapshot"> {
  portfolio_snapshot: PortfolioSnapshot;
}
