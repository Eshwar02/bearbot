import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { BriefPDF } from '@/components/pdf/brief-pdf';
import { fetchStockNews } from '@/lib/stock/news';
import { yahoo } from '@/lib/stock/yahoo';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: brief, error } = await supabase
      .from('daily_briefs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !brief) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
    }

    // Fetch portfolio holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', user.id);

    if (holdingsError || !holdings) {
      return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 });
    }

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('currency')
      .eq('user_id', user.id)
      .maybeSingle();
    const currency = prefs?.currency || 'INR';

    // Fetch company names and current prices for better data
    const enrichedHoldings = await Promise.all(
      holdings.map(async (h) => {
        let name = h.name;
        let currentPrice = h.current_price || 0;
        
        // Try to fetch name/price from Yahoo if missing
        if (!name || !currentPrice) {
          try {
            const quote = await yahoo.quote(h.symbol);
            if (quote) {
              name = name || quote.longName || quote.shortName || h.symbol;
              currentPrice = currentPrice || quote.regularMarketPrice || 0;
            }
          } catch {
            // Fallback to symbol
            name = name || h.symbol;
          }
        }

        const currentValue = currentPrice * h.quantity;
        const costBasis = h.avg_buy_price * h.quantity;
        const pnl = currentValue - costBasis;

        return {
          id: h.id,
          symbol: h.symbol,
          name: name || h.symbol,
          quantity: h.quantity,
          avg_buy_price: h.avg_buy_price,
          current_value: currentValue,
          pnl: pnl,
          currency,
        };
      })
    );

    const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.current_value, 0);
    const totalPnl = enrichedHoldings.reduce((sum, h) => sum + h.pnl, 0);
    const totalCost = enrichedHoldings.reduce((sum, h) => sum + (h.avg_buy_price * h.quantity), 0);
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    const snapshot = {
      total_value: totalValue,
      total_pnl: totalPnl,
      total_pnl_percent: totalPnlPercent,
      holdings: enrichedHoldings,
      currency,
    };

    // Fetch REAL news for each holding - Grouped by Company
    // Focus on Indian Market symbols (.NS, .BO) or major Indian companies
    const newsPromises = enrichedHoldings.map(async (holding) => {
      try {
        // Fetch news specifically for this symbol
        const newsItems = await fetchStockNews(holding.symbol, holding.name);
        
        // Filter/Sort to prioritize recent and relevant news
        const relevantNews = newsItems
          .slice(0, 3) // Max 3 news per company
          .map((item) => ({
            title: item.title,
            source: item.source,
            publishedAt: item.publishedAt,
            summary: item.summary,
          }));

        return {
          symbol: holding.symbol,
          name: holding.name,
          items: relevantNews,
        };
      } catch {
        return {
          symbol: holding.symbol,
          name: holding.name,
          items: [],
        };
      }
    });

    const newsResults = await Promise.all(newsPromises);
    // Filter out companies with no news
    const groupedNews = newsResults.filter(n => n.items.length > 0);

    const pdfDoc = (
      <BriefPDF
        brief={{
          title: brief.title || 'Daily Portfolio Brief',
          created_at: brief.created_at,
          content: brief.content,
          portfolio_snapshot: snapshot,
          news: groupedNews,
        }}
      />
    );

    const buffer = await renderToBuffer(pdfDoc);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="alphasight-brief-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
