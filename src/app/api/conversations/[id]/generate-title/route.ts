import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateGroqResponse, validateGroqSetup } from "@/lib/ai/groq";

const TITLE_SYSTEM_PROMPT = `You generate concise chat titles.

Rules:
- 3 to 6 words
- Title Case (capitalize each significant word)
- No quotes, no trailing punctuation
- No emojis
- Describe the topic, not the action ("ITC Stock Holdings" not "User Asks About ITC")
- If finance-related, lead with the ticker or company name
- Output ONLY the title, nothing else`;

function sanitizeTitle(raw: string): string {
  let t = raw.trim();
  // strip surrounding quotes / backticks
  t = t.replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, "");
  // remove trailing punctuation
  t = t.replace(/[.!?,;:]+$/g, "");
  // collapse whitespace
  t = t.replace(/\s+/g, " ");
  // cap length
  if (t.length > 80) t = t.slice(0, 80).trim();
  return t;
}

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

    const body = await request.json();
    const { userMessage, assistantMessage } = body as {
      userMessage?: string;
      assistantMessage?: string;
    };

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "userMessage required" },
        { status: 400 }
      );
    }

    // Ownership check
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("id, user_id, title")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (convError || !conv) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const setup = validateGroqSetup();
    if (!setup.valid) {
      return NextResponse.json(
        { error: setup.error || "AI not configured" },
        { status: 500 }
      );
    }

    const userPart = userMessage.trim().slice(0, 1200);
    const assistantPart = (assistantMessage || "").trim().slice(0, 1200);

    const prompt = [
      "User message:",
      userPart,
      assistantPart ? "\nAssistant reply:" : "",
      assistantPart,
      "\nReturn the title only.",
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await generateGroqResponse(prompt, {
      systemPrompt: TITLE_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 30,
    });

    const title = sanitizeTitle(raw || "");
    if (!title) {
      return NextResponse.json({ error: "Empty title" }, { status: 500 });
    }

    // Persist
    await supabase
      .from("conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ title });
  } catch (error) {
    console.error("POST /api/conversations/[id]/generate-title error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
