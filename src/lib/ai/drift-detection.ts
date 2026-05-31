import { embedText } from "./embeddings";

export type StockSentiment = "bullish" | "bearish" | "neutral";

export interface StockAnalysisSnapshot {
  symbol: string;
  sentiment: StockSentiment;
  confidenceScore: number;
  riskFactors: string[];
  thesisText: string;
  timestamp: string;
  embedding?: number[];
}

export interface StockDriftResult {
  isDrift: boolean;
  driftScore: number;
  reason: string;
  changedFrom: StockSentiment;
  changedTo: StockSentiment;
  persistentRiskFactors: string[];
  newRiskFactors: string[];
  droppedRiskFactors: string[];
  similarity?: number;
}

const BULLISH_PATTERNS = [
  /\bbullish\b/i,
  /\bbuy\b/i,
  /\boutperform\b/i,
  /\bupgrade\b/i,
  /\baccumulate\b/i,
  /\bpositive\b/i,
  /\bstrong buy\b/i,
  /\bupside\b/i,
  /\bexpansion\b/i,
  /\bsecular tailwind\b/i,
];

const BEARISH_PATTERNS = [
  /\bbearish\b/i,
  /\bsell\b/i,
  /\bunderperform\b/i,
  /\bdowngrade\b/i,
  /\bnegative\b/i,
  /\bweak\b/i,
  /\bheadwind\b/i,
  /\bdownside\b/i,
  /\brisk\b/i,
  /\bcut\b/i,
];

const RISK_PATTERNS: Array<[string, RegExp]> = [
  ["geopolitical", /\b(geopolitical|sanction|trade war|conflict|war|embargo|tension|border dispute|military|diplomatic)\b/i],
  ["macro", /\b(inflation|interest rate|recession|gdp|monetary policy|economic slowdown|demand weakness|stagflation)\b/i],
  ["commodity", /\b(oil|gas|copper|lithium|commodity|raw material|energy price|metal|grain|wheat|nickel)\b/i],
  ["supply chain", /\b(supply chain|logistic|supplier|shipping|port|inventory|shortage|backlog)\b/i],
  ["regulatory", /\b(regulatory|regulation|antitrust|fine|license|compliance|policy change|government)\b/i],
  ["financial", /\b(debt|leverage|margin|cash flow|liquidity|earnings miss|balance sheet|dividend)\b/i],
];

const SENTIMENT_VALUE: Record<StockSentiment, number> = {
  bearish: -1,
  neutral: 0,
  bullish: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function countMatches(patterns: RegExp[], text: string): number {
  return patterns.reduce((count, pattern) => {
    const matches = text.match(pattern);
    return count + (matches?.length ?? 0);
  }, 0);
}

function deriveSentiment(text: string): { sentiment: StockSentiment; confidenceScore: number } {
  const positive = countMatches(BULLISH_PATTERNS, text);
  const negative = countMatches(BEARISH_PATTERNS, text);
  let sentiment: StockSentiment = "neutral";

  if (positive >= 2 && positive >= negative) sentiment = "bullish";
  if (negative >= 2 && negative > positive) sentiment = "bearish";

  const magnitude = Math.abs(positive - negative);
  const score = clamp(Math.min(1, magnitude / 4 + 0.2), 0, 1);
  return { sentiment, confidenceScore: score };
}

function extractThesisText(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const match = cleaned.match(/(bullish case|bearish case|thesis|outlook|recommend|summary|takeaway|final thought|overall view)[^.!?]{0,260}[.!?]/i);
  if (match) {
    return match[0].trim();
  }
  return cleaned.slice(0, 320).trim();
}

function deriveRiskFactors(text: string): string[] {
  const riskSet = new Set<string>();
  for (const [label, pattern] of RISK_PATTERNS) {
    if (pattern.test(text)) {
      riskSet.add(label);
    }
  }
  return Array.from(riskSet);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return clamp(dot / (Math.sqrt(magA) * Math.sqrt(magB)), -1, 1);
}

async function embedThesisText(thesisText: string): Promise<number[] | undefined> {
  try {
    return await embedText(thesisText);
  } catch (error) {
    console.warn("Drift detection embedding failed", error);
    return undefined;
  }
}

export async function extractAnalysisSnapshot(
  responseText: string,
  symbol: string,
  opts?: { includeEmbedding?: boolean }
): Promise<StockAnalysisSnapshot> {
  const normalized = responseText.replace(/\s+/g, " ").trim();
  const { sentiment, confidenceScore } = deriveSentiment(normalized);
  const thesisText = extractThesisText(normalized) || normalized.slice(0, 320);
  const riskFactors = deriveRiskFactors(normalized);
  const snapshot: StockAnalysisSnapshot = {
    symbol,
    sentiment,
    confidenceScore,
    riskFactors,
    thesisText,
    timestamp: new Date().toISOString(),
  };

  if (opts?.includeEmbedding) {
    const embedding = await embedThesisText(thesisText);
    if (embedding) {
      snapshot.embedding = embedding;
    }
  }

  return snapshot;
}

export function detectNarrativeDrift(
  current: StockAnalysisSnapshot,
  previous: StockAnalysisSnapshot[]
): StockDriftResult {
  const baseline = previous[0];
  const changedFrom = baseline.sentiment;
  const changedTo = current.sentiment;

  const sentimentDelta = Math.abs(SENTIMENT_VALUE[changedTo] - SENTIMENT_VALUE[changedFrom]);
  const persistentRiskFactors = baseline.riskFactors.filter((risk) => current.riskFactors.includes(risk));
  const newRiskFactors = current.riskFactors.filter((risk) => !baseline.riskFactors.includes(risk));
  const droppedRiskFactors = baseline.riskFactors.filter((risk) => !current.riskFactors.includes(risk));

  const riskDelta = clamp((newRiskFactors.length + droppedRiskFactors.length) / 4, 0, 1);
  const similarity =
    current.embedding && baseline.embedding ? cosineSimilarity(current.embedding, baseline.embedding) : undefined;
  const similarityPenalty = similarity !== undefined ? (1 - similarity) * 0.3 : 0;

  const baseScore = sentimentDelta * 0.45 + riskDelta * 0.25 + similarityPenalty;
  const driftScore = clamp(baseScore, 0, 1);
  const isDrift = driftScore >= 0.35;

  const phrases: string[] = [];
  if (sentimentDelta >= 1) {
    phrases.push(`The thesis shifted from ${changedFrom} to ${changedTo} compared with the previous view.`);
  }
  if (persistentRiskFactors.length > 0) {
    phrases.push(`These earlier risks still appear: ${persistentRiskFactors.join(", ")}.`);
  }
  if (newRiskFactors.length > 0) {
    phrases.push(`New risk focus emerged: ${newRiskFactors.join(", ")}.`);
  }
  if (droppedRiskFactors.length > 0) {
    phrases.push(`Previously highlighted risks that are now downplayed: ${droppedRiskFactors.join(", ")}.`);
  }
  if (similarity !== undefined) {
    phrases.push(`The thesis wording similarity score is ${similarity.toFixed(2)}.`);
  }

  return {
    isDrift,
    driftScore,
    reason: phrases.length > 0 ? phrases.join(" ") : "No significant narrative drift detected.",
    changedFrom,
    changedTo,
    persistentRiskFactors,
    newRiskFactors,
    droppedRiskFactors,
    similarity,
  };
}
