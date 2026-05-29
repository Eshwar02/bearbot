import { redirect } from 'next/navigation';

interface PnlRedirectProps {
  params: Promise<{ symbol: string }>;
}

export default async function PnlRedirect({ params }: PnlRedirectProps) {
  const { symbol } = await params;
  redirect(`/insights/${symbol}/profit-loss`);
}
