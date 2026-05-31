import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchStockNews, fetchTopicNews, enrichNewsImages } from '@/lib/stock/news';
import { fetchQuote } from '@/lib/stock/data';
import type { NewsItem } from '@/types/stock';

const NSE_KEYWORDS = [
  'NSE India stock market today',
  'Sensex Nifty 50 news',
  'Indian stock market',
  'BSE NSE share market',
];

const GEOPOLITICAL_KEYWORDS = [
  'geopolitics global economy impact',
  'geopolitical risk financial markets',
  'international trade policy economy',
  'global economic news today',
];

function deduplicate(news: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return news.filter((item) => {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const refresh = searchParams.get('refresh') === '1';

    const { data: holdings } = await supabase
      .from('portfolio_holdings')
      .select('symbol, quantity, avg_buy_price')
      .eq('user_id', user.id);

    const portfolioSymbols = holdings?.map((h) => h.symbol) || [];

    const companyNames: Record<string, string> = {};
    await Promise.all(
      portfolioSymbols.map(async (symbol) => {
        try {
          const quote = await fetchQuote(symbol);
          if (quote?.name && quote.name !== symbol) {
            companyNames[symbol] = quote.name;
          }
        } catch {}
      })
    );

    const [holdingNewsResults, marketNews, geopoliticalNews] = await Promise.all([
      Promise.all(
        portfolioSymbols.map(async (symbol) => {
          const name = companyNames[symbol] || symbol;
          const news = await fetchStockNews(symbol, name, [], refresh);
          return news.map((item) => ({ ...item, symbol, category: 'holding' }));
        })
      ),
      fetchTopicNews(NSE_KEYWORDS, 12, 30, refresh).then((items) =>
        items.map((item) => ({ ...item, category: 'market' as const }))
      ),
      fetchTopicNews(GEOPOLITICAL_KEYWORDS, 10, 25, refresh).then((items) =>
        items.map((item) => ({ ...item, category: 'geopolitical' as const }))
      ),
    ]);

    const holdingsNews = deduplicate(holdingNewsResults.flat())
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const [catHoldings, catMarket, catGeopolitical] = await Promise.all([
      enrichNewsImages(holdingsNews),
      enrichNewsImages(marketNews),
      enrichNewsImages(geopoliticalNews),
    ]);

    const allNews = deduplicate([...catHoldings, ...catMarket, ...catGeopolitical])
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const paginated = allNews.slice(offset, offset + limit);

    return NextResponse.json({
      news: paginated,
      categories: {
        holdings: catHoldings,
        market: catMarket,
        geopolitical: catGeopolitical,
      },
      total: allNews.length,
      offset,
      limit,
      hasMore: offset + limit < allNews.length,
    });
  } catch (error) {
    console.error('Aggregated news error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
