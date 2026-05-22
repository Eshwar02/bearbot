import Groq from 'groq-sdk';
import { textToStream } from './mistral'; // Reuse the stream converter
import { AGENT_CONFIG } from './config';
import { GENERAL_CHAT_PROMPT, STOCK_ANALYSIS_SYSTEM_PROMPT } from './prompts';

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

function buildGroqStockContext(analysis: any): string {
  const quote = analysis?.quote;
  if (!quote) return "";

  const lines = [
    `REAL-TIME DATA FOR ${quote.name} (${quote.symbol})`,
    `- Current Price: ${quote.currency} ${Number(quote.price).toFixed(2)}`,
    `- Change: ${Number(quote.change).toFixed(2)} (${Number(quote.changePercent).toFixed(2)}%)`,
    `- Previous Close: ${Number(quote.previousClose).toFixed(2)}`,
    `- Day Range: ${Number(quote.dayLow).toFixed(2)} - ${Number(quote.dayHigh).toFixed(2)}`,
    `- 52-Week Range: ${Number(quote.low52).toFixed(2)} - ${Number(quote.high52).toFixed(2)}`,
    `- Market Cap: ${quote.marketCap ?? "N/A"}`,
    `- Volume: ${quote.volume ?? "N/A"}`,
    `- P/E Ratio: ${quote.pe ?? "N/A"}`,
    `- Exchange: ${quote.exchange ?? "N/A"}`,
  ];

  if (analysis.companyInfo) {
    lines.push(
      "",
      "COMPANY PROFILE",
      `- Sector: ${analysis.companyInfo.sector ?? "Unknown"}`,
      `- Industry: ${analysis.companyInfo.industry ?? "Unknown"}`,
      `- Country: ${analysis.companyInfo.country ?? "N/A"}`
    );
  }

  if (analysis.technicals) {
    lines.push(
      "",
      "TECHNICALS",
      `- 20-day SMA: ${analysis.technicals.sma20 ?? "N/A"}`,
      `- 50-day SMA: ${analysis.technicals.sma50 ?? "N/A"}`,
      `- RSI: ${analysis.technicals.rsi ?? "N/A"}`,
      `- Trend: ${analysis.technicals.trend ?? "neutral"}`
    );
  }

  if (Array.isArray(analysis.news) && analysis.news.length > 0) {
    lines.push("", "RECENT NEWS");
    for (const item of analysis.news.slice(0, 5)) {
      lines.push(`- ${item.title} - ${item.source} (${item.publishedAt ?? "date unavailable"})`);
    }
  }

  return lines.join("\n");
}

function readGroqApiKey(): string {
  return process.env.GROQ_API_KEY || "";
}

export function validateGroqSetup(): { valid: boolean; error?: string } {
  const apiKey = readGroqApiKey();
  if (!apiKey) {
    return { valid: false, error: "GROQ_API_KEY environment variable is not set" };
  }
  return { valid: true };
}

export async function generateGroqResponse(
  message: string,
  context: {
    systemPrompt: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const apiKey = readGroqApiKey();
  if (!apiKey) throw new Error("Groq API key not configured");

  const groq = new Groq({ apiKey });

  const messages: any = [
    { role: "system", content: context.systemPrompt },
    ...(context.history || []).map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content
    })),
    { role: "user", content: message }
  ];

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: context.temperature ?? AGENT_CONFIG.general.temp,
    max_tokens: context.maxTokens ?? AGENT_CONFIG.general.maxTokens,
  });

  return completion.choices[0]?.message?.content || "";
}

export async function streamGeneralChat(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  kind: "brief" | "normal",
  userMemory?: string
): Promise<ReadableStream<Uint8Array>> {
  const brevityRule =
    kind === "brief"
      ? "Brief mode: reply in 1-3 concise sentences unless the user explicitly asks for detail."
      : "";
  const systemPrompt = [GENERAL_CHAT_PROMPT, brevityRule].filter(Boolean).join("\n\n");

  const context = {
    systemPrompt: userMemory ? `${systemPrompt}\n\nUser context: ${userMemory}` : systemPrompt,
    history,
    temperature: kind === "brief" ? AGENT_CONFIG.general.briefTemp : AGENT_CONFIG.general.temp,
    maxTokens: kind === "brief" ? AGENT_CONFIG.general.briefMaxTokens : AGENT_CONFIG.general.maxTokens,
  };

  const text = await generateGroqResponse(message, context);
  return textToStream(text);
}

export async function streamStockAnalysis(
  message: string,
  analysis: any,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMemory?: string
): Promise<ReadableStream<Uint8Array>> {
  // Groq as fallback for stock
  const systemPrompt = [
    STOCK_ANALYSIS_SYSTEM_PROMPT,
    buildGroqStockContext(analysis),
  ].filter(Boolean).join("\n\n---\n\n");

  const context = {
    systemPrompt: userMemory ? `${systemPrompt}\n\nUser context: ${userMemory}` : systemPrompt,
    history,
    temperature: AGENT_CONFIG.stock.temp,
    maxTokens: AGENT_CONFIG.stock.maxTokens,
  };

  const text = await generateGroqResponse(message, context);
  return textToStream(text);
}

export function friendlyGroqError(error: any): string {
  if (error?.message?.includes("API key")) {
    return "Groq API key is not configured";
  }
  return "Groq service is temporarily unavailable";
}

export async function generateDailyBrief(prompt: string): Promise<string> {
  const context = {
    systemPrompt: "Generate a concise daily portfolio brief in markdown format.",
    temperature: AGENT_CONFIG.brief.temp,
    maxTokens: AGENT_CONFIG.brief.maxTokens,
  };

  return await generateGroqResponse(prompt, context);
}
