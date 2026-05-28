import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Insights — AlphaSight',
  description:
    'Company analysis for Indian and US listed stocks: financials, ratios, peers, and AI-generated takeaways.',
  alternates: { canonical: 'https://insights.alphasightai.online/' },
};

export default function InsightsLayout({ children }: { children: ReactNode }) {
  return children;
}
