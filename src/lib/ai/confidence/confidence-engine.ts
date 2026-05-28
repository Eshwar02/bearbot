import type { ConfidenceScore, ConfidenceFactors } from './confidence-types';
import {
  calculateAverageReliability,
  countFirstPartyFinancialDomains,
  detectDuplicateDomains,
} from './source-reliability';
import {
  countUncertaintyPhrases,
  countFreshSources,
  clampScore,
  getLabelFromScore,
  extractDomains,
} from './confidence-utils';

export function calculateConfidenceScore(factors: ConfidenceFactors): ConfidenceScore {
  // Baseline reflects that the assistant is a tuned LLM with retrieval,
  // function-calling, and live market access. A blank answer with no signals
  // should still start in the "reasonable" band, not at coin-flip.
  let score = 62;
  const penalties: string[] = [];
  const bonuses: string[] = [];
  const reasoning: string[] = [];

  const { responseText, sources, marketData } = factors;

  // Extract unique domains
  const domains = extractDomains(sources);
  const uniqueDomains = new Set(domains.map((d) => d.toLowerCase()));

  // ─────────────────────────────────────────────────────────────────────────────
  // PENALTY: No sources
  // Soft — most general-knowledge questions ("explain dividend yield") do not
  // need web citations. The bigger signals are response structure and live data.
  // ─────────────────────────────────────────────────────────────────────────────
  if (sources.length === 0 && !marketData) {
    score -= 6;
    penalties.push('No external sources or live market data (-6)');
    reasoning.push('Answer drawn from model knowledge alone.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUS: Multiple unique sources
  // ─────────────────────────────────────────────────────────────────────────────
  if (uniqueDomains.size >= 4) {
    score += 14;
    bonuses.push('4+ unique sources (+14)');
    reasoning.push(`${uniqueDomains.size} distinct sources strengthen credibility.`);
  } else if (uniqueDomains.size >= 3) {
    score += 10;
    bonuses.push('3 unique sources (+10)');
    reasoning.push(`${uniqueDomains.size} distinct sources strengthen credibility.`);
  } else if (uniqueDomains.size === 2) {
    score += 6;
    bonuses.push('2 unique sources (+6)');
  } else if (uniqueDomains.size === 1) {
    score += 3;
    bonuses.push('1 source cited (+3)');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUS: Multi-source corroboration from first-party financial data
  // When 2+ distinct first-party domains (insights, yahoo, finnhub) appear
  // in the citations the answer is grounded in independently sourced live
  // data — +5, capped at 100 by the clamp below.
  // ─────────────────────────────────────────────────────────────────────────────
  const explicitCorroboration =
    typeof factors.corroborationBonus === 'number' ? factors.corroborationBonus : null;
  const firstPartyCount = countFirstPartyFinancialDomains(domains);
  if (explicitCorroboration !== null && explicitCorroboration > 0) {
    score += explicitCorroboration;
    bonuses.push(`Corroboration bonus (+${explicitCorroboration})`);
    reasoning.push('Multiple first-party financial sources agree.');
  } else if (firstPartyCount >= 2) {
    score += 5;
    bonuses.push(`First-party data corroboration ${firstPartyCount} sources (+5)`);
    reasoning.push('Multiple first-party financial sources agree.');
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
  // BONUS: Market data presence (live quote piped in from /api/chat)
  // ─────────────────────────────────────────────────────────────────────────────
  if (marketData) {
    score += 16;
    bonuses.push('Live market quote present (+16)');
    reasoning.push('Live market data provides quantifiable evidence.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUS: Response structure (sections, lists) signals a deliberate answer
  // rather than a one-liner. Cheap heuristic, no LLM round-trip.
  // ─────────────────────────────────────────────────────────────────────────────
  const headingCount = (responseText.match(/^#{1,6}\s/gm) || []).length;
  const bulletCount = (responseText.match(/^\s*[-*]\s/gm) || []).length;
  if (headingCount >= 2 && bulletCount >= 3) {
    score += 8;
    bonuses.push('Structured response with sections and lists (+8)');
  } else if (headingCount >= 1 || bulletCount >= 3) {
    score += 4;
    bonuses.push('Some response structure (+4)');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BONUS: Substantive length (capped — verbosity is not the same as quality)
  // ─────────────────────────────────────────────────────────────────────────────
  const wordCount = responseText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount >= 400) {
    score += 5;
    bonuses.push('Detailed response (400+ words) (+5)');
  } else if (wordCount >= 150) {
    score += 3;
    bonuses.push('Substantive response (150+ words) (+3)');
  } else if (wordCount < 25 && sources.length === 0 && !marketData) {
    score -= 5;
    penalties.push('Very short answer with no supporting data (-5)');
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
  // Count distinct numeric facts (price levels, percentages, ratios) — a
  // single "5%" is weak; a paragraph with five figures is much stronger.
  const numericMatches = responseText.match(/\b\d+(?:[.,]\d+)?%?\b/g) || [];
  const numericFactCount = numericMatches.length;
  if (numericFactCount >= 6) {
    score += 8;
    bonuses.push(`Rich numerical evidence (${numericFactCount} figures) (+8)`);
    reasoning.push('Quantified data supports the analysis.');
  } else if (numericFactCount >= 2) {
    score += 5;
    bonuses.push(`Numerical evidence (${numericFactCount} figures) (+5)`);
    reasoning.push('Quantified data supports the analysis.');
  } else if (numericFactCount === 1) {
    score += 2;
    bonuses.push('Some numerical evidence (+2)');
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
  // Normalize uncertainty by response length — long, well-cited answers
  // legitimately use a couple of hedges and should not be punished as
  // harshly as a one-liner that hedges three times.
  const uncertaintyCount = countUncertaintyPhrases(responseText);
  const uncertaintyDensity = wordCount > 0 ? uncertaintyCount / wordCount : 0;
  if (uncertaintyCount > 5 && uncertaintyDensity > 0.02) {
    score -= 12;
    penalties.push(`High uncertainty language (${uncertaintyCount} phrases) (-12)`);
    reasoning.push('Frequent uncertainty language indicates confidence gaps.');
  } else if (uncertaintyCount > 2 && uncertaintyDensity > 0.01) {
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
