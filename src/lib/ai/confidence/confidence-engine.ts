import type { ConfidenceScore, ConfidenceFactors } from './confidence-types';
import { calculateAverageReliability, detectDuplicateDomains, normalizeSourceDomain } from './source-reliability';
import {
  countUncertaintyPhrases,
  countFreshSources,
  clampScore,
  getLabelFromScore,
  extractDomains,
} from './confidence-utils';

export function calculateConfidenceScore(factors: ConfidenceFactors): ConfidenceScore {
  let score = 50;
  const penalties: string[] = [];
  const bonuses: string[] = [];
  const reasoning: string[] = [];

  const { responseText, sources, marketData } = factors;

  // Extract unique domains
  const domains = extractDomains(sources);
  const uniqueDomains = new Set(domains.map((d) => d.toLowerCase()));

  // ─────────────────────────────────────────────────────────────────────────────
  // PENALTY: No sources
  // ─────────────────────────────────────────────────────────────────────────────
  if (sources.length === 0) {
    score -= 20;
    penalties.push('No sources provided (-20)');
    reasoning.push('Response lacks source citations, reducing confidence.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUS: Multiple unique sources
  // ─────────────────────────────────────────────────────────────────────────────
  if (uniqueDomains.size >= 3) {
    score += 10;
    bonuses.push('Multiple unique sources (+10)');
    reasoning.push(`${uniqueDomains.size} distinct sources strengthen credibility.`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUS: Fresh sources (< 24h old)
  // ─────────────────────────────────────────────────────────────────────────────
  const freshSourceCount = countFreshSources(sources);
  if (sources.length > 0 && freshSourceCount === sources.length) {
    score += 15;
    bonuses.push('All sources are fresh (<24h) (+15)');
    reasoning.push('Recent data ensures current and relevant information.');
  } else if (freshSourceCount > 0) {
    score += 8;
    bonuses.push(`Some fresh sources ${freshSourceCount}/${sources.length} (+8)`);
    reasoning.push(`${freshSourceCount} sources are recent, though some are older.`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUS: Market data presence
  // ─────────────────────────────────────────────────────────────────────────────
  if (marketData) {
    score += 10;
    bonuses.push('Market quote data present (+10)');
    reasoning.push('Live market data provides quantifiable evidence.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUS: Sentiment agreement (if provided)
  // ─────────────────────────────────────────────────────────────────────────────
  if (factors.sentimentAnalysis?.agreementLevel === 'high') {
    score += 10;
    bonuses.push('Multiple sources agree on sentiment (+10)');
    reasoning.push('Source alignment strengthens analytical confidence.');
  } else if (factors.sentimentAnalysis?.agreementLevel === 'medium') {
    score += 5;
    bonuses.push('Moderate source alignment (+5)');
    reasoning.push('Sources show mixed sentiment.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUS: Numerical evidence
  // ─────────────────────────────────────────────────────────────────────────────
  const hasNumericalEvidence = /\b\d+(?:\.\d+)?%?\b/.test(responseText);
  if (hasNumericalEvidence) {
    score += 5;
    bonuses.push('Contains numerical evidence (+5)');
    reasoning.push('Quantified data supports the analysis.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PENALTY: Duplicate domain domination
  // ─────────────────────────────────────────────────────────────────────────────
  const { duplicates } = detectDuplicateDomains(domains);
  if (sources.length > 0 && duplicates.size > 0) {
    const duplicateCount = Array.from(duplicates).reduce((sum, domain) => {
      return sum + domains.filter((d) => d.toLowerCase() === domain).length - 1;
    }, 0);

    if (duplicateCount > sources.length * 0.5) {
      score -= 10;
      penalties.push('Heavy reliance on duplicate sources (-10)');
      reasoning.push('Over-representation of single domain reduces diversity.');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PENALTY: Uncertainty phrases
  // ─────────────────────────────────────────────────────────────────────────────
  const uncertaintyCount = countUncertaintyPhrases(responseText);
  if (uncertaintyCount > 3) {
    score -= 15;
    penalties.push(`High uncertainty language (${uncertaintyCount} phrases) (-15)`);
    reasoning.push('Frequent uncertainty language indicates confidence gaps.');
  } else if (uncertaintyCount > 0) {
    score -= 5;
    penalties.push(`Some uncertainty language (${uncertaintyCount} phrases) (-5)`);
    reasoning.push('Moderate uncertainty hedging present.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Calculate reliability score
  // ─────────────────────────────────────────────────────────────────────────────
  const reliabilityScore = sources.length > 0 ? calculateAverageReliability(domains) : 50;

  // Clamp final score
  const finalScore = clampScore(score);
  const label = getLabelFromScore(finalScore);

  return {
    score: finalScore,
    label,
    reliabilityScore,
    reasoning,
    penalties,
    bonuses,
  };
}
