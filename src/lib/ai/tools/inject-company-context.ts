/**
 * Helper that detects a company query inside the user's message, pre-fetches
 * the insights tools' overview + financials in parallel, and returns:
 *
 *   - an enriched system prompt with a compact JSON "Live company data" block
 *     plus an explicit instruction to ground answers in that data;
 *   - a list of `Citation` rows ready to be appended to whatever citations
 *     array the confidence engine reads in /api/chat/route.ts.
 *
 * The route uses this so the chat orchestrator does not need to grow another
 * branch — the helper is a no-op when no company query is detected.
 */
import {
  detectCompanyQuery,
  runInsightsTool,
} from "@/lib/ai/tools/insights-tools";

export type InjectedCitation = {
  url: string;
  publishedAt?: string;
  title?: string;
  domain?: string;
};

export type CompanyContextResult = {
  prompt: string;
  citations: InjectedCitation[];
  symbol: string | null;
  hasData: boolean;
  insightsUrl: string | null;
};

const INSIGHTS_HOST = "insights.alphasightai.online";
const buildInsightsUrl = (sym: string): string =>
  `https://${INSIGHTS_HOST}/${encodeURIComponent(sym.toUpperCase())}`;

function safeDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * Pre-fetches the insights overview + financials for a company query and
 * returns an enriched system prompt + citation list. Failures (network,
 * rate limit, missing ticker) never throw — they simply degrade to the
 * original prompt so the chat keeps working.
 */
export async function enrichSystemPromptWithCompanyData(
  message: string,
  basePrompt: string,
): Promise<CompanyContextResult> {
  const detected = detectCompanyQuery(message);
  if (!detected) {
    return {
      prompt: basePrompt,
      citations: [],
      symbol: null,
      hasData: false,
      insightsUrl: null,
    };
  }

  const symbol = detected.symbol;

  let overviewResult: Awaited<ReturnType<typeof runInsightsTool<"get_company_overview">>>;
  let financialsResult: Awaited<ReturnType<typeof runInsightsTool<"get_company_financials">>>;
  try {
    [overviewResult, financialsResult] = await Promise.all([
      runInsightsTool("get_company_overview", { symbol }),
      runInsightsTool("get_company_financials", { symbol }),
    ]);
  } catch {
    return {
      prompt: basePrompt,
      citations: [],
      symbol,
      hasData: false,
      insightsUrl: buildInsightsUrl(symbol),
    };
  }

  const insightsLink = buildInsightsUrl(symbol);

  const citations: InjectedCitation[] = [];
  const liveBlock: Record<string, unknown> = { symbol };
  let hasAnyData = false;

  if (overviewResult.ok) {
    hasAnyData = true;
    liveBlock.overview = {
      profile: overviewResult.data.profile,
      ratios: overviewResult.data.ratios,
      quote: overviewResult.data.quote,
    };
    citations.push({
      url: insightsLink,
      publishedAt: overviewResult.fetchedAt,
      title: `Insights — ${symbol}`,
      domain: INSIGHTS_HOST,
    });
    // If overview used Finnhub corroboration, surface that as a separate
    // citation so the confidence engine sees two distinct domains.
    for (const c of overviewResult.data.citations) {
      const dom = safeDomain(c.url);
      if (dom && dom !== INSIGHTS_HOST) {
        citations.push({
          url: c.url,
          publishedAt: c.fetchedAt,
          title: c.source,
          domain: dom,
        });
      }
    }
  } else {
    liveBlock.overview = { error: overviewResult.reason };
  }

  if (financialsResult.ok) {
    hasAnyData = true;
    // Trim to most recent 4 periods to keep the prompt compact.
    const f = financialsResult.data;
    liveBlock.financials = {
      income: {
        annual: f.income.annual.slice(0, 4),
        quarterly: f.income.quarterly.slice(0, 4),
      },
      balance: {
        annual: f.balance.annual.slice(0, 4),
        quarterly: f.balance.quarterly.slice(0, 4),
      },
      cashflow: {
        annual: f.cashflow.annual.slice(0, 4),
        quarterly: f.cashflow.quarterly.slice(0, 4),
      },
    };
    // Don't double-citation if same insights URL already added.
    if (!citations.some((c) => c.url === insightsLink)) {
      citations.push({
        url: insightsLink,
        publishedAt: financialsResult.fetchedAt,
        title: `Insights — ${symbol}`,
        domain: INSIGHTS_HOST,
      });
    }
  } else {
    liveBlock.financials = { error: financialsResult.reason };
  }

  if (!hasAnyData) {
    return {
      prompt: basePrompt,
      citations: [],
      symbol,
      hasData: false,
      insightsUrl: insightsLink,
    };
  }

  const liveDataBlock = [
    `Live company data for ${symbol} (pre-fetched from the insights API):`,
    "```json",
    JSON.stringify(liveBlock, null, 2),
    "```",
    `When answering questions about ${symbol}, you MUST use the numbers in the Live company data block above. If a metric is missing, say "data not available" rather than guessing. Cite the insights page URL once at the end: ${insightsLink}`,
  ].join("\n");

  const prompt = basePrompt ? `${basePrompt}\n\n${liveDataBlock}` : liveDataBlock;

  return {
    prompt,
    citations,
    symbol,
    hasData: true,
    insightsUrl: insightsLink,
  };
}
