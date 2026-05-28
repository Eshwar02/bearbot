import { AIAnalysisPanel } from '../_components/ai-analysis-panel';

interface AnalysisPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw || '').toUpperCase();
  return <AIAnalysisPanel symbol={symbol} />;
}
