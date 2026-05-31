/**
 * Shared insights data module. Used by both /api/insights/* routes and the
 * chat tool layer so both surfaces return identical, citable shapes.
 */
import { fetchFundamentals, fetchRecommendationTrend } from "@/lib/stock/fundamentals";
import type { FundamentalsBundle, KeyRatios, CompanyProfile } from "@/lib/stock/fundamentals";
import { fetchFinnhubMetrics, fetchFinnhubProfile, isFinnhubSupportedSymbol } from "@/lib/stock/finnhub";
import { yahoo } from "@/lib/stock/yahoo";

export type Citation = { source: string; url: string; fetchedAt: string };

export type CompanyOverview = {
  symbol: string;
  profile: CompanyProfile;
  ratios: KeyRatios;
  quote: {
    price: number | null;
    previousClose: number | null;
    currency: string;
    dayHigh: number | null;
    dayLow: number | null;
  };
  citations: Citation[];
};

export type CompanyFinancials = {
  symbol: string;
  income: { annual: FundamentalsBundle["incomeAnnual"]; quarterly: FundamentalsBundle["incomeQuarterly"] };
  balance: { annual: FundamentalsBundle["balanceAnnual"]; quarterly: FundamentalsBundle["balanceQuarterly"] };
  cashflow: { annual: FundamentalsBundle["cashflowAnnual"]; quarterly: FundamentalsBundle["cashflowQuarterly"] };
  citations: Citation[];
};

const INSIGHTS_HOST = "insights.alphasightai.online";
const insightsUrl = (sym: string) => `https://${INSIGHTS_HOST}/${encodeURIComponent(sym.toUpperCase())}`;

export function isIndianTicker(symbol: string): boolean {
  return /\.(NS|BO)$/i.test(symbol.trim());
}

export async function getCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
  const upper = symbol.trim().toUpperCase();
  if (!upper) return null;
  const now = new Date().toISOString();

  const fundamentals = await fetchFundamentals(upper);
  const quoteRaw = await yahoo.quote(upper);

  let ratios = fundamentals?.ratios ?? null;
  let profile = fundamentals?.profile ?? null;
  const citations: Citation[] = [
    { source: "Yahoo Finance", url: insightsUrl(upper), fetchedAt: now },
  ];

  if (!isIndianTicker(upper) && isFinnhubSupportedSymbol(upper)) {
    const [fp, fm] = await Promise.all([
      fetchFinnhubProfile(upper),
      fetchFinnhubMetrics(upper),
    ]);
    if (fp && (!profile || !profile.longName || profile.longName === upper)) {
      profile = {
        symbol: upper,
        longName: fp.name || upper,
        shortName: fp.name || upper,
        sector: fp.finnhubIndustry || "",
        industry: fp.finnhubIndustry || "",
        summary: "",
        website: fp.weburl || "",
        country: fp.country || "",
        employees: null,
        exchange: fp.exchange || "",
        currency: fp.currency || "USD",
        marketCap: fp.marketCapitalization ? fp.marketCapitalization * 1_000_000 : null,
      };
    }
    if (fm) {
      ratios = {
        trailingPE: ratios?.trailingPE ?? fm.peTrailing,
        forwardPE: ratios?.forwardPE ?? null,
        priceToBook: ratios?.priceToBook ?? fm.priceToBook,
        priceToSales: ratios?.priceToSales ?? null,
        pegRatio: ratios?.pegRatio ?? null,
        enterpriseValue: ratios?.enterpriseValue ?? null,
        enterpriseToRevenue: ratios?.enterpriseToRevenue ?? null,
        enterpriseToEbitda: ratios?.enterpriseToEbitda ?? null,
        profitMargin: ratios?.profitMargin ?? fm.profitMargin,
        operatingMargin: ratios?.operatingMargin ?? null,
        grossMargin: ratios?.grossMargin ?? null,
        returnOnAssets: ratios?.returnOnAssets ?? fm.roaTrailing,
        returnOnEquity: ratios?.returnOnEquity ?? fm.roeTrailing,
        debtToEquity: ratios?.debtToEquity ?? fm.debtToEquity,
        currentRatio: ratios?.currentRatio ?? fm.currentRatio,
        quickRatio: ratios?.quickRatio ?? null,
        earningsGrowth: ratios?.earningsGrowth ?? null,
        revenueGrowth: ratios?.revenueGrowth ?? null,
        dividendYield: ratios?.dividendYield ?? fm.dividendYield,
        payoutRatio: ratios?.payoutRatio ?? fm.payoutRatio,
        beta: ratios?.beta ?? fm.beta,
        fiftyTwoWeekHigh: ratios?.fiftyTwoWeekHigh ?? fm.high52,
        fiftyTwoWeekLow: ratios?.fiftyTwoWeekLow ?? fm.low52,
      };
      citations.push({ source: "Finnhub", url: "https://finnhub.io", fetchedAt: now });
    }
  }

  if (!profile || !ratios) return null;

  return {
    symbol: upper,
    profile,
    ratios,
    quote: {
      price: quoteRaw?.regularMarketPrice ?? null,
      previousClose: quoteRaw?.regularMarketPreviousClose ?? null,
      currency: quoteRaw?.currency ?? profile.currency ?? "USD",
      dayHigh: quoteRaw?.regularMarketDayHigh ?? null,
      dayLow: quoteRaw?.regularMarketDayLow ?? null,
    },
    citations,
  };
}

export async function getCompanyFinancials(symbol: string): Promise<CompanyFinancials | null> {
  const upper = symbol.trim().toUpperCase();
  const f = await fetchFundamentals(upper);
  if (!f) return null;
  return {
    symbol: upper,
    income: { annual: f.incomeAnnual, quarterly: f.incomeQuarterly },
    balance: { annual: f.balanceAnnual, quarterly: f.balanceQuarterly },
    cashflow: { annual: f.cashflowAnnual, quarterly: f.cashflowQuarterly },
    citations: [
      { source: "Yahoo Finance", url: insightsUrl(upper), fetchedAt: f.fetchedAt },
    ],
  };
}

export async function getCompanyPeers(symbol: string): Promise<{
  symbol: string;
  trend: Awaited<ReturnType<typeof fetchRecommendationTrend>>;
  citations: Citation[];
} | null> {
  const upper = symbol.trim().toUpperCase();
  const trend = await fetchRecommendationTrend(upper);
  return {
    symbol: upper,
    trend,
    citations: [
      { source: "Yahoo Finance", url: insightsUrl(upper), fetchedAt: new Date().toISOString() },
    ],
  };
}

export { insightsUrl };
