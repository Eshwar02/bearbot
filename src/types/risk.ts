// ── Portfolio Risk Analysis types ─────────────────────────────────────

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface SectorAllocation {
  sector: string;
  percentage: number;
  value: number;
  holdings: string[];
  isOverconcentrated: boolean;
}

export interface StockRiskFlag {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  changePercent: number;
  riskFlags: string[];
  newsSentiment: "bullish" | "neutral" | "bearish";
  newsHeadlines: string[];
  technicalTrend: "bullish" | "bearish" | "neutral";
  rsi: number | null;
}

export interface RiskRecommendation {
  urgency: "opportunity" | "monitor" | "act-now";
  title: string;
  description: string;
}

export interface RiskReport {
  riskLevel: RiskLevel;
  riskScore: number;
  sectorAllocations: SectorAllocation[];
  concentrationWarnings: string[];
  stockRisks: StockRiskFlag[];
  macroThreats: string[];
  aiNarrative: string;
  recommendations: RiskRecommendation[];
  generatedAt: string;
}
