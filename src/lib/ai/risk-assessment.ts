import { generateResponse } from "./mistral";
import { RISK_ASSESSMENT_PROMPT } from "./prompts";
import { AGENT_CONFIG } from "./config";
import { fetchQuote } from "@/lib/stock/data";
import { fetchHistory } from "@/lib/stock/data";
import { analyzeTechnicals } from "@/lib/stock/technicals";
import { fetchStockNews } from "@/lib/stock/news";
import { assessMacroRisks } from "@/lib/stock/macro";
import type { StockQuote, NewsItem, TechnicalIndicators } from "@/types/stock";
import type {
  RiskLevel,
  RiskReport,
  SectorAllocation,
  StockRiskFlag,
  RiskRecommendation,
} from "@/types/risk";

// ── Types for internal use ──────────────────────────────────────────

interface HoldingInput {
  symbol: string;
  quantity: number;
  avg_buy_price: number;
}

interface EnrichedHolding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  quote: StockQuote;
  news: NewsItem[];
  technicals: TechnicalIndicators;
  macroRisks: string[];
  sector: string;
  currentValue: number;
  pnlPercent: number;
}

const CONCENTRATION_THRESHOLD = 40; // percent

// ── Sector allocation computation ───────────────────────────────────

export function computeSectorAllocation(
  enriched: EnrichedHolding[]
): SectorAllocation[] {
  const totalValue = enriched.reduce((sum, h) => sum + h.currentValue, 0);
  if (totalValue === 0) return [];

  const sectorMap = new Map<
    string,
    { value: number; holdings: string[] }
  >();

  for (const h of enriched) {
    const sector = h.sector || "Unknown";
    const existing = sectorMap.get(sector) || { value: 0, holdings: [] };
    existing.value += h.currentValue;
    existing.holdings.push(h.symbol);
    sectorMap.set(sector, existing);
  }

  return Array.from(sectorMap.entries())
    .map(([sector, data]) => {
      const percentage = (data.value / totalValue) * 100;
      return {
        sector,
        percentage: Math.round(percentage * 10) / 10,
        value: Math.round(data.value * 100) / 100,
        holdings: data.holdings,
        isOverconcentrated: percentage >= CONCENTRATION_THRESHOLD,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

// ── Deterministic risk score computation ─────────────────────────────

export function computeRiskScore(
  enriched: EnrichedHolding[],
  sectorAllocations: SectorAllocation[]
): { score: number; level: RiskLevel } {
  if (enriched.length === 0) return { score: 0, level: "Low" };

  let score = 20; // Base risk score

  // 1. Concentration risk (0–25 points)
  const maxConcentration = Math.max(
    ...sectorAllocations.map((s) => s.percentage),
    0
  );
  if (maxConcentration >= 70) score += 25;
  else if (maxConcentration >= 50) score += 18;
  else if (maxConcentration >= CONCENTRATION_THRESHOLD) score += 12;
  else if (maxConcentration >= 30) score += 5;

  // 2. Portfolio P&L drawdown risk (0–20 points)
  const avgPnl =
    enriched.reduce((sum, h) => sum + h.pnlPercent, 0) / enriched.length;
  if (avgPnl < -20) score += 20;
  else if (avgPnl < -10) score += 14;
  else if (avgPnl < -5) score += 8;
  else if (avgPnl < 0) score += 4;

  // 3. Technical weakness (0–15 points)
  const bearishCount = enriched.filter(
    (h) => h.technicals.trend === "bearish"
  ).length;
  const bearishRatio = bearishCount / enriched.length;
  if (bearishRatio >= 0.6) score += 15;
  else if (bearishRatio >= 0.4) score += 10;
  else if (bearishRatio >= 0.2) score += 5;

  // 4. RSI extremes (0–10 points)
  const overboughtCount = enriched.filter(
    (h) => h.technicals.rsi !== null && h.technicals.rsi > 75
  ).length;
  const oversoldCount = enriched.filter(
    (h) => h.technicals.rsi !== null && h.technicals.rsi < 25
  ).length;
  score += Math.min((overboughtCount + oversoldCount) * 3, 10);

  // 5. Diversification bonus (reduce score for well-diversified portfolios)
  if (sectorAllocations.length >= 4 && maxConcentration < 30) {
    score = Math.max(score - 8, 5);
  }

  // Clamp to 0-100
  score = Math.min(100, Math.max(0, Math.round(score)));

  // Determine level
  let level: RiskLevel;
  if (score >= 75) level = "Critical";
  else if (score >= 50) level = "High";
  else if (score >= 30) level = "Medium";
  else level = "Low";

  return { score, level };
}

// ── News sentiment heuristic ────────────────────────────────────────

function inferNewsSentiment(
  news: NewsItem[]
): "bullish" | "neutral" | "bearish" {
  if (news.length === 0) return "neutral";

  const bearishTerms =
    /crash|plunge|tumble|loss|decline|drop|risk|warning|sell|bearish|negative|downgrade|layoff|scandal|fraud|investigation/i;
  const bullishTerms =
    /surge|rally|gain|rise|upgrade|bullish|positive|growth|record|profit|beat|outperform|expansion|acquisition/i;

  let bullish = 0;
  let bearish = 0;

  for (const item of news) {
    const text = `${item.title} ${item.summary}`;
    if (bullishTerms.test(text)) bullish++;
    if (bearishTerms.test(text)) bearish++;
  }

  if (bullish > bearish + 1) return "bullish";
  if (bearish > bullish + 1) return "bearish";
  return "neutral";
}

// ── Build stock risk flags ──────────────────────────────────────────

function buildStockRiskFlags(enriched: EnrichedHolding[]): StockRiskFlag[] {
  return enriched.map((h) => ({
    symbol: h.symbol,
    name: h.quote.name || h.symbol,
    sector: h.sector,
    currentPrice: h.quote.price,
    changePercent: h.quote.changePercent,
    riskFlags: h.macroRisks.slice(0, 3),
    newsSentiment: inferNewsSentiment(h.news),
    newsHeadlines: h.news.slice(0, 3).map((n) => n.title),
    technicalTrend: h.technicals.trend,
    rsi: h.technicals.rsi,
  }));
}

// ── Generate recommendations from data ──────────────────────────────

function generateRecommendations(
  enriched: EnrichedHolding[],
  sectorAllocations: SectorAllocation[],
  riskScore: number
): RiskRecommendation[] {
  const recommendations: RiskRecommendation[] = [];

  // Check for overconcentrated sectors
  const overconcentrated = sectorAllocations.filter(
    (s) => s.isOverconcentrated
  );
  if (overconcentrated.length > 0) {
    recommendations.push({
      urgency: "act-now",
      title: `Reduce ${overconcentrated[0].sector} exposure`,
      description: `Your portfolio has ${overconcentrated[0].percentage.toFixed(1)}% in ${overconcentrated[0].sector}. Consider rebalancing to reduce concentration risk below 40%.`,
    });
  }

  // Check for holdings with large losses
  const bigLosers = enriched.filter((h) => h.pnlPercent < -15);
  if (bigLosers.length > 0) {
    recommendations.push({
      urgency: "monitor",
      title: "Review underperforming holdings",
      description: `${bigLosers.map((h) => h.symbol).join(", ")} ${bigLosers.length === 1 ? "has" : "have"} significant unrealized losses. Consider setting stop-losses or averaging down if fundamentals remain strong.`,
    });
  }

  // Check for bearish technical trend
  const bearishHoldings = enriched.filter(
    (h) => h.technicals.trend === "bearish"
  );
  if (bearishHoldings.length >= enriched.length * 0.4) {
    recommendations.push({
      urgency: "act-now",
      title: "Bearish momentum across portfolio",
      description: `${bearishHoldings.length} of ${enriched.length} holdings show bearish technical trends. Consider tightening stop-losses and reducing exposure to the weakest performers.`,
    });
  }

  // Check for overbought stocks
  const overbought = enriched.filter(
    (h) => h.technicals.rsi !== null && h.technicals.rsi > 70
  );
  if (overbought.length > 0) {
    recommendations.push({
      urgency: "monitor",
      title: "Overbought stocks detected",
      description: `${overbought.map((h) => h.symbol).join(", ")} ${overbought.length === 1 ? "has" : "have"} RSI above 70. Consider booking partial profits on extended rallies.`,
    });
  }

  // Diversification opportunity
  if (sectorAllocations.length < 3 && enriched.length > 0) {
    recommendations.push({
      urgency: "opportunity",
      title: "Improve diversification",
      description:
        "Your portfolio spans fewer than 3 sectors. Consider adding holdings in uncorrelated sectors (e.g., healthcare, utilities, consumer staples) to reduce overall portfolio risk.",
    });
  }

  // Bullish opportunities
  const bullishHoldings = enriched.filter(
    (h) => h.technicals.trend === "bullish" && h.pnlPercent > 0
  );
  if (bullishHoldings.length > 0 && riskScore < 50) {
    recommendations.push({
      urgency: "opportunity",
      title: "Momentum in your favor",
      description: `${bullishHoldings.map((h) => h.symbol).join(", ")} ${bullishHoldings.length === 1 ? "shows" : "show"} bullish trends with positive returns. Consider adding to positions on dips with proper risk management.`,
    });
  }

  return recommendations.slice(0, 5);
}

// ── Build AI context string ─────────────────────────────────────────

function buildRiskContext(
  enriched: EnrichedHolding[],
  sectorAllocations: SectorAllocation[]
): string {
  const totalValue = enriched.reduce((sum, h) => sum + h.currentValue, 0);
  let context = `PORTFOLIO RISK ANALYSIS DATA\n\n`;
  context += `Total Portfolio Value: ${totalValue.toFixed(2)}\n`;
  context += `Number of Holdings: ${enriched.length}\n\n`;

  // Sector allocations
  context += `SECTOR ALLOCATIONS\n`;
  for (const sa of sectorAllocations) {
    const warning = sa.isOverconcentrated ? " ⚠️ OVERCONCENTRATED" : "";
    context += `- ${sa.sector}: ${sa.percentage.toFixed(1)}% (${sa.holdings.join(", ")})${warning}\n`;
  }
  context += "\n";

  // Per-stock data
  for (const h of enriched) {
    context += `--- ${h.symbol} (${h.quote.name || h.symbol}) ---\n`;
    context += `Sector: ${h.sector}\n`;
    context += `Price: ${h.quote.currency} ${h.quote.price.toFixed(2)} | Change: ${h.quote.changePercent >= 0 ? "+" : ""}${h.quote.changePercent.toFixed(2)}%\n`;
    context += `P&L: ${h.pnlPercent >= 0 ? "+" : ""}${h.pnlPercent.toFixed(2)}% | Value: ${h.currentValue.toFixed(2)}\n`;
    context += `Technical Trend: ${h.technicals.trend.toUpperCase()}`;
    if (h.technicals.rsi !== null)
      context += ` | RSI: ${h.technicals.rsi.toFixed(1)}`;
    if (h.technicals.sma20 !== null)
      context += ` | SMA20: ${h.technicals.sma20.toFixed(2)}`;
    context += "\n";

    if (h.news.length > 0) {
      context += `Recent News:\n`;
      for (const n of h.news.slice(0, 3)) {
        context += `  - ${n.title} (${n.source}, ${n.publishedAt.split("T")[0]})\n`;
      }
    }

    if (h.macroRisks.length > 0) {
      context += `Macro Risks:\n`;
      for (const r of h.macroRisks.slice(0, 3)) {
        context += `  - ${r}\n`;
      }
    }
    context += "\n";
  }

  return context;
}

// ── Public API: Enrich holdings with market data ────────────────────

export async function enrichHoldings(
  holdings: HoldingInput[]
): Promise<EnrichedHolding[]> {
  const results = await Promise.allSettled(
    holdings.map(async (holding) => {
      const [quote, history, news] = await Promise.all([
        fetchQuote(holding.symbol),
        fetchHistory(holding.symbol, 1),
        fetchStockNews(holding.symbol, ""),
      ]);

      if (!quote) return null;

      const technicals = analyzeTechnicals(history, quote.price);
      const sector =
        (quote as StockQuote & { sector?: string }).sector || "Unknown";
      const country =
        (quote as StockQuote & { country?: string }).country || "";
      const macroRisks = assessMacroRisks(holding.symbol, sector, country);
      const currentValue = quote.price * holding.quantity;
      const invested = holding.avg_buy_price * holding.quantity;
      const pnlPercent = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0;

      const enriched: EnrichedHolding = {
        symbol: holding.symbol,
        quantity: holding.quantity,
        avgBuyPrice: holding.avg_buy_price,
        quote,
        news,
        technicals,
        macroRisks,
        sector,
        currentValue,
        pnlPercent,
      };
      return enriched;
    })
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<EnrichedHolding | null> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value)
    .filter((v): v is EnrichedHolding => v !== null);
}

// ── Public API: Full risk assessment ────────────────────────────────

export async function assessPortfolioRisk(
  portfolioData: string,
  newsContext: string
): Promise<string> {
  const prompt = `Portfolio Data:\n${portfolioData}\n\nRecent News:\n${newsContext}`;

  try {
    const result = await generateResponse(prompt, {
      systemPrompt: RISK_ASSESSMENT_PROMPT,
      stream: false,
      model: "mistral-large-latest",
      temperature: AGENT_CONFIG.risk.temp,
      maxTokens: AGENT_CONFIG.risk.maxTokens,
      timeoutMs: AGENT_CONFIG.risk.timeoutMs,
    });
    return typeof result === "string" ? result : "";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Unable to assess portfolio risk. ${message}`;
  }
}

// ── Public API: Generate full structured risk report ─────────────────

export async function generateRiskReport(
  holdings: HoldingInput[]
): Promise<RiskReport> {
  const enriched = await enrichHoldings(holdings);
  const sectorAllocations = computeSectorAllocation(enriched);
  const { score, level } = computeRiskScore(enriched, sectorAllocations);
  const stockRisks = buildStockRiskFlags(enriched);

  // Collect unique macro threats
  const macroSet = new Set<string>();
  for (const h of enriched) {
    for (const r of h.macroRisks.slice(0, 2)) {
      macroSet.add(r);
    }
  }
  const macroThreats = Array.from(macroSet).slice(0, 8);

  // Generate concentration warnings
  const concentrationWarnings = sectorAllocations
    .filter((s) => s.isOverconcentrated)
    .map(
      (s) =>
        `${s.sector} sector is overconcentrated at ${s.percentage.toFixed(1)}% of portfolio (threshold: ${CONCENTRATION_THRESHOLD}%)`
    );

  // Generate deterministic recommendations
  const recommendations = generateRecommendations(
    enriched,
    sectorAllocations,
    score
  );

  // Build context for AI narrative
  const context = buildRiskContext(enriched, sectorAllocations);

  // Generate AI narrative
  let aiNarrative = "";
  try {
    aiNarrative = await assessPortfolioRisk(context, "");
  } catch {
    aiNarrative = "AI analysis is temporarily unavailable. Please review the data-driven insights above.";
  }

  return {
    riskLevel: level,
    riskScore: score,
    sectorAllocations,
    concentrationWarnings,
    stockRisks,
    macroThreats,
    aiNarrative,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
