export type ConfidenceLabel = 'Low' | 'Moderate' | 'High';

export interface ConfidenceScore {
  score: number;
  label: ConfidenceLabel;
  reliabilityScore: number;
  reasoning: string[];
  penalties: string[];
  bonuses: string[];
}

export interface ConfidenceMetadata {
  score: number;
  label: ConfidenceLabel;
  reliabilityScore: number;
  reasoning: string[];
}

export interface SourceReliabilityMap {
  [domain: string]: number;
}

export interface ConfidenceFactors {
  responseText: string;
  sources: Array<{ url: string; domain?: string; title?: string; publishedAt?: string }>;
  marketData: boolean;
  sentimentAnalysis?: {
    agreementLevel?: 'high' | 'medium' | 'low';
  };
  /**
   * Optional pre-computed corroboration bonus. The engine computes this
   * automatically from the citation list, but the field is exposed so
   * callers can opt in to an explicit override (e.g. tests).
   */
  corroborationBonus?: number;
}
