# Confidence Meter Integration Guide

## Quick Start

### 1. Backend: Calculate Confidence for New Responses

In `/api/chat/route.ts` or any response handler:

```typescript
import { calculateConfidenceScore } from '@/lib/ai/confidence';

// When persisting an AI response
const fullResponse = "Analysis text here...";
const sources = webSearch?.sources || [];
const hasMarketData = stockAnalysis !== null;

const confidenceResult = calculateConfidenceScore({
  responseText: fullResponse,
  sources: sources,
  marketData: hasMarketData,
  sentimentAnalysis: {
    agreementLevel: 'high', // analyze if sources agree
  },
});

// Store in message metadata
metadata.confidence = {
  score: confidenceResult.score,
  label: confidenceResult.label,
  reliabilityScore: confidenceResult.reliabilityScore,
  reasoning: confidenceResult.reasoning,
};
```

### 2. Frontend: Display Confidence Badge

In any component that renders messages:

```typescript
import { ConfidenceBadge } from '@/components/chat/confidence-badge';

// Extract confidence from message metadata
const confidence = message.metadata?.confidence;

// Render badge if confidence exists
{confidence && (
  <ConfidenceBadge
    score={confidence.score}
    label={confidence.label}
    reliabilityScore={confidence.reliabilityScore}
    reasoning={confidence.reasoning}
  />
)}
```

## Customization

### Adjust Scoring Weights

Edit `src/lib/ai/confidence/confidence-engine.ts`:

```typescript
// Change bonus amounts
if (uniqueDomains.size >= 3) {
  score += 10; // ← Adjust this value
  bonuses.push('Multiple unique sources (+10)');
}

// Change penalty amounts
if (sources.length === 0) {
  score -= 20; // ← Adjust this value
  penalties.push('No sources provided (-20)');
}
```

### Add New Source Reliability Ratings

Edit `src/lib/ai/confidence/source-reliability.ts`:

```typescript
const SOURCE_RELIABILITY: SourceReliabilityMap = {
  'bloomberg.com': 95,
  'reuters.com': 95,
  'wsj.com': 92,
  // Add new sources here:
  'custom-source.com': 85,
};
```

### Customize UI Colors

Edit `src/components/chat/confidence-badge.tsx`:

```typescript
const getColorScheme = (label: string) => {
  switch (label) {
    case 'High':
      return {
        bg: 'bg-green-50 dark:bg-green-950/30',
        // ↑ Change color palette here
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 dark:bg-green-900',
      };
    // ...
  }
};
```

### Add New Uncertainty Phrases

Edit `src/lib/ai/confidence/confidence-utils.ts`:

```typescript
export const UNCERTAINTY_PHRASES = [
  'might',
  'possibly',
  'unclear',
  // Add more phrases:
  'unclear',
  'appears to be',
  'seems like',
  'custom-hedge-phrase',
];
```

## Advanced Usage

### Sentiment Analysis Integration

Track if sources agree on sentiment:

```typescript
const confidenceResult = calculateConfidenceScore({
  responseText,
  sources,
  marketData,
  sentimentAnalysis: {
    agreementLevel: await analyzeSentimentAgreement(sources),
  },
});
```

### Custom Confidence Factors

For specific use cases (e.g., portfolio analysis):

```typescript
// Calculate custom confidence in a stock analysis
const stockConfidence = calculateConfidenceScore({
  responseText: analysis,
  sources: [
    { url: 'https://bloomberg.com/quote/AAPL', publishedAt: now },
    { url: 'https://finance.yahoo.com/quote/AAPL', publishedAt: now },
  ],
  marketData: true, // We have live quote data
  sentimentAnalysis: {
    agreementLevel: 'high', // Multiple bullish sources
  },
});

// High confidence for well-supported recommendations
console.log(stockConfidence.score); // 80+
```

## Testing Your Changes

Run the test suite:

```bash
npm test -- confidence-engine.test.ts
```

Add new tests for custom logic:

```typescript
// In __tests__/confidence-engine.test.ts
it('should give high confidence for 5+ Bloomberg sources', () => {
  const result = calculateConfidenceScore({
    responseText: 'Analysis',
    sources: Array(5).fill({ url: 'https://bloomberg.com' }),
    marketData: true,
  });

  expect(result.score).toBeGreaterThan(75);
  expect(result.label).toBe('High');
});
```

## Monitoring

### Log Confidence Metrics

```typescript
// In your analytics or logging system
console.log({
  confidenceScore: confidenceResult.score,
  confidenceLabel: confidenceResult.label,
  sourceCount: sources.length,
  reliabilityScore: confidenceResult.reliabilityScore,
  hasPenalties: confidenceResult.penalties.length > 0,
  penalties: confidenceResult.penalties,
});
```

### Dashboard Metrics

Track aggregate confidence across conversations:

```typescript
// Average confidence by day
const avgConfidence = messages
  .filter(m => m.role === 'assistant' && m.metadata?.confidence)
  .map(m => m.metadata.confidence.score)
  .reduce((a, b) => a + b, 0) / messageCount;

// Confidence distribution
const distribution = {
  high: messages.filter(m => m.metadata?.confidence?.label === 'High').length,
  moderate: messages.filter(m => m.metadata?.confidence?.label === 'Moderate').length,
  low: messages.filter(m => m.metadata?.confidence?.label === 'Low').length,
};
```

## Troubleshooting

### Confidence Always "Low"

Check:
1. Are sources being provided? `sources.length > 0`
2. Is market data being detected? `marketData: true`
3. Are sources recent? Check `publishedAt` timestamps
4. Does the response contain uncertainty phrases? (May penalize)

### Reliability Score Always 50%

This is the default for unknown sources. Check:
1. Are source domains being normalized correctly?
2. Are domains in `SOURCE_RELIABILITY` map?
3. Is `normalizeSourceDomain()` working?

```typescript
import { normalizeSourceDomain, getSourceReliability } from '@/lib/ai/confidence';

const domain = normalizeSourceDomain('https://www.example.com/article');
console.log(domain); // Should be 'example.com'
console.log(getSourceReliability(domain)); // Should be 50 or mapped value
```

## Performance Tips

1. **Cache scores** - Confidence calculated once per message, not recalculated
2. **Lightweight calculation** - ~2-5ms per response, no external APIs
3. **Streaming compatible** - Calculate after full response assembled
4. **Type-safe** - No runtime overhead from type checks

## Future Roadmap

- [ ] Persist confidence trends in database
- [ ] ML-based source quality adjustment
- [ ] User feedback loop for confidence calibration
- [ ] Real-time confidence sparklines
- [ ] A/B testing confidence impact on user engagement
- [ ] Confidence audit trails (why score changed)
