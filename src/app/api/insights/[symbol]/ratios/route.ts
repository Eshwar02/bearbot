import { NextRequest, NextResponse } from "next/server";
import { getCompanyOverview } from "@/lib/insights/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  try {
    const overview = await getCompanyOverview(symbol);
    if (!overview) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(overview, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (e) {
    console.error("[/api/insights/ratios]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
