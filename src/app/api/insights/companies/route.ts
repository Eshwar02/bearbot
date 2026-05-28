import { NextResponse } from 'next/server';
import { fetchQuoteFull } from '@/lib/stock/data';

export const dynamic = 'force-dynamic';

const POPULAR_TICKERS: Array<{ symbol: string; name: string; market: 'IN' | 'US' }> = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', market: 'IN' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', market: 'IN' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', market: 'IN' },
  { symbol: 'INFY.NS', name: 'Infosys', market: 'IN' },
  { symbol: 'AAPL', name: 'Apple', market: 'US' },
  { symbol: 'MSFT', name: 'Microsoft', market: 'US' },
  { symbol: 'NVDA', name: 'NVIDIA', market: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet', market: 'US' },
];

export async function GET() {
  const companies = await Promise.all(
    POPULAR_TICKERS.map(async (ticker) => {
      const quote = await fetchQuoteFull(ticker.symbol).catch(() => null);
      return {
        symbol: ticker.symbol,
        market: ticker.market,
        name: quote?.name || ticker.name,
        exchange: quote?.exchange || '',
        currency: quote?.currency || (ticker.market === 'IN' ? 'INR' : 'USD'),
        price: quote?.price ?? null,
        change: quote?.change ?? null,
        changePercent: quote?.changePercent ?? null,
        marketCap: quote?.marketCap ?? null,
      };
    })
  );

  return NextResponse.json(
    { companies },
    {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    }
  );
}
