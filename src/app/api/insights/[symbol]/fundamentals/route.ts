import { NextRequest, NextResponse } from "next/server";
import { getCompanyFinancials } from "@/lib/insights/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  try {
    const financials = await getCompanyFinancials(symbol);
    if (!financials) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(financials, {
      headers: { "Cache-Control": "private, max-age=900" },
    });
  } catch (e) {
    console.error("[/api/insights/fundamentals]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
