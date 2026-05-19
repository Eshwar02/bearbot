import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { BriefPDF } from '@/components/pdf/brief-pdf';
import { fetchStockNews } from '@/lib/stock/news';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      .eq('id', params.id)
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

    const snapshot = {
      total_value: holdings.reduce((sum, h) => sum + (h.current_value || 0), 0),
      total_pnl: holdings.reduce((sum, h) => sum + (h.pnl || 0), 0),
      total_pnl_percent: holdings.length
        ? (holdings.reduce((sum, h) => sum + (h.pnl || 0), 0) /
            holdings.reduce((sum, h) => sum + h.quantity * h.avg_buy_price, 0)) *
          100
        : 0,
      holdings: holdings.map((h) => ({
        id: h.id,
        symbol: h.symbol,
        name: h.name || '',
        quantity: h.quantity,
        avg_buy_price: h.avg_buy_price,
        current_value: h.current_value || 0,
        pnl: h.pnl || 0,
        currency: h.currency || 'USD',
      })),
      currency: holdings[0]?.currency || 'USD',
    };

    // Fetch REAL news for each holding - no hallucinations
    const newsPromises = holdings.slice(0, 5).map(async (holding) => {
      try {
        const newsItems = await fetchStockNews(holding.symbol, holding.name || holding.symbol);
        return newsItems.slice(0, 3).map((item) => ({
          symbol: holding.symbol,
          title: item.title,
          source: item.source,
          publishedAt: item.publishedAt,
          summary: item.summary,
          url: item.url,
        }));
      } catch {
        return [];
      }
    });

    const newsResults = await Promise.all(newsPromises);
    const allNews = newsResults.flat().slice(0, 10);

    const pdfDoc = (
      <BriefPDF
        brief={{
          title: brief.title || 'Daily Portfolio Brief',
          created_at: brief.created_at,
          content: brief.content,
          portfolio_snapshot: snapshot,
          news: allNews,
        }}
      />
    );

    const buffer = await renderToBuffer(pdfDoc);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="alphasight-brief-${params.id}.pdf"`,
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
