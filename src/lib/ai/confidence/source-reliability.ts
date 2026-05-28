import type { SourceReliabilityMap } from './confidence-types';

const SOURCE_RELIABILITY: SourceReliabilityMap = {
  'bloomberg.com': 95,
  'reuters.com': 95,
  'wsj.com': 92,
  'insights.alphasightai.online': 90,
  'finnhub.io': 88,
  'finance.yahoo.com': 80,
  'query1.finance.yahoo.com': 80,
  'query2.finance.yahoo.com': 80,
  'marketaux.com': 78,
  'newsdata.io': 75,
  'reddit.com': 40,
};

// First-party financial data domains. When 2+ of these appear in a single
// answer's citations, the confidence engine awards a small corroboration
// bonus — "insights says X and finnhub agrees" is meaningfully stronger than
// either alone.
const FIRST_PARTY_FINANCIAL_DOMAINS = new Set<string>([
  'insights.alphasightai.online',
  'finnhub.io',
  'finance.yahoo.com',
  'query1.finance.yahoo.com',
  'query2.finance.yahoo.com',
]);

export function countFirstPartyFinancialDomains(domains: string[]): number {
  const seen = new Set<string>();
  for (const d of domains) {
    const norm = d.toLowerCase();
    if (FIRST_PARTY_FINANCIAL_DOMAINS.has(norm)) seen.add(norm);
  }
  return seen.size;
}

const DEFAULT_RELIABILITY = 50;

export function normalizeSourceDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname.toLowerCase();
    if (domain.startsWith('www.')) {
      domain = domain.slice(4);
    }
    return domain;
  } catch {
    return '';
  }
}

export function getSourceReliability(domain: string): number {
  const normalized = domain.toLowerCase();
  return SOURCE_RELIABILITY[normalized] ?? DEFAULT_RELIABILITY;
}

export function calculateAverageReliability(domains: string[]): number {
  if (domains.length === 0) return DEFAULT_RELIABILITY;
  const scores = domains.map(getSourceReliability);
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
}

export function detectDuplicateDomains(domains: string[]): { unique: Set<string>; duplicates: Set<string> } {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const unique = new Set<string>();

  for (const domain of domains) {
    const normalized = domain.toLowerCase();
    if (seen.has(normalized)) {
      duplicates.add(normalized);
    } else {
      seen.add(normalized);
      unique.add(normalized);
    }
  }

  return { unique, duplicates };
}
