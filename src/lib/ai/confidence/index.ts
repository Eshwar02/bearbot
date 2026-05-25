export { calculateConfidenceScore } from './confidence-engine';
export {
  normalizeSourceDomain,
  getSourceReliability,
  calculateAverageReliability,
  detectDuplicateDomains,
} from './source-reliability';
export {
  countUncertaintyPhrases,
  isSourceFresh,
  countFreshSources,
  clampScore,
  getLabelFromScore,
  extractDomains,
  extractDomainFromUrl,
  UNCERTAINTY_PHRASES,
} from './confidence-utils';
export type { ConfidenceScore, ConfidenceMetadata, ConfidenceFactors, SourceReliabilityMap } from './confidence-types';
