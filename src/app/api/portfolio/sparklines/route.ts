import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchHistoryRange } from "@/lib/stock/data";
import { applyInsightsCors, corsPreflightResponse } from "@/lib/api/cors";

function jsonWithCors(
  request: NextRequest,
  body: unknown,
  init?: ResponseInit,
): NextResponse {
  return applyInsightsCors(request, NextResponse.json(body, init));
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request);
}

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
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonWithCors(request, { error: "Unauthorized" }, { status: 401 });
    }

    const { data: holdings, error } = await supabase
      .from("portfolio_holdings")
      .select("symbol")
      .eq("user_id", user.id);

    if (error) {
      return jsonWithCors(
        request,
        { error: "Failed to fetch holdings" },
        { status: 500 },
      );
    }

    const symbols = Array.from(new Set((holdings || []).map((h) => h.symbol)));
    if (symbols.length === 0) {
      return jsonWithCors(request, { sparklines: {} });
    }

    const results = await Promise.all(
      symbols.map(async (s) => {
        const series = await fetchHistoryRange(s, "1D").catch(() => []);
        return [s, series.map(({ date, close }) => ({ date, close }))] as const;
      })
    );

    const sparklines: Record<string, Array<{ date: string; close: number }>> = {};
    for (const [s, series] of results) sparklines[s] = series;

    return jsonWithCors(request, { sparklines });
  } catch (err) {
    console.error("GET /api/portfolio/sparklines error:", err);
    return jsonWithCors(
      request,
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
