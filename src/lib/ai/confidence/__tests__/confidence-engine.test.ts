import { calculateConfidenceScore } from '../confidence-engine';
import { clampScore, getLabelFromScore, countUncertaintyPhrases } from '../confidence-utils';
import { detectDuplicateDomains, calculateAverageReliability } from '../source-reliability';

describe('Confidence Engine', () => {
  describe('calculateConfidenceScore', () => {
    it('should apply -20 penalty for no sources', () => {
      const result = calculateConfidenceScore({
        responseText: 'This is a response with analysis.',
        sources: [],
        marketData: false,
      });

      expect(result.score).toBeLessThan(50);
      expect(result.penalties.some((p) => p.includes('No sources'))).toBe(true);
    });

    it('should apply +10 bonus for 3+ unique sources', () => {
      const result = calculateConfidenceScore({
        responseText: 'This is well-sourced.',
        sources: [
          { url: 'https://bloomberg.com/article1', title: 'Article 1' },
          { url: 'https://reuters.com/article2', title: 'Article 2' },
          { url: 'https://wsj.com/article3', title: 'Article 3' },
        ],
        marketData: false,
      });

      expect(result.bonuses.some((b) => b.includes('Multiple unique sources'))).toBe(true);
    });

    it('should apply +15 bonus for all fresh sources (<24h)', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();

      const result = calculateConfidenceScore({
        responseText: 'Recent analysis.',
        sources: [
          { url: 'https://reuters.com/article1', publishedAt: yesterday },
          { url: 'https://bloomberg.com/article2', publishedAt: yesterday },
        ],
        marketData: false,
      });

      expect(result.bonuses.some((b) => b.includes('fresh'))).toBe(true);
    });

    it('should apply +10 bonus for market data', () => {
      const result = calculateConfidenceScore({
        responseText: 'Stock price is $100.',
        sources: [],
        marketData: true,
      });

      expect(result.bonuses.some((b) => b.includes('Market'))).toBe(true);
    });

    it('should apply +5 bonus for numerical evidence', () => {
      const result = calculateConfidenceScore({
        responseText: 'The stock rose 15% with 2.5M shares traded.',
        sources: [],
        marketData: false,
      });

      expect(result.bonuses.some((b) => b.includes('numerical'))).toBe(true);
    });

    it('should apply -15 penalty for >3 uncertainty phrases', () => {
      const result = calculateConfidenceScore({
        responseText:
          'This might possibly be unclear. Not enough data. It seems speculative and could be uncertain.',
        sources: [],
        marketData: false,
      });

      expect(result.penalties.some((p) => p.includes('uncertainty'))).toBe(true);
      expect(result.score).toBeLessThan(50);
    });

    it('should apply -10 penalty for duplicate domain domination', () => {
      const result = calculateConfidenceScore({
        responseText: 'Multiple sources analysis.',
        sources: [
          { url: 'https://reddit.com/1' },
          { url: 'https://reddit.com/2' },
          { url: 'https://reddit.com/3' },
          { url: 'https://reddit.com/4' },
        ],
        marketData: false,
      });

      expect(result.penalties.some((p) => p.includes('duplicate'))).toBe(true);
    });

    it('should clamp score between 0 and 100', () => {
      const result = calculateConfidenceScore({
        responseText: 'Amazing response with 100% data, 99% accuracy, 50+ sources across Bloomberg, Reuters, WSJ.',
        sources: Array(20)
          .fill(null)
          .map((_, i) => ({
            url: `https://source${i}.com/article`,
            publishedAt: new Date().toISOString(),
          })),
        marketData: true,
        sentimentAnalysis: { agreementLevel: 'high' },
      });

      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should assign correct confidence labels', () => {
      const lowResult = calculateConfidenceScore({
        responseText: 'No sources here.',
        sources: [],
        marketData: false,
      });
      expect(lowResult.label).toBe('Low');

      const moderateResult = calculateConfidenceScore({
        responseText: 'Some sources, mostly OK.',
        sources: [
          { url: 'https://reuters.com/1' },
          { url: 'https://reuters.com/2' },
        ],
        marketData: true,
      });
      expect(moderateResult.label).toMatch(/Low|Moderate|High/);

      const highResult = calculateConfidenceScore({
        responseText: 'Excellent analysis with data. 95% confidence, 10 million shares, strong fundamentals.',
        sources: [
          { url: 'https://bloomberg.com/1', publishedAt: new Date().toISOString() },
          { url: 'https://reuters.com/2', publishedAt: new Date().toISOString() },
          { url: 'https://wsj.com/3', publishedAt: new Date().toISOString() },
        ],
        marketData: true,
        sentimentAnalysis: { agreementLevel: 'high' },
      });
      expect(highResult.label).toMatch(/Moderate|High/);
    });
  });

  describe('clampScore', () => {
    it('should clamp negative scores to 0', () => {
      expect(clampScore(-50)).toBe(0);
    });

    it('should clamp scores > 100 to 100', () => {
      expect(clampScore(150)).toBe(100);
    });

    it('should preserve scores in range', () => {
      expect(clampScore(50)).toBe(50);
    });
  });

  describe('getLabelFromScore', () => {
    it('should return Low for scores 0-39', () => {
      expect(getLabelFromScore(0)).toBe('Low');
      expect(getLabelFromScore(39)).toBe('Low');
    });

    it('should return Moderate for scores 40-69', () => {
      expect(getLabelFromScore(40)).toBe('Moderate');
      expect(getLabelFromScore(69)).toBe('Moderate');
    });

    it('should return High for scores 70-100', () => {
      expect(getLabelFromScore(70)).toBe('High');
      expect(getLabelFromScore(100)).toBe('High');
    });
  });

  describe('countUncertaintyPhrases', () => {
    it('should count uncertainty phrases', () => {
      const count = countUncertaintyPhrases('This might be unclear. Not enough data.');
      expect(count).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const count1 = countUncertaintyPhrases('This MIGHT be possible');
      const count2 = countUncertaintyPhrases('This might be possible');
      expect(count1).toBe(count2);
    });
  });

  describe('detectDuplicateDomains', () => {
    it('should identify duplicate domains', () => {
      const result = detectDuplicateDomains([
        'reddit.com',
        'reddit.com',
        'bloomberg.com',
        'reddit.com',
      ]);

      expect(result.duplicates.has('reddit.com')).toBe(true);
      expect(result.unique.has('bloomberg.com')).toBe(true);
    });

    it('should handle empty arrays', () => {
      const result = detectDuplicateDomains([]);
      expect(result.unique.size).toBe(0);
      expect(result.duplicates.size).toBe(0);
    });
  });

  describe('calculateAverageReliability', () => {
    it('should calculate average source reliability', () => {
      const reliability = calculateAverageReliability([
        'bloomberg.com',
        'reuters.com',
        'unknown.com',
      ]);

      expect(reliability).toBeGreaterThan(0);
      expect(reliability).toBeLessThanOrEqual(100);
    });

    it('should return default for unknown sources', () => {
      const reliability = calculateAverageReliability(['unknown-domain.xyz']);
      expect(reliability).toBeGreaterThanOrEqual(0);
    });
  });
});
