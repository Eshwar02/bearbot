import { redirect } from 'next/navigation';

interface InsightsSymbolPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function InsightsSymbolIndex({ params }: InsightsSymbolPageProps) {
  const { symbol } = await params;
  redirect(`/insights/${symbol}/overview`);
}
