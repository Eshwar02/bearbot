import { AGENT_CONFIG } from "./config";
import { GENERAL_CHAT_PROMPT, STOCK_ANALYSIS_SYSTEM_PROMPT } from "./prompts";
import type { StockAnalysis } from "@/types/stock";

type ChatRole = "user" | "assistant";

const CEREBRAS_ENDPOINT = "https://api.cerebras.ai/v1/chat/completions";
const CEREBRAS_GENERAL_MODEL = process.env.CEREBRAS_GENERAL_MODEL || "llama3.1-8b";
const CEREBRAS_STOCK_MODEL = process.env.CEREBRAS_STOCK_MODEL || CEREBRAS_GENERAL_MODEL;
const CEREBRAS_BRIEF_MODEL = process.env.CEREBRAS_BRIEF_MODEL || CEREBRAS_GENERAL_MODEL;

export function normalizeApiKey(rawValue: string | undefined): string {
  const trimmed = rawValue?.trim() ?? "";
  if (!trimmed) return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function readCerebrasApiKey(): string {
  return normalizeApiKey(process.env.CEREBRAS_API_KEY);
}

export function validateCerebrasSetup(): { valid: boolean; error?: string } {
  const apiKey = readCerebrasApiKey();
  if (!apiKey) {
    return { valid: false, error: "CEREBRAS_API_KEY environment variable is not set" };
  }
  return { valid: true };
}

export function friendlyCerebrasError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const short = raw.replace(/\s+/g, " ").slice(0, 300);
  if (/401|invalid api key|unauthorized/i.test(raw)) {
    return `Cerebras rejected the API key. Check CEREBRAS_API_KEY. Details: ${short}`;
  }
  if (/429|rate limit|quota/i.test(raw)) {
    return `Cerebras rate limit reached. Please retry shortly. Details: ${short}`;
  }
  if (/5\d\d|server error|bad gateway/i.test(raw)) {
    return `Cerebras server error. Try again shortly. Details: ${short}`;
  }
  return `Cerebras error: ${short}`;
}

function parseContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }
  if (content && typeof content === "object") {
    const text = (content as { text?: unknown }).text;
    return typeof text === "string" ? text : "";
  }
  return "";
}

function parseCerebrasDeltaText(delta: unknown): string {
  if (typeof delta === "string") return delta;

  // Some responses may emit content as structured chunks:
  // [{ type: "text", text: "..." }, ...]
  if (Array.isArray(delta)) {
    return delta
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }

  if (delta && typeof delta === "object") {
    const text = (delta as { text?: unknown }).text;
    if (typeof text === "string") return text;
  }

  return "";
}

function buildStockContext(analysis: StockAnalysis): string {
  const { quote, technicals, news, companyInfo } = analysis;
  const lines: string[] = [
    `REAL-TIME DATA FOR ${quote.name} (${quote.symbol})`,
    `- Current Price: ${quote.currency} ${quote.price.toFixed(2)}`,
    `- Change: ${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`,
    `- Open: ${quote.currency} ${quote.open.toFixed(2)}`,
    `- Previous Close: ${quote.currency} ${quote.previousClose.toFixed(2)}`,
    `- Day Range: ${quote.dayLow.toFixed(2)} - ${quote.dayHigh.toFixed(2)}`,
    `- 52-Week Range: ${quote.low52.toFixed(2)} - ${quote.high52.toFixed(2)}`,
    `- Volume: ${quote.volume}`,
    `- Market Cap: ${quote.marketCap || "N/A"}`,
    `- P/E: ${quote.pe ?? "N/A"}`,
    "",
    "TECHNICAL INDICATORS",
    `- SMA20: ${technicals.sma20 ?? "N/A"}`,
    `- SMA50: ${technicals.sma50 ?? "N/A"}`,
    `- RSI: ${technicals.rsi ?? "N/A"}`,
    `- Trend: ${technicals.trend}`,
  ];

  if (companyInfo) {
    lines.push(
      "",
      "COMPANY PROFILE",
      `- Sector: ${companyInfo.sector}`,
      `- Industry: ${companyInfo.industry}`,
      `- Country: ${companyInfo.country || "N/A"}`
    );
  }

  if (news.length > 0) {
    lines.push("", "RECENT NEWS");
    for (const item of news.slice(0, 6)) {
      lines.push(`- ${item.title} — ${item.source} (${item.publishedAt.split("T")[0]})`);
    }
  }

  return lines.join("\n");
}

