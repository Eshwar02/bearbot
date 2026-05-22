'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Eye,
  Target,
  BrainCircuit,
  BarChart3,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  RiskReport,
  RiskLevel,
  SectorAllocation,
  StockRiskFlag,
  RiskRecommendation,
} from '@/types/risk';

/* ── Helpers ─────────────────────────────────────────────────────────── */

function riskColor(level: RiskLevel) {
  switch (level) {
    case 'Low': return { text: 'text-accent-green', bg: 'bg-accent-green', ring: 'ring-accent-green/30', glow: 'shadow-accent-green/20' };
    case 'Medium': return { text: 'text-accent-amber', bg: 'bg-accent-amber', ring: 'ring-accent-amber/30', glow: 'shadow-accent-amber/20' };
    case 'High': return { text: 'text-accent-red', bg: 'bg-accent-red', ring: 'ring-accent-red/30', glow: 'shadow-accent-red/20' };
    case 'Critical': return { text: 'text-purple-400', bg: 'bg-purple-500', ring: 'ring-purple-500/30', glow: 'shadow-purple-500/20' };
  }
}

function riskGradient(level: RiskLevel) {
  switch (level) {
    case 'Low': return 'from-accent-green/20 via-accent-green/5 to-transparent';
    case 'Medium': return 'from-accent-amber/20 via-accent-amber/5 to-transparent';
    case 'High': return 'from-accent-red/20 via-accent-red/5 to-transparent';
    case 'Critical': return 'from-purple-500/20 via-purple-500/5 to-transparent';
  }
}

function sentimentIcon(s: StockRiskFlag['newsSentiment']) {
  if (s === 'bullish') return <TrendingUp className="h-3.5 w-3.5 text-accent-green" />;
  if (s === 'bearish') return <TrendingDown className="h-3.5 w-3.5 text-accent-red" />;
  return <Minus className="h-3.5 w-3.5 text-accent-amber" />;
}

function urgencyConfig(u: RiskRecommendation['urgency']) {
  switch (u) {
    case 'opportunity': return { icon: Target, color: 'text-accent-green', border: 'border-accent-green/30', bg: 'bg-accent-green/5' };
    case 'monitor': return { icon: Eye, color: 'text-accent-amber', border: 'border-accent-amber/30', bg: 'bg-accent-amber/5' };
    case 'act-now': return { icon: Zap, color: 'text-accent-red', border: 'border-accent-red/30', bg: 'bg-accent-red/5' };
  }
}

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

/* ── Risk Score Ring ─────────────────────────────────────────────────── */

function RiskScoreRing({ score, level }: { score: number; level: RiskLevel }) {
  const colors = riskColor(level);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 120 120" className="drop-shadow-lg">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-dark-800" />
        <motion.circle
          cx="60" cy="60" r="54" fill="none" strokeWidth="8" strokeLinecap="round"
          className={colors.text} style={{ strokeDasharray: circumference }}
          initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span className={cn('text-3xl font-bold', colors.text)}
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}>
          {score}
        </motion.span>
        <span className="text-xs text-dark-400 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

/* ── Sector Bar ──────────────────────────────────────────────────────── */

function SectorBar({ allocation, index }: { allocation: SectorAllocation; index: number }) {
  const barColors = ['bg-accent-blue', 'bg-accent-green', 'bg-accent-amber', 'bg-purple-500', 'bg-accent-red', 'bg-teal-400', 'bg-pink-400', 'bg-indigo-400'];
  const barColor = barColors[index % barColors.length];

  return (
    <motion.div className="space-y-1.5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-200 font-medium">{allocation.sector}</span>
          {allocation.isOverconcentrated && (
            <Badge variant="red" className="text-[10px] px-1.5 py-0">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />RISK
            </Badge>
          )}
        </div>
        <span className="text-dark-400 font-mono text-xs">{allocation.percentage.toFixed(1)}%</span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-dark-800 overflow-hidden">
        <motion.div className={cn('h-full rounded-full', barColor, allocation.isOverconcentrated && 'animate-pulse')}
          initial={{ width: 0 }} animate={{ width: `${Math.min(allocation.percentage, 100)}%` }}
          transition={{ delay: 0.15 * index, duration: 0.6, ease: 'easeOut' }} />
        <div className="absolute top-0 left-[40%] h-full w-px bg-accent-red/40" title="40% threshold" />
      </div>
      <p className="text-[11px] text-dark-500">{allocation.holdings.join(', ')}</p>
    </motion.div>
  );
}

/* ── Stock Risk Card ─────────────────────────────────────────────────── */

