import { NextRequest, NextResponse } from "next/server";
import {
  fetchQuoteFull,
  fetchHistoryRange,
  fetchCompanyInfo,
  type ChartRange,
} from "@/lib/stock/data";
import { fetchStockNews } from "@/lib/stock/news";
import { analyzeTechnicals } from "@/lib/stock/technicals";
import type { TechnicalIndicators } from "@/types/stock";

const VALID_RANGES: ChartRange[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "ALL"];

function parseRange(input: string | null): ChartRange {
  const upper = (input || "1M").toUpperCase() as ChartRange;
  return VALID_RANGES.includes(upper) ? upper : "1M";
}

/**
 * GET /api/stock/details/[symbol]?range=1M
 *
 * Returns everything the detail page needs in one call:
 *   - quote (price, change, marketCap, day high/low, 52w high/low, …)
 *   - history series matching the requested range (with proper interval)
 *   - 1D sparkline series (for the table rows + hero mini-chart)
 *   - company info (sector, industry, website, description, employees)
 *   - latest news headlines
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    if (!symbol) {
      return NextResponse.json({ error: "Symbol required" }, { status: 400 });
    }

    const url = new URL(request.url);
    const range = parseRange(url.searchParams.get("range"));
    const includeSparkline = url.searchParams.get("sparkline") !== "false";

    const [quote, history, sparkline, info, news] = await Promise.all([
      fetchQuoteFull(symbol).catch(() => null),
      fetchHistoryRange(symbol, range).catch(() => []),
      includeSparkline
        ? fetchHistoryRange(symbol, "1D").catch(() => [])
        : Promise.resolve([]),
      fetchCompanyInfo(symbol).catch(() => null),
      fetchStockNews(symbol).catch(() => []),
    ]);

    const historyData = history || [];
    const currentPrice = quote?.price ?? 0;
    const technicals: TechnicalIndicators | null =
      historyData.length > 20 ? analyzeTechnicals(historyData, currentPrice) : null;

    return NextResponse.json({
      quote,
      history: historyData,
      sparkline,
      info,
      news,
      technicals,
      range,
    });
  } catch (err) {
    console.error("Stock details error:", err);
    return NextResponse.json(
      { error: "Failed to fetch details" },
      { status: 500 }
    );
  }
}
