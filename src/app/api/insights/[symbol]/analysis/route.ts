import { NextRequest, NextResponse } from "next/server";
import { generateResponse } from "@/lib/ai/mistral";
import { getCompanyOverview, getCompanyFinancials } from "@/lib/insights/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an equity-analysis assistant. You are given live company data from Yahoo Finance and Finnhub. Write a concise investment briefing in markdown with these sections, exactly in this order:

## Business
2-3 lines: what the company does, its sector, scale.

## Recent performance
4-5 bullets covering revenue, profitability, margins, and any growth trend from the data provided. Quote specific numbers.

## Strengths
3 bullets.

## Risks
3 bullets.

## Verdict
1-2 sentences, plain language, no buy/sell recommendation — describe how the data reads, not what the user should do.

Rules:
- Use ONLY the numbers in the data block. Do not invent figures.
- If a number is missing, say "data not available" instead of guessing.
- Keep total length under 300 words.
- Format currency with the symbol from the data (₹ for .NS/.BO, $ otherwise).`;

function buildDataBlock(
  overview: NonNullable<Awaited<ReturnType<typeof getCompanyOverview>>>,
  financials: Awaited<ReturnType<typeof getCompanyFinancials>>,
): string {
  const lastIncome = financials?.income.annual?.[0];
  const lastQuarter = financials?.income.quarterly?.[0];
  return [
    `Ticker: ${overview.symbol}`,
    `Name: ${overview.profile.longName}`,
    `Sector: ${overview.profile.sector}`,
    `Industry: ${overview.profile.industry}`,
    `Exchange: ${overview.profile.exchange}`,
    `Currency: ${overview.profile.currency}`,
    `Market cap: ${overview.profile.marketCap ?? "n/a"}`,
    `Price: ${overview.quote.price ?? "n/a"}`,
    `Previous close: ${overview.quote.previousClose ?? "n/a"}`,
    `Ratios: ${JSON.stringify(overview.ratios)}`,
    lastIncome ? `Last annual income statement: ${JSON.stringify(lastIncome)}` : "Last annual income: n/a",
    lastQuarter ? `Most recent quarter: ${JSON.stringify(lastQuarter)}` : "Most recent quarter: n/a",
    `Summary: ${overview.profile.summary?.slice(0, 600) ?? ""}`,
  ].join("\n");
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });

  try {
    const [overview, financials] = await Promise.all([
      getCompanyOverview(symbol),
      getCompanyFinancials(symbol),
    ]);
    if (!overview) return NextResponse.json({ error: "not found" }, { status: 404 });

    const userPrompt = `Analyze the following company:\n\n${buildDataBlock(overview, financials)}`;
    const stream = req.nextUrl.searchParams.get("stream") === "1";
    const result = await generateResponse(userPrompt, {
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 600,
      stream,
      timeoutMs: 40_000,
    });

    if (stream && typeof result !== "string") {
      return new Response(result, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({
      symbol: overview.symbol,
      analysis: typeof result === "string" ? result : "",
      citations: overview.citations,
    });
  } catch (e) {
    console.error("[/api/insights/analysis]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
