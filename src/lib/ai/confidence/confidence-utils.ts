export const UNCERTAINTY_PHRASES = [
  'might',
  'possibly',
  'unclear',
  'not enough data',
  'speculative',
  'uncertain',
  'unclear',
  'doubt',
  'not sure',
  'seems like',
  'appears to be',
  'could be',
  'may be',
];

export function countUncertaintyPhrases(text: string): number {
  const lowerText = text.toLowerCase();
  let count = 0;

  for (const phrase of UNCERTAINTY_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = lowerText.match(regex);
    count += matches ? matches.length : 0;
  }

  return count;
}

export function isSourceFresh(publishedAt: string | undefined): boolean {
  if (!publishedAt) return false;
  try {
    const sourceDate = new Date(publishedAt).getTime();
    const now = Date.now();
    const hoursOld = (now - sourceDate) / (1000 * 60 * 60);
    return hoursOld < 24;
  } catch {
    return false;
  }
}

export function countFreshSources(sources: Array<{ publishedAt?: string }>): number {
  return sources.filter((s) => isSourceFresh(s.publishedAt)).length;
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getLabelFromScore(score: number): 'Low' | 'Moderate' | 'High' {
  if (score <= 39) return 'Low';
  if (score <= 69) return 'Moderate';
  return 'High';
}

export function extractDomains(
  sources: Array<{ url: string; domain?: string }>
): string[] {
  return sources
    .map((s) => s.domain || extractDomainFromUrl(s.url))
    .filter((d): d is string => Boolean(d));
}

export function extractDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}
