# 🛡️ Portfolio Risk Analysis Feature — Changelog

**Date:** 2026-05-17  
**Feature:** AI-Powered Portfolio Intelligence & Risk Analysis Agent  
**Status:** ✅ Complete (0 TypeScript errors)

---

## 📁 Files Created (3 new files)

### 1. `src/types/risk.ts` — Type Definitions
- **Purpose:** TypeScript interfaces for the entire risk analysis system
- **What's inside:**
  - `RiskLevel` — `"Low" | "Medium" | "High" | "Critical"`
  - `SectorAllocation` — sector name, percentage, value, holdings list, overconcentration flag
  - `StockRiskFlag` — per-stock risk data (price, sentiment, news, technicals)
  - `RiskRecommendation` — urgency-tagged actionable steps
  - `RiskReport` — the complete report structure returned by the API

---

### 2. `src/app/(app)/risk-analysis/page.tsx` — Dashboard UI (~350 lines)
- **Purpose:** Premium, animated Risk Analysis dashboard page
- **What's inside:**
  - 🎯 **Risk Score Ring** — Animated SVG circular progress (0-100) with color gradient
  - 📊 **Sector Allocation Panel** — Horizontal bars with 40% threshold line + overconcentration warnings
  - ⚠️ **Macro Threats Panel** — Grid of geopolitical/macro risk cards
  - 📈 **Stock Risk Cards** — Per-stock cards with sentiment badges, technical indicators, news headlines
  - ✅ **Recommendations Panel** — Color-coded actionable steps (opportunity/monitor/act-now)
  - 🤖 **AI Narrative Section** — Full markdown-rendered AI risk report
  - 💀 **Loading Skeleton** — Animated skeleton UI during data fetch
  - 📭 **Empty State** — CTA when no portfolio exists
- **Design:** Dark glassmorphic, framer-motion animations, responsive grid layout

---

### 3. `.env.local.example` — Updated with new env vars
- Added `AGENT_RISK_TEMP=0.5`
- Added `AGENT_RISK_MAX_TOKENS=4096`
- Added `AGENT_RISK_TIMEOUT_MS=120000`

---

## 📝 Files Modified (7 files)

### 4. `src/lib/ai/risk-assessment.ts` — Complete Rewrite (25 lines → ~350 lines)
- **Before:** Simple 25-line wrapper that just called `generateResponse()`
- **After:** Full-featured risk assessment engine with:
  - `enrichHoldings()` — fetches quotes, news, technicals, macro risks per holding
  - `computeSectorAllocation()` — calculates sector weights, flags >40% concentration
  - `computeRiskScore()` — deterministic 0-100 score based on concentration, P&L, technicals, RSI
  - `inferNewsSentiment()` — keyword-based bullish/bearish/neutral classification
  - `buildStockRiskFlags()` — assembles per-stock risk data
  - `generateRecommendations()` — creates actionable steps from data patterns
  - `buildRiskContext()` — builds rich context string for AI prompt
  - `generateRiskReport()` — orchestrates everything into a `RiskReport`
  - `assessPortfolioRisk()` — calls Mistral AI with enhanced prompt

---

### 5. `src/lib/ai/config.ts` — Agent Configuration
- **Added:** `risk` block to `AGENT_CONFIG`:
  ```ts
  risk: {
    temp: 0.5,        // Lower temp for factual output
    maxTokens: 4096,  // Longer reports
    timeoutMs: 120000, // 2min timeout for complex analysis
  }
  ```
- **Changed:** `AgentType` from `"stock" | "general" | "brief"` → includes `"risk"`

---

### 6. `src/lib/ai/prompts.ts` — Enhanced Prompt
- **Changed:** `RISK_ASSESSMENT_PROMPT` from ~30 lines → ~50 lines
- **New sections in prompt:**
  - Portfolio Risk Overview
  - Sector Concentration Analysis (with 40% overconcentration detection)
  - Geopolitical & Macro Threats (with urgency ratings)
  - Stock-Level Risk Assessment (with sentiment + technicals)
  - Overall Risk Level (with 0-100 score)
  - Actionable Recommendations (tagged as opportunity/monitor/act-now)

---

### 7. `src/app/api/risk-assessment/route.ts` — API Route Rewrite
- **Before:** Required `portfolioData` in request body, returned plain text
- **After:**
  - No body needed — auto-fetches user's holdings from Supabase
  - Authenticates via Supabase auth cookie
  - Calls `generateRiskReport()` to produce full structured analysis
  - Returns structured `RiskReport` JSON
  - Handles empty portfolio with helpful response
  - Limits to 20 holdings for performance

---

### 8. `src/stores/app-store.ts` — State Management
- **Changed:** `AppView` type from:
  ```ts
  'chat' | 'portfolio' | 'brief' | 'watchlist' | 'settings'
  ```
  to:
  ```ts
  'chat' | 'portfolio' | 'brief' | 'watchlist' | 'settings' | 'risk'
  ```

---

### 9. `src/components/layout/sidebar.tsx` — Navigation
- **Added:** `ShieldAlert` icon import from lucide-react
- **Added:** New nav link:
  ```ts
  { view: 'risk', label: 'Risk Analysis', icon: ShieldAlert }
  ```
  Placed between "Daily Brief" and "Watchlist"
- **Added:** Route mapping: `risk: '/risk-analysis'`

---

### 10. `src/app/(app)/page.tsx` — Main Page Router
- **Added:** Import for `RiskAnalysisView`
- **Added:** `{activeView === 'risk' && <RiskAnalysisView />}`

---

## 🏗️ Architecture

```
User clicks "Risk Analysis" in sidebar
  → App store sets activeView = 'risk'
  → MainAppPage renders <RiskAnalysisView />
  → User clicks "Analyze My Portfolio"
  → POST /api/risk-assessment
    → Supabase: fetch portfolio_holdings
    → For each holding (parallel):
      → fetchQuote() (Yahoo Finance)
      → fetchHistory() (Yahoo Finance)
      → fetchStockNews() (MarketAux, NewsData, Google RSS)
      → analyzeTechnicals() (SMA, RSI, MACD, trend)
      → assessMacroRisks() (sector + country rules)
    → computeSectorAllocation()
    → computeRiskScore() (deterministic 0-100)
    → generateRecommendations()
    → assessPortfolioRisk() via Mistral AI
  → Returns RiskReport JSON
  → UI renders animated dashboard
```

## ⚡ Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Hybrid deterministic + AI scoring | Risk score (0-100) is always consistent; AI narrative adds depth |
| No new database tables | Computed on-the-fly, no storage cost, always fresh data |
| No new API keys | Reuses existing Yahoo Finance, news APIs, Mistral |
| Keyword-based sentiment | Fast, no external NLP service needed for UI badges |
| 40% concentration threshold | Industry standard for portfolio diversification warnings |
| Graceful AI fallback | If Mistral fails, data-driven sections still render |

## 🔧 No Breaking Changes

All existing features (Chat, Portfolio, Daily Brief, Watchlist, Settings) remain untouched. The risk analysis is purely additive.
