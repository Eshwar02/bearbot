import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { backtestEngine } from "@/lib/portfolio/backtestEngine";
import type { BacktestHolding } from "@/lib/portfolio/backtestEngine";
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
 * POST /api/portfolio/backtest
 *
 * Body: { startDate: string (ISO), endDate: string (ISO) }
 *
 * Authenticates the request using the same pattern as /api/portfolio,
 * fetches the user's holdings from Supabase, and delegates all computation
 * to backtestEngine — no business logic lives here.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth (identical pattern to /api/portfolio) ──────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonWithCors(request, { error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse + validate body ────────────────────────────────────────
    const body = await request.json() as {
      startDate?: string;
      endDate?: string;
    };
    const { startDate: startStr, endDate: endStr } = body;

    if (!startStr || !endStr) {
      return jsonWithCors(
        request,
        { error: "startDate and endDate are required (ISO string)" },
        { status: 400 },
      );
    }

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return jsonWithCors(
        request,
        { error: "Invalid date format — use ISO 8601 (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    if (startDate >= endDate) {
      return jsonWithCors(
        request,
        { error: "startDate must be before endDate" },
        { status: 400 },
      );
    }

    // ── Fetch holdings — same query as /api/portfolio ────────────────
    const { data: holdings, error: dbError } = await supabase
      .from("portfolio_holdings")
      .select("symbol, quantity")
      .eq("user_id", user.id);

    if (dbError) {
      return jsonWithCors(
        request,
        { error: "Failed to fetch portfolio holdings" },
        { status: 500 },
      );
    }

    if (!holdings || holdings.length === 0) {
      return jsonWithCors(request, {
        equityCurve: [],
        metrics: { totalReturn: 0, cagr: 0, maxDrawdown: 0, volatility: 0 },
      });
    }

    const backtestHoldings: BacktestHolding[] = holdings.map((h) => ({
      symbol: h.symbol,
      quantity: h.quantity,
    }));

    // ── Delegate to engine ───────────────────────────────────────────
    const result = await backtestEngine(backtestHoldings, startDate, endDate);

    return jsonWithCors(request, result);
  } catch (error) {
    console.error("POST /api/portfolio/backtest error:", error);
    return jsonWithCors(
      request,
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