function StockRiskCard({ stock, index }: { stock: StockRiskFlag; index: number }) {
  const isPositive = stock.changePercent >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.35 }}
      className="rounded-xl border border-dark-700/70 bg-dark-800/80 p-4 backdrop-blur-sm hover:border-dark-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-100 text-sm">{stock.symbol}</h4>
          <p className="text-xs text-dark-400 truncate max-w-[140px]">{stock.name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {sentimentIcon(stock.newsSentiment)}
          <Badge variant={stock.newsSentiment === 'bullish' ? 'green' : stock.newsSentiment === 'bearish' ? 'red' : 'gray'} className="text-[10px]">
            {stock.newsSentiment}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div><p className="text-dark-500">Price</p><p className="text-gray-200 font-medium">${stock.currentPrice.toFixed(2)}</p></div>
        <div><p className="text-dark-500">Change</p>
          <p className={cn('font-medium', isPositive ? 'text-accent-green' : 'text-accent-red')}>
            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </p>
        </div>
        <div><p className="text-dark-500">Trend</p>
          <Badge variant={stock.technicalTrend === 'bullish' ? 'green' : stock.technicalTrend === 'bearish' ? 'red' : 'gray'} className="text-[10px]">
            {stock.technicalTrend}
          </Badge>
        </div>
        <div><p className="text-dark-500">RSI</p>
          <p className="text-gray-200 font-medium">{stock.rsi !== null ? stock.rsi.toFixed(1) : 'N/A'}</p>
        </div>
      </div>

      {stock.riskFlags.length > 0 && (
        <div className="border-t border-dark-700/50 pt-2 mt-2">
          <p className="text-[10px] uppercase tracking-wider text-dark-500 mb-1">Risk Factors</p>
          {stock.riskFlags.slice(0, 2).map((f, i) => (
            <p key={i} className="text-[11px] text-dark-400 leading-relaxed">• {f}</p>
          ))}
        </div>
      )}

      {stock.newsHeadlines.length > 0 && (
        <div className="border-t border-dark-700/50 pt-2 mt-2">
          <p className="text-[10px] uppercase tracking-wider text-dark-500 mb-1">Latest News</p>
          {stock.newsHeadlines.slice(0, 2).map((h, i) => (
            <p key={i} className="text-[11px] text-dark-300 leading-relaxed truncate">📰 {h}</p>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ── Recommendation Card ─────────────────────────────────────────────── */

function RecommendationCard({ rec, index }: { rec: RiskRecommendation; index: number }) {
  const cfg = urgencyConfig(rec.urgency);
  const Icon = cfg.icon;
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
      className={cn('rounded-xl border p-4', cfg.border, cfg.bg)}>
      <div className="flex items-start gap-3">
        <div className={cn('rounded-lg bg-dark-800 p-2 shrink-0', cfg.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-100">{rec.title}</h4>
            <Badge variant={rec.urgency === 'act-now' ? 'red' : rec.urgency === 'monitor' ? 'amber' : 'green'} className="text-[10px]">
              {rec.urgency.replace('-', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-dark-400 leading-relaxed">{rec.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Loading Skeleton ────────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 mb-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-6 w-24" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-dark-700 bg-dark-800 p-6 flex flex-col items-center gap-4">
          <Skeleton className="h-36 w-36 rounded-full" /><Skeleton className="h-6 w-20" /><Skeleton className="h-4 w-48" />
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-dark-700 bg-dark-800 p-6 space-y-4">
          {[1, 2, 3, 4].map(i => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-full" /></div>))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (<div key={i} className="rounded-xl border border-dark-700 bg-dark-800 p-4 space-y-3">
          <Skeleton className="h-5 w-20" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" />
        </div>))}
      </div>
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────────────── */

function EmptyState({ onAnalyze, loading }: { onAnalyze: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 rounded-full bg-dark-800 p-8 ring-1 ring-dark-700">
        <ShieldAlert className="h-16 w-16 text-dark-500" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-gray-100">Portfolio Risk Analysis</h2>
      <p className="mb-8 max-w-md text-sm text-dark-400">
        Get AI-powered insights on your portfolio&apos;s risk exposure, sector concentration, geopolitical threats, and actionable recommendations.
      </p>
      <Button onClick={onAnalyze} disabled={loading} size="sm" id="risk-analyze-btn">
        {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
        {loading ? 'Analyzing...' : 'Analyze My Portfolio'}
      </Button>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────── */

export default function RiskAnalysisView() {
  const [report, setReport] = useState<RiskReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/risk-assessment', { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading && !report) return <LoadingSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-100">
            <ShieldAlert className="h-6 w-6 text-accent-brand" />
            Risk Analysis
          </h1>
          {report && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-dark-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                <span className="absolute inset-0 rounded-full bg-emerald-400" />
              </span>
              <Activity className="h-3 w-3 text-emerald-400" />
              Last analyzed: {new Date(report.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <Button onClick={runAnalysis} disabled={loading} variant={report ? 'secondary' : 'primary'} size="sm" id="risk-refresh-btn">
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          {loading ? 'Analyzing...' : report ? 'Re-analyze' : 'Analyze Portfolio'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-accent-red/30 bg-accent-red/5 p-4 text-sm text-accent-red">
          <AlertTriangle className="inline h-4 w-4 mr-2" />{error}
        </div>
      )}

      {!report && !loading && <EmptyState onAnalyze={runAnalysis} loading={loading} />}

      <AnimatePresence>
        {report && (
          <motion.div {...fadeIn} className="space-y-6">
            {/* ── Row 1: Risk Score + Sector Allocation ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Score Hero */}
              <div className={cn(
                'lg:col-span-1 rounded-2xl border border-dark-700/70 p-6 backdrop-blur-xl',
                'bg-gradient-to-br', riskGradient(report.riskLevel),
                'shadow-[0_12px_36px_rgba(0,0,0,0.22)] flex flex-col items-center gap-4'
              )} id="risk-score-hero">
                <RiskScoreRing score={report.riskScore} level={report.riskLevel} />
                <Badge variant={report.riskLevel === 'Low' ? 'green' : report.riskLevel === 'Medium' ? 'amber' : 'red'}
                  className="text-sm px-4 py-1 font-semibold">
                  {report.riskLevel} Risk
                </Badge>
                {report.concentrationWarnings.length > 0 && (
                  <div className="w-full space-y-1.5 mt-2">
                    {report.concentrationWarnings.map((w, i) => (
                      <p key={i} className="text-xs text-accent-amber flex items-start gap-1.5">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />{w}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Sector Allocation Panel */}
              <div className="lg:col-span-2 rounded-2xl border border-dark-700/70 bg-dark-800/85 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.18)]" id="sector-allocation-panel">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100 mb-5">
                  <BarChart3 className="h-5 w-5 text-accent-blue" /> Sector Allocation
                </h2>
                {report.sectorAllocations.length > 0 ? (
                  <div className="space-y-4">
                    {report.sectorAllocations.map((sa, i) => (
                      <SectorBar key={sa.sector} allocation={sa} index={i} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dark-400">No sector data available.</p>
                )}
              </div>
            </div>

            {/* ── Row 2: Macro Threats ──── */}
            {report.macroThreats.length > 0 && (
              <div className="rounded-2xl border border-dark-700/70 bg-dark-800/85 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.18)]" id="macro-threats-panel">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100 mb-4">
                  <AlertTriangle className="h-5 w-5 text-accent-amber" /> Geopolitical & Macro Threats
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.macroThreats.map((threat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i, duration: 0.3 }}
                      className="flex items-start gap-3 rounded-xl border border-dark-700/50 bg-dark-900/40 p-3">
                      <div className="rounded-lg bg-accent-amber/10 p-1.5 mt-0.5 shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5 text-accent-amber" />
                      </div>
                      <p className="text-xs text-dark-300 leading-relaxed">{threat}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Row 3: Stock Risk Cards ──── */}
            {report.stockRisks.length > 0 && (
              <div id="stock-risks-grid">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100 mb-4">
                  <Activity className="h-5 w-5 text-accent-red" /> Stock-Level Risk Assessment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.stockRisks.map((stock, i) => (
                    <StockRiskCard key={stock.symbol} stock={stock} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Row 4: Recommendations ──── */}
            {report.recommendations.length > 0 && (
              <div id="recommendations-panel">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100 mb-4">
                  <Target className="h-5 w-5 text-accent-green" /> Actionable Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.recommendations.map((rec, i) => (
                    <RecommendationCard key={i} rec={rec} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Row 5: AI Narrative ──── */}
            {report.aiNarrative && (
              <div className="rounded-2xl border border-dark-700/70 bg-gradient-to-br from-dark-800/95 via-dark-850/85 to-dark-900/80 p-6 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.22)]" id="ai-narrative-panel">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100 mb-4">
                  <BrainCircuit className="h-5 w-5 text-accent-brand" /> AI Risk Narrative
                  <Badge variant="gray" className="text-[10px] ml-2">Powered by AI</Badge>
                </h2>
                <div className="prose prose-sm prose-invert max-w-none text-dark-300
                  prose-headings:text-gray-100 prose-strong:text-gray-100
                  prose-a:text-accent-brand prose-li:text-dark-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {report.aiNarrative}
                  </ReactMarkdown>
                </div>
                <p className="mt-4 text-[11px] text-dark-500 italic">
                  ⚠️ This is not financial advice. Consult a professional before making investment decisions.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
