# AI Response Confidence Meter

## Overview

The AI Response Confidence Meter provides users with transparent confidence scoring for every AI-generated response in the chat. The confidence score estimates response trustworthiness based on multiple data quality factors.

## Architecture

### Backend Components

#### `confidence-engine.ts`
Core scoring algorithm that calculates confidence scores based on:
- Number of unique sources
- Source freshness (< 24 hours old)
- Market data presence
- Source agreement/sentiment alignment
- Numerical evidence in response
- Duplicate source penalties
- Uncertainty language detection

#### `source-reliability.ts`
Source credibility weighting system:
- Bloomberg, Reuters, WSJ: 95, 95, 92
- Finance.Yahoo: 80
- MarketAux: 78
- NewsData: 75
- Reddit: 40
- Unknown: 50

Provides utilities for:
- Domain normalization
- Reliability score calculation
- Duplicate domain detection

#### `confidence-utils.ts`
Helper functions for:
- Uncertainty phrase detection
- Source freshness validation
- Score clamping (0-100)
- Confidence label assignment

### Frontend Components

#### `ConfidenceBadge.tsx`
Interactive badge component displaying:
- Color-coded confidence indicator (High=Green, Moderate=Yellow, Low=Red)
- Animated appearance
- Expandable tooltip with:
  - Overall score and reliability rating
  - Reasoning factors
  - Source analysis summary

## Scoring Algorithm

### Base Score: 50

### Bonuses:
- `+10` - 3+ unique sources
- `+15` - All sources < 24h old
- `+8` - Some fresh sources
- `+10` - Market data present
- `+10` - Multiple sources agree (high agreement)
- `+5` - Moderate source alignment
- `+5` - Contains numerical evidence

### Penalties:
- `-20` - No sources provided
- `-10` - Heavy duplicate domain reliance (>50% from single domain)
- `-15` - High uncertainty language (>3 phrases)
- `-5` - Moderate uncertainty language (1-3 phrases)

### Final Score: Clamped to 0-100

### Confidence Labels:
- **Low**: 0-39
- **Moderate**: 40-69
- **High**: 70-100

## Usage

### Backend Integration

The confidence score is automatically calculated in `/api/chat` when storing assistant messages:

```typescript
import { calculateConfidenceScore } from '@/lib/ai/confidence';

const confidenceResult = calculateConfidenceScore({
  responseText: fullResponse,
  sources: webSearch.sources,
  marketData: hasMarketData,
  sentimentAnalysis: {
    agreementLevel: 'high' // or 'medium' | 'low'
  }
});

// Result structure:
{
  score: 75,                           // 0-100
  label: 'High',                       // Low | Moderate | High
  reliabilityScore: 85,                // avg source reliability
  reasoning: ['Multiple sources...'], // explanation factors
  penalties: ['...'],                  // applied penalties
  bonuses: ['...']                     // applied bonuses
}
```

Confidence data is stored in message metadata:

```typescript
metadata.confidence = {
  score: confidenceResult.score,
  label: confidenceResult.label,
  reliabilityScore: confidenceResult.reliabilityScore,
  reasoning: confidenceResult.reasoning,
};
```

### Frontend Integration

The `ChatMessage` component automatically displays the confidence badge if metadata is present:

```typescript
// In chat-message.tsx
const confidence = message.metadata?.confidence;

if (confidence) {
  <ConfidenceBadge
    score={confidence.score}
    label={confidence.label}
    reliabilityScore={confidence.reliabilityScore}
    reasoning={confidence.reasoning}
  />
}
```

## Type Safety

All components use strict TypeScript types:

```typescript
export interface ConfidenceScore {
  score: number;
  label: ConfidenceLabel;
  reliabilityScore: number;
  reasoning: string[];
  penalties: string[];
  bonuses: string[];
}

export type ConfidenceLabel = 'Low' | 'Moderate' | 'High';

export interface ConfidenceFactors {
  responseText: string;
  sources: Array<{ url: string; domain?: string; publishedAt?: string }>;
  marketData: boolean;
  sentimentAnalysis?: {
    agreementLevel?: 'high' | 'medium' | 'low';
  };
}
```

## Testing

Comprehensive test suite in `__tests__/confidence-engine.test.ts`:

```bash
npm test -- confidence-engine.test.ts
```

Tests cover:
- Penalty application (no sources, duplicates, uncertainty)
- Bonus calculation (fresh sources, market data, agreement)
- Score clamping
- Label assignment
- Duplicate domain detection
- Average reliability calculation

## Examples

### High Confidence Response

```
Score: 85% (High)
Reliability: 92%

Reasoning:
✓ Multiple unique sources (3+)
✓ All sources are fresh (<24h)
✓ Market quote data present
✓ Multiple sources agree on sentiment
✓ Contains numerical evidence

Result: Trust the analysis. Multiple recent sources from highly-reliable domains all agree on the assessment.
```

### Moderate Confidence Response

```
Score: 55% (Moderate)
Reliability: 65%

Reasoning:
✓ Some fresh sources (2/4)
~ Limited source diversity
~ Moderate uncertainty language detected

Result: The analysis has reasonable basis but mixed source quality and some hedging language.
```

### Low Confidence Response

```
Score: 30% (Low)
Reliability: 50%

Penalties:
✗ No sources provided (-20)
✗ High uncertainty language (-15)

Result: Be cautious. This response lacks credible sources and contains significant uncertainty phrases.
```

## Performance Considerations

- Score calculation is lightweight (< 5ms for typical responses)
- No external API calls required
- Suitable for real-time streaming scenarios
- Scores cached in message metadata

## Future Enhancements

1. **Sentiment Analysis**: Track agreement across source sentiments
2. **Temporal Scoring**: Penalize responses that reference outdated data
3. **Confidence Trends**: Display confidence changes across conversation
4. **User Feedback Loop**: Adjust weights based on user feedback
5. **Source Rating**: Allow users to rate source credibility
6. **Confidence History**: Show confidence sparklines over time

## Files Modified

- `src/app/api/chat/route.ts` - Added confidence calculation to message persistence
- `src/components/chat/chat-message.tsx` - Integrated confidence badge display
- `src/components/chat/confidence-badge.tsx` - New badge component
- `src/lib/ai/confidence/*` - New confidence scoring module