interface CerebrasCallArgs {
  model: string;
  systemPrompt: string;
  message: string;
  history?: Array<{ role: ChatRole; content: string }>;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

function buildPayload(args: CerebrasCallArgs, stream: boolean): Record<string, unknown> {
  return {
    model: args.model,
    messages: [
      { role: "system", content: args.systemPrompt },
      ...(args.history ?? []).map((item) => ({
        role: item.role,
        content: item.content,
      })),
      { role: "user", content: args.message },
    ],
    temperature: args.temperature ?? AGENT_CONFIG.general.temp,
    max_tokens: args.maxTokens ?? AGENT_CONFIG.general.maxTokens,
    stream,
  };
}

async function generateCerebrasResponse(args: CerebrasCallArgs): Promise<string> {
  const apiKey = readCerebrasApiKey();
  if (!apiKey) throw new Error("CEREBRAS_API_KEY not set");

  const payload = buildPayload(args, false);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 35_000);
  try {
    const response = await fetch(CEREBRAS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Cerebras HTTP ${response.status}${body ? `: ${body.slice(0, 400)}` : ""}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    return parseContent(data.choices?.[0]?.message?.content).trim();
  } finally {
    clearTimeout(timer);
  }
}

async function streamCerebrasResponse(
  args: CerebrasCallArgs
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = readCerebrasApiKey();
  if (!apiKey) throw new Error("CEREBRAS_API_KEY not set");

  const payload = buildPayload(args, true);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 35_000);

  let response: Response;
  try {
    response = await fetch(CEREBRAS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }

  if (!response.ok) {
    clearTimeout(timer);
    const body = await response.text().catch(() => "");
    throw new Error(
      `Cerebras HTTP ${response.status}${body ? `: ${body.slice(0, 400)}` : ""}`
    );
  }

  if (!response.body) {
    clearTimeout(timer);
    throw new Error("Cerebras response stream is missing body");
  }

  const upstream = response.body;
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(streamController) {
      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            if (buffer.trim().length > 0) {
              processBuffer(buffer, streamController, encoder);
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replace(/\r\n/g, "\n");

          let eventEnd = buffer.indexOf("\n\n");
          while (eventEnd !== -1) {
            const rawEvent = buffer.slice(0, eventEnd);
            buffer = buffer.slice(eventEnd + 2);
            processBuffer(rawEvent, streamController, encoder);
            eventEnd = buffer.indexOf("\n\n");
          }
        }
      } catch (error) {
        streamController.error(error);
        return;
      } finally {
        clearTimeout(timer);
        reader.releaseLock();
      }

      streamController.close();
    },
    cancel() {
      clearTimeout(timer);
      controller.abort();
    },
  });
}

function processBuffer(
  rawEvent: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
) {
  for (const line of rawEvent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;

    try {
      const parsed = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: unknown } }>;
      };
      const delta = parsed.choices?.[0]?.delta?.content;
      const text = parseCerebrasDeltaText(delta);
      if (text.length > 0) {
        controller.enqueue(encoder.encode(text));
      }
    } catch {
      // Keep stream alive on malformed chunks.
    }
  }
}

export async function streamGeneralChat(
  message: string,
  history: Array<{ role: ChatRole; content: string }>,
  kind: "brief" | "normal" = "normal",
  userMemory?: string
): Promise<ReadableStream<Uint8Array>> {
  const brevityRule =
    kind === "brief"
      ? "Brief mode: reply in 1-3 concise sentences unless the user explicitly asks for detail."
      : "";
  const basePrompt = [GENERAL_CHAT_PROMPT, brevityRule].filter(Boolean).join("\n\n");
  const systemPrompt = userMemory ? `${basePrompt}\n\n${userMemory}` : basePrompt;

  return streamCerebrasResponse({
    model: CEREBRAS_GENERAL_MODEL,
    systemPrompt,
    message,
    history,
    temperature: kind === "brief" ? AGENT_CONFIG.general.briefTemp : AGENT_CONFIG.general.temp,
    maxTokens: kind === "brief" ? AGENT_CONFIG.general.briefMaxTokens : AGENT_CONFIG.general.maxTokens,
    timeoutMs: AGENT_CONFIG.general.timeoutMs,
  });
}

export async function streamStockAnalysis(
  message: string,
  analysis: StockAnalysis,
  history: Array<{ role: ChatRole; content: string }>,
  userMemory?: string
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = [STOCK_ANALYSIS_SYSTEM_PROMPT, buildStockContext(analysis), userMemory]
    .filter(Boolean)
    .join("\n\n---\n\n");

  return streamCerebrasResponse({
    model: CEREBRAS_STOCK_MODEL,
    systemPrompt,
    message,
    history,
    temperature: AGENT_CONFIG.stock.temp,
    maxTokens: AGENT_CONFIG.stock.maxTokens,
    timeoutMs: AGENT_CONFIG.stock.timeoutMs,
  });
}

export async function generateDailyBrief(prompt: string): Promise<string> {
  try {
    return await generateCerebrasResponse({
      model: CEREBRAS_BRIEF_MODEL,
      systemPrompt:
        "Generate a concise daily portfolio brief in markdown. Use only provided data and avoid hallucinations.",
      message: prompt,
      history: [],
      temperature: AGENT_CONFIG.brief.temp,
      maxTokens: AGENT_CONFIG.brief.maxTokens,
      timeoutMs: AGENT_CONFIG.brief.timeoutMs,
    });
  } catch (error) {
    return `Unable to generate brief. ${friendlyCerebrasError(error)}`;
  }
}
