import { NextRequest, NextResponse } from "next/server";
import { yahoo } from "@/lib/stock/yahoo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 1) return NextResponse.json({ results: [] });

  try {
    const data = await yahoo.search(q, { quotesCount: 8, newsCount: 0 });
    const results = (data.quotes ?? [])
      .filter((row) => typeof row.symbol === "string")
      .map((row) => ({
        symbol: String(row.symbol),
        name: (row.shortname as string) || (row.longname as string) || String(row.symbol),
        exchange: (row.exchDisp as string) || (row.exchange as string) || "",
      }));
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (e) {
    console.error("[/api/insights/search]", e);
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
