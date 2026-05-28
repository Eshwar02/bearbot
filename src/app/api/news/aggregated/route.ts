import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchStockNews } from '@/lib/stock/news';
import { fetchQuote } from '@/lib/stock/data';
import type { NewsItem } from '@/types/stock';

const INDICES = ['^NSEI', '^BSESN'];
const NSE_KEYWORDS = [
  'NSE India stock market today',
  'Sensex Nifty 50 update',
  'Indian stock market news',
];
const GEOPOLITICAL_KEYWORDS = [
  'global economy geopolitics today',
  'geopolitical risk market impact',
  'international trade policy news',
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

    const { data: holdings } = await supabase
      .from('portfolio_holdings')
      .select('symbol, quantity, avg_buy_price')
      .eq('user_id', user.id);

    const portfolioSymbols = holdings?.map((h) => h.symbol) || [];

    const companyNames: Record<string, string> = {};
    for (const symbol of portfolioSymbols) {
      try {
        const quote = await fetchQuote(symbol);
        if (quote?.name) companyNames[symbol] = quote.name;
      } catch {}
    }

    const [holdingNewsResults, marketNews, geopoliticalNews] = await Promise.all([
      Promise.all(
        portfolioSymbols.slice(0, 10).map(async (symbol) => {
          const news = await fetchStockNews(symbol, companyNames[symbol] || symbol);
          return news.map((item) => ({ ...item, symbol, category: 'holding' }));
        })
      ),
      Promise.all(
        NSE_KEYWORDS.map((q) => fetchStockNews('NSE', q))
      ).then((results) => {
        const flat = results.flat().map((item) => ({ ...item, category: 'market' as const }));
        return deduplicate(flat).slice(0, 10);
      }),
      Promise.all(
        GEOPOLITICAL_KEYWORDS.map((q) => fetchStockNews('global', q))
      ).then((results) => {
        const flat = results.flat().map((item) => ({ ...item, category: 'geopolitical' as const }));
        return deduplicate(flat).slice(0, 8);
      }),
    ]);

    const holdingsNews = deduplicate(holdingNewsResults.flat()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const allNews = deduplicate([...holdingsNews, ...marketNews, ...geopoliticalNews]).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return NextResponse.json({
      news: allNews,
      categories: {
        holdings: holdingsNews,
        market: marketNews,
        geopolitical: geopoliticalNews,
      },
      total: allNews.length,
    });
  } catch (error) {
    console.error('Aggregated news error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
