import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateExcelReport } from "@/lib/excel-generator";
import { sendDailyBriefEmail } from "@/lib/email-sender";

export async function POST(request: NextRequest) {
  try {
    // Require an authenticated user so this endpoint can't be used as an
    // open email relay.
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, test } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    if (test) {
      // Send a simple test email with Excel attachment
      const testData = [
        {
          Company: "Apple Inc.",
          "Open Price": 150.25,
          "Close Price": 152.10,
          "High": 153.50,
          "Low": 149.80,
          Trend: "Bullish" as const,
          "AI Insight": "Apple shows strong momentum with positive technical indicators."
        },
        {
          Company: "Tesla Inc.",
          "Open Price": 245.30,
          "Close Price": 243.75,
          "High": 248.90,
          "Low": 242.10,
          Trend: "Bearish" as const,
          "AI Insight": "Tesla facing short-term pressure but long-term outlook remains positive."
        }
      ];

      const excelBuffer = generateExcelReport(testData, "Test Daily Stock Report");
      const sampleSummary = [
        "This is a SAMPLE daily brief from AlphaSight AI.",
        "",
        "Markets opened with mixed sentiment today. Tech names led early gains",
        "while energy lagged on softer crude prices. Your real daily brief will",
        "replace this section with AI-generated analysis based on the assets you",
        "selected when scheduling.",
        "",
        "Attached is a sample Excel report (sample-daily-brief.xlsx) showing the",
        "format you will receive each day at your chosen time.",
      ].join("\n");
      const emailSent = await sendDailyBriefEmail(email, sampleSummary, excelBuffer);

      return NextResponse.json({
        success: emailSent,
        message: emailSent ? "Test email sent successfully" : "Failed to send test email"
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}