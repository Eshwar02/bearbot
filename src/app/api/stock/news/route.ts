import { NextRequest, NextResponse } from 'next/server';
import { fetchStockNews } from '@/lib/stock/news';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const news = await fetchStockNews(symbol, symbol);

    return NextResponse.json({ news: news.slice(0, 5) });
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
