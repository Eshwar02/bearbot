import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchHistoryRange } from "@/lib/stock/data";

/**
 * GET /api/portfolio/sparklines
 *
 * Returns a 1-day intraday sparkline series for every symbol in the
 * authenticated user's portfolio, in a single round-trip. The portfolio table
 * renders one tiny chart per row and would otherwise need N fetches.
 *
 * Response:
 * {
 *   sparklines: {
 *     [symbol]: Array<{ date: string; close: number }>
 *   }
 * }
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: holdings, error } = await supabase
      .from("portfolio_holdings")
      .select("symbol")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch holdings" },
        { status: 500 }
      );
    }

    const symbols = Array.from(new Set((holdings || []).map((h) => h.symbol)));
    if (symbols.length === 0) {
      return NextResponse.json({ sparklines: {} });
    }

    const results = await Promise.all(
      symbols.map(async (s) => {
        const series = await fetchHistoryRange(s, "1D").catch(() => []);
        return [s, series.map(({ date, close }) => ({ date, close }))] as const;
      })
    );

    const sparklines: Record<string, Array<{ date: string; close: number }>> = {};
    for (const [s, series] of results) sparklines[s] = series;

    return NextResponse.json({ sparklines });
  } catch (err) {
    console.error("GET /api/portfolio/sparklines error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
