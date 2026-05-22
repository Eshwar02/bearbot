import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRiskReport } from "@/lib/ai/risk-assessment";

/**
 * POST /api/risk-assessment
 * Generate a full structured risk report for the authenticated user's portfolio.
 * No body required — fetches holdings directly from Supabase.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's portfolio holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from("portfolio_holdings")
      .select("symbol, quantity, avg_buy_price")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (holdingsError) {
      return NextResponse.json(
        { error: "Failed to fetch portfolio holdings" },
        { status: 500 }
      );
    }

    if (!holdings || holdings.length === 0) {
      return NextResponse.json({
        report: {
          riskLevel: "Low",
          riskScore: 0,
          sectorAllocations: [],
          concentrationWarnings: [],
          stockRisks: [],
          macroThreats: [],
          aiNarrative:
            "No holdings found. Add stocks to your portfolio to get a risk analysis.",
          recommendations: [
            {
              urgency: "opportunity",
              title: "Start building your portfolio",
              description:
                "Add diversified holdings across multiple sectors to begin receiving AI-powered risk insights.",
            },
          ],
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Generate the full risk report
    const report = await generateRiskReport(holdings);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("POST /api/risk-assessment error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
