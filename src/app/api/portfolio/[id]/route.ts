import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchQuote } from "@/lib/stock/data";
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
 * PUT /api/portfolio/[id] - Update a portfolio holding.
 * Body: { quantity?: number, avgBuyPrice?: number, notes?: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonWithCors(request, { error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("portfolio_holdings")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return jsonWithCors(
        request,
        { error: "Holding not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { quantity, avgBuyPrice, currency, notes } = body as {
      quantity?: number;
      avgBuyPrice?: number;
      currency?: string;
      notes?: string;
    };

    // Validate inputs if provided
    const updates: Record<string, unknown> = {};

    if (quantity !== undefined) {
      if (typeof quantity !== "number" || quantity <= 0) {
        return jsonWithCors(
          request,
          { error: "Quantity must be a positive number" },
          { status: 400 },
        );
      }
      updates.quantity = quantity;
    }

    if (avgBuyPrice !== undefined) {
      if (typeof avgBuyPrice !== "number" || avgBuyPrice <= 0) {
        return jsonWithCors(
          request,
          { error: "Average buy price must be a positive number" },
          { status: 400 },
        );
      }
      updates.avg_buy_price = avgBuyPrice;
    }

    if (currency !== undefined) {
      const ALLOWED = ["USD", "INR", "EUR", "GBP"] as const;
      const upper = currency ? currency.toUpperCase() : null;
      if (upper && !ALLOWED.includes(upper as typeof ALLOWED[number])) {
        return jsonWithCors(
          request,
          { error: "Invalid currency" },
          { status: 400 },
        );
      }
      updates.currency = upper;
    }

    if (notes !== undefined) {
      updates.notes = notes || null;
    }

    if (Object.keys(updates).length === 0) {
      return jsonWithCors(
        request,
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("portfolio_holdings")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return jsonWithCors(
        request,
        { error: "Failed to update holding" },
        { status: 500 },
      );
    }

    // Fetch current price for P&L
    let currentPrice = 0;
    try {
      const quote = await fetchQuote(updated.symbol);
      currentPrice = quote?.price ?? 0;
    } catch {
      // If quote fails, return zero
    }

    const currentValue = currentPrice * updated.quantity;
    const investedValue = updated.avg_buy_price * updated.quantity;
    const pnl = currentValue - investedValue;
    const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

    return jsonWithCors(request, {
      holding: {
        ...updated,
        currentPrice,
        currentValue,
        pnl,
        pnlPercent,
      },
    });
  } catch (error) {
    console.error("PUT /api/portfolio/[id] error:", error);
    return jsonWithCors(
      request,
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/portfolio/[id] - Remove a portfolio holding.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonWithCors(request, { error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("portfolio_holdings")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return jsonWithCors(
        request,
        { error: "Holding not found" },
        { status: 404 },
      );
    }

    const { error: deleteError } = await supabase
      .from("portfolio_holdings")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return jsonWithCors(
        request,
        { error: "Failed to delete holding" },
        { status: 500 },
      );
    }

    return jsonWithCors(request, { success: true });
  } catch (error) {
    console.error("DELETE /api/portfolio/[id] error:", error);
    return jsonWithCors(
      request,
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
