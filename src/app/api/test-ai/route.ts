import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mistralKey = process.env.MISTRAL_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const shouldProbe = request.nextUrl.searchParams.get("probe") === "1";

  const status: Record<string, unknown> = {
    mistral: {
      configured: !!mistralKey,
    },
    cerebras: {
      configured: !!cerebrasKey,
    },
    groq: {
      configured: !!groqKey,
    },
  };

  if (shouldProbe) {
    const probePrompt = "Reply with exactly: ok";
    const runProbe = async (url: string, key: string, model: string) => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 8,
          temperature: 0,
          messages: [{ role: "user", content: probePrompt }],
        }),
      });
      if (!res.ok) {
        return { ok: false, status: res.status };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "";
      return { ok: content.includes("ok"), status: res.status };
    };

    if (mistralKey) {
      status.mistral = {
        ...(status.mistral as object),
        probe: await runProbe(
          "https://api.mistral.ai/v1/chat/completions",
          mistralKey,
          process.env.MISTRAL_GENERAL_MODEL || "mistral-small-latest"
        ),
      };
    }
    if (cerebrasKey) {
      status.cerebras = {
        ...(status.cerebras as object),
        probe: await runProbe(
          "https://api.cerebras.ai/v1/chat/completions",
          cerebrasKey,
          process.env.CEREBRAS_GENERAL_MODEL || "llama3.1-8b"
        ),
      };
    }
  }

  return NextResponse.json({
    ...status,
  });
}
