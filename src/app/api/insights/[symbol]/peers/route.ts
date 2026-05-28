import { NextRequest, NextResponse } from "next/server";
import { getCompanyPeers } from "@/lib/insights/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  try {
    const peers = await getCompanyPeers(symbol);
    return NextResponse.json(peers ?? { symbol, trend: [], citations: [] }, {
      headers: { "Cache-Control": "private, max-age=900" },
    });
  } catch (e) {
    console.error("[/api/insights/peers]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
