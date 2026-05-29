# Narrative Drift Detection Implementation

## Overview
Implemented a modular **Narrative Drift Detection Engine** that tracks thesis evolution across sequential AI stock analyses for the same company, detecting inconsistencies without breaking the existing pipeline.

## What Was Added

### 1. **Drift Detection Module** (`src/lib/ai/drift-detection.ts`)
A lightweight, self-contained module that:

- **Extracts Analysis Snapshots**: Converts AI responses into structured snapshots containing:
  - Sentiment (bullish/bearish/neutral)
  - Confidence score (0-1)
  - Risk factors detected (geopolitical, macro, commodity, supply chain, regulatory, financial)
  - Thesis text (main conviction statement)
  - Optional embedding (1024-dim vector for semantic similarity)

- **Detects Narrative Drift**: Compares current vs. baseline analysis across:
  - **Sentiment delta** (45% weight): Did the conviction flip?
  - **Risk factor persistence** (25% weight): Are earlier risks still flagged or dropped?
  - **Semantic similarity** (30% weight): Embedding-based comparison of thesis wording
  - **Drift Score**: 0-1 scale; ≥0.35 triggers drift alert

- **Generates Drift Reports**: `StockDriftResult` includes:
  - `isDrift`: boolean flag
  - `reason`: human-readable explanation
  - `changedFrom/changedTo`: sentiment transition
  - `persistentRiskFactors`: risks that remain flagged
  - `newRiskFactors`: newly surfaced risks
  - `droppedRiskFactors`: previously flagged but now absent
  - `similarity`: cosine similarity score if embeddings available

**Key Design**: No external dependencies beyond existing `embedText()`. Patterns are tunable. Embedding is optional (gracefully degrades if unavailable).

---

### 2. **Chat Route Integration** (`src/app/api/chat/route.ts`)

**Import Added**:
```typescript
import { extractAnalysisSnapshot, detectNarrativeDrift } from "@/lib/ai/drift-detection";
```

**Metadata Enrichment**: During assistant message persistence:
1. Extract current analysis snapshot from the LLM response
2. Find the previous stock analysis for the same symbol in conversation history
3. Compare snapshots and generate drift report
4. Store both `analysisSnapshot` and `drift` in message metadata JSONB

**Error Handling**: Drift detection runs in try-catch; failures are logged but don't block message persistence.

---

## How It Works

### Flow
```
User asks about stock (e.g., "Analyze TCS again")
    ↓
AI generates response
    ↓
[NEW] Extract analysis snapshot
    ↓
[NEW] Search history for previous TCS analysis
    ↓
[NEW] Compare snapshots → generate drift report
    ↓
Store in message.metadata:
  - confidence (existing)
  - stockData (existing)
  - analysisSnapshot (new): sentiment, risks, thesis
  - drift (new): isDrift, driftScore, reason, risk deltas
    ↓
Database persists enriched metadata
```

### Example Output (Drift Detected)
```json
{
  "drift": {
    "isDrift": true,
    "driftScore": 0.62,
    "reason": "The thesis shifted from bullish to bearish compared with the previous view. These earlier risks still appear: geopolitical, macro. New risk focus emerged: supply chain.",
    "changedFrom": "bullish",
    "changedTo": "bearish",
    "persistentRiskFactors": ["geopolitical", "macro"],
    "newRiskFactors": ["supply chain"],
    "droppedRiskFactors": [],
    "similarity": 0.71
  },
  "analysisSnapshot": {
    "symbol": "TCS",
    "sentiment": "bearish",
    "confidenceScore": 0.85,
    "riskFactors": ["geopolitical", "macro", "supply chain"],
    "thesisText": "The company faces headwinds from elevated geopolitical tensions and slowing demand.",
    "timestamp": "2026-05-29T10:15:00.000Z"
  }
}
```

---

## Benefits

1. **Trust & Transparency**: Users can see why convictions changed with detailed explanations
2. **Silent Contradiction Detection**: Identifies when risk weights shift without explicit acknowledgment
3. **Portfolio Intelligence**: Helps long-term investors understand thesis evolution over time
4. **No Pipeline Disruption**: Runs post-analysis in metadata layer; zero impact on core LLM flow
5. **Extensible**: Easy to add new risk patterns or adjust weighting

---

## Integration Points

- ✅ Compiles without errors
- ✅ Uses existing embedding infrastructure (`embedText`)
- ✅ Stores metadata in existing `messages.metadata` JSONB column
- ✅ No database schema changes required
- ✅ Gracefully degrades if embedding fails
- ✅ No new external dependencies

---

## Next Steps for Users

1. **Deploy**: Push to prod; drift data will populate on new stock analyses
2. **Frontend**: Display drift alerts when `isDrift: true` in message metadata
3. **History View**: Show timeline of sentiment + risk changes for repeated stock queries
4. **Tuning**: Adjust `RISK_PATTERNS`, sentiment thresholds, or weighting in `drift-detection.ts` as needed

---

## Files Modified

- `src/lib/ai/drift-detection.ts` ← **NEW** (complete module, 200+ lines)
- `src/app/api/chat/route.ts` ← Updated import + drift detection call in persistence layer

All changes ready to commit and deploy.
