import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchQuote } from "@/lib/stock/data";

/**
 * POST /api/portfolio/[id]/buy - Add more shares to an existing holding at a
 * new purchase price. The server averages the new batch into the existing
 * position so the user never has to compute the weighted average by hand:
 *
 *   newQty = oldQty + buyQty
 *   newAvg = (oldQty*oldAvg + buyQty*buyPrice) / newQty
 *
 * Body: { quantity: number, price: number }
 */
export async function POST(
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from("portfolio_holdings")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Holding not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { quantity, price } = body as { quantity?: number; price?: number };

    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number" },
        { status: 400 }
      );
    }
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    const oldQty = Number(existing.quantity) || 0;
    const oldAvg = Number(existing.avg_buy_price) || 0;
    const newQty = oldQty + quantity;
    const newAvg = (oldQty * oldAvg + quantity * price) / newQty;

    const { data: updated, error: updateError } = await supabase
      .from("portfolio_holdings")
      .update({
        quantity: newQty,
        avg_buy_price: newAvg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Failed to update holding" },
        { status: 500 }
      );
    }

    let currentPrice = 0;
    try {
      const quote = await fetchQuote(updated.symbol);
      currentPrice = quote?.price ?? 0;
    } catch {
      // ignore — caller can still use the holding row.
    }

    const currentValue = currentPrice * updated.quantity;
    const investedValue = updated.avg_buy_price * updated.quantity;
    const pnl = currentValue - investedValue;
    const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

    return NextResponse.json({
      holding: { ...updated, currentPrice, currentValue, pnl, pnlPercent },
      averaging: {
        previousQuantity: oldQty,
        previousAvgPrice: oldAvg,
        addedQuantity: quantity,
        addedAtPrice: price,
        newQuantity: newQty,
        newAvgPrice: newAvg,
      },
    });
  } catch (error) {
    console.error("POST /api/portfolio/[id]/buy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
