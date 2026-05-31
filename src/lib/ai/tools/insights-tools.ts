/**
 * Chat-side tool layer that consumes the insights data module. The chat
 * orchestrator calls these helpers as if they were tools the model invoked,
 * so the LLM reasons over live, citable JSON instead of stale training data.
 *
 * Implementation note: these helpers call the shared `src/lib/insights/server.ts`
 * functions directly (no HTTP round-trip) so latency stays comparable to a
 * normal data fetch.
 */
import {
  getCompanyOverview,
  getCompanyFinancials,
  getCompanyPeers,
  type CompanyOverview,
  type CompanyFinancials,
  insightsUrl,
} from "@/lib/insights/server";

export const INSIGHTS_TOOLS_CATALOG = `Available insights tools:
- get_company_overview(symbol): live profile + key ratios + quote pulled from Yahoo Finance (Finnhub fallback for US tickers). Returns { profile, ratios, quote } and citations.
- get_company_financials(symbol): annual + quarterly income, balance sheet, and cash-flow statements from Yahoo Finance.
- get_company_peers(symbol): peer recommendation trend from Yahoo Finance.

When a user asks about a specific company, you MUST rely on the data returned by these tools (already pre-fetched and attached as a "Live company data" JSON block in the system prompt) — never invent metrics from prior knowledge. Cite the insights page URL at the end of the answer.`;

export type ToolName =
  | "get_company_overview"
  | "get_company_financials"
  | "get_company_peers";

export type ToolCallResult<T> =
  | { ok: true; data: T; source: string; fetchedAt: string }
  | { ok: false; reason: string };

type ToolDataMap = {
  get_company_overview: CompanyOverview;
  get_company_financials: CompanyFinancials;
  get_company_peers: Awaited<ReturnType<typeof getCompanyPeers>>;
};

// Common Indian companies → NSE tickers. Only used when the user explicitly
// names the company; never used for ambiguous tokens.
const NAME_TO_SYMBOL: ReadonlyArray<readonly [RegExp, string]> = [
  [/\breliance(?:\s+industries)?\b/i, "RELIANCE.NS"],
  [/\btcs\b|\btata\s+consultancy(?:\s+services)?\b/i, "TCS.NS"],
  [/\binfosys\b/i, "INFY.NS"],
  [/\bhdfc\s+bank\b/i, "HDFCBANK.NS"],
  [/\bicici\s+bank\b/i, "ICICIBANK.NS"],
  [/\bsbi\b|\bstate\s+bank\s+of\s+india\b/i, "SBIN.NS"],
  [/\bwipro\b/i, "WIPRO.NS"],
  [/\bbajaj\s+finance\b/i, "BAJFINANCE.NS"],
];

// Reused from src/lib/ai/index.ts:307 (do NOT redefine the canonical regex).
const TICKER_REGEX = /\$?([A-Z]{1,10}(?:\.[A-Z]{1,2})?)\b/;

// Words that look like uppercase tickers but are common English. Keeps the
// detector from firing on "I" / "A" / "AI" etc.
const TICKER_STOPWORDS = new Set([
  "A",
  "I",
  "AI",
  "AM",
  "AN",
  "AS",
  "AT",
  "BE",
  "BY",
  "DO",
  "GO",
  "HI",
  "IF",
  "IN",
  "IS",
  "IT",
  "ME",
  "MY",
  "NO",
  "OF",
  "ON",
  "OR",
  "OK",
  "SO",
  "TO",
  "UP",
  "US",
  "WE",
  "YES",
  "OK",
  "THE",
  "AND",
  "OUR",
  "FOR",
  "YOU",
  "WHO",
  "WHY",
  "HOW",
  "NEW",
]);

/**
 * Detects a company query: either an explicit ticker symbol or a named
 * company from the curated Indian name→symbol map. Returns null if there's
 * no clear company target — we deliberately stay conservative to avoid
 * pre-fetching data the model never needed.
 */
export function detectCompanyQuery(message: string): { symbol: string } | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  // Dollar-prefixed tickers are an unambiguous signal.
  const dollarMatch = trimmed.match(/\$([A-Z]{1,10}(?:\.[A-Z]{1,2})?)\b/);
  if (dollarMatch?.[1]) return { symbol: dollarMatch[1].toUpperCase() };

  // Named company match — only when the user explicitly names the company.
  for (const [pattern, symbol] of NAME_TO_SYMBOL) {
    if (pattern.test(trimmed)) return { symbol };
  }

  // Bare uppercase ticker (e.g. "RELIANCE.NS", "AAPL"). Filter common
  // English words by requiring either a dot suffix OR length >= 3 AND not a
  // stopword.
  const bareMatch = trimmed.match(TICKER_REGEX);
  if (bareMatch?.[1]) {
    const candidate = bareMatch[1].toUpperCase();
    const hasSuffix = /\./.test(candidate);
    if (hasSuffix) return { symbol: candidate };
    if (candidate.length >= 3 && !TICKER_STOPWORDS.has(candidate)) {
      return { symbol: candidate };
    }
  }

  return null;
}

export async function runInsightsTool<N extends ToolName>(
  name: N,
  args: { symbol: string },
): Promise<ToolCallResult<ToolDataMap[N]>> {
  const symbol = args.symbol?.trim();
  if (!symbol) return { ok: false, reason: "symbol is required" };

  try {
    let data:
      | CompanyOverview
      | CompanyFinancials
      | Awaited<ReturnType<typeof getCompanyPeers>>
      | null = null;

    if (name === "get_company_overview") {
      data = await getCompanyOverview(symbol);
    } else if (name === "get_company_financials") {
      data = await getCompanyFinancials(symbol);
    } else if (name === "get_company_peers") {
      data = await getCompanyPeers(symbol);
    }

    if (!data) {
      return { ok: false, reason: `no data for symbol ${symbol.toUpperCase()}` };
    }

    const citations = (data as { citations?: Array<{ source: string; url: string; fetchedAt: string }> })
      .citations;
    const first = citations && citations.length > 0 ? citations[0] : null;
    const source = first?.url ?? insightsUrl(symbol);
    const fetchedAt = first?.fetchedAt ?? new Date().toISOString();

    return {
      ok: true,
      data: data as ToolDataMap[N],
      source,
      fetchedAt,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "tool execution failed",
    };
  }
}
