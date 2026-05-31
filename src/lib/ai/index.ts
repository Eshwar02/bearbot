import type { StockAnalysis } from "@/types/stock";
import {
  streamStockAnalysis as mistralStockStream,
  streamGeneralChat as mistralGeneralStream,
  validateMistralSetup,
  generateDailyBrief as mistralGenerateDailyBrief,
} from "./mistral";
import {
  streamStockAnalysis as cerebrasStockStream,
  streamGeneralChat as cerebrasGeneralStream,
  validateCerebrasSetup,
  generateDailyBrief as cerebrasGenerateDailyBrief,
  normalizeApiKey as normalizeCerebrasApiKey,
} from "./cerebras";
import type { ChatPlan } from "./planner";
import { formatPlanForExecutor } from "./planner";

export type { ChatPlan } from "./planner";
export { generatePlan, formatPlanForExecutor } from "./planner";

type ChatRole = "user" | "assistant";
type ChatHistory = Array<{ role: ChatRole; content: string }>;

export type ChatMode = "stock" | "general";
type LlmProvider = "mistral" | "cerebras";

interface StreamChatArgs {
  mode: ChatMode;
  message: string;
  history: ChatHistory;
  analysis?: StockAnalysis;
  kind?: "brief" | "normal";
  model?: LlmProvider;
  userMemory?: string;
  routing?: Omit<ProviderRoutingSignal, "userRequestedModel">;
  // Optional plan from the planner step (plan-then-execute). When present,
  // it's appended to userMemory so the executor LLM sees the subtask list as
  // part of its system context. No change to provider call signatures.
  plan?: ChatPlan | null;
}

export function validateAiSetup(): {
  valid: boolean;
  error?: string;
  stockPrimary: LlmProvider | "none";
  generalPrimary: LlmProvider | "none";
  fallback: LlmProvider | "none";
  stockProviders: LlmProvider[];
  generalProviders: LlmProvider[];
  classifierProviders: LlmProvider[];
} {
  const mistral = validateMistralSetup();
  const cerebras = validateCerebrasSetup();

  const stockProviders: LlmProvider[] = [];
  if (mistral.valid) stockProviders.push("mistral");
  if (cerebras.valid) stockProviders.push("cerebras");

  const generalProviders: LlmProvider[] = [];
  if (cerebras.valid) generalProviders.push("cerebras");
  if (mistral.valid) generalProviders.push("mistral");

  const classifierProviders: LlmProvider[] = [];
  if (cerebras.valid) classifierProviders.push("cerebras");
  if (mistral.valid) classifierProviders.push("mistral");

  const stockPrimary = stockProviders[0] ?? "none";
  const generalPrimary = generalProviders[0] ?? "none";
  const fallback = generalProviders[1] ?? stockProviders[1] ?? "none";

  const valid = stockProviders.length > 0 && generalProviders.length > 0;

  if (!valid) {
    return {
      valid: false,
      stockPrimary: "none",
      generalPrimary: "none",
      fallback: "none",
      stockProviders: [],
      generalProviders: [],
      classifierProviders: [],
      error: `No LLM configured. Mistral: ${mistral.error}, Cerebras: ${cerebras.error}`,
    };
  }

  return {
    valid: true,
    stockPrimary,
    generalPrimary,
    fallback,
    stockProviders,
    generalProviders,
    classifierProviders,
  };
}

function applyModelPreference(
  providers: LlmProvider[],
  preferred?: LlmProvider
): LlmProvider[] {
  if (!preferred || !providers.includes(preferred)) return providers;
  return [preferred, ...providers.filter((provider) => provider !== preferred)];
}

// ────────────────────────────────────────────────────────────────────────
// Provider routing
// ────────────────────────────────────────────────────────────────────────
// Cerebras → fast lane: small_talk, brief replies, simple price quote,
//            classifier-style short answers.
// Mistral  → heavy lane: full stock analysis, web-search synthesis,
//            think/canvas modes, long-form finance, deep research.
//
// Falls back to the other provider if the chosen one is unavailable.

export type IntentKind = "small_talk" | "stock" | "general_finance" | "general_other";
export type IntentDepth = "tiny" | "short" | "medium" | "long";

export interface ProviderRoutingSignal {
  kind: IntentKind;
  depth: IntentDepth;
  chatMode: ChatMode;
  isDetailedStockRequest: boolean;
  hasWebSearch: boolean;
  thinkMode: boolean;
  canvasMode: boolean;
  generalKind: "brief" | "normal";
  userRequestedModel?: LlmProvider;
}

const DEPTH_RANK: Record<IntentDepth, number> = {
  tiny: 0,
  short: 1,
  medium: 2,
  long: 3,
};

export function selectProvider(signal: ProviderRoutingSignal): LlmProvider {
  // Explicit user override wins.
  if (signal.userRequestedModel) return signal.userRequestedModel;

  // Heavy-lane triggers → Mistral.
  if (signal.hasWebSearch) return "mistral";
  if (signal.thinkMode || signal.canvasMode) return "mistral";
  if (signal.isDetailedStockRequest) return "mistral";
  if (signal.depth === "long") return "mistral";
  if (signal.kind === "general_finance" && DEPTH_RANK[signal.depth] >= DEPTH_RANK.medium) {
    return "mistral";
  }
  if (signal.kind === "stock" && DEPTH_RANK[signal.depth] >= DEPTH_RANK.medium) {
    return "mistral";
  }

  // Fast-lane default → Cerebras.
  return "cerebras";
}

export function shouldUsePlanner(opts: {
  isGuest: boolean;
  earlySmallTalk: boolean;
  wantsMemoryAnswer: boolean;
  cerebrasValid: boolean;
  thinkMode: boolean;
  hasImageAttachments: boolean;
  depth: string;
  kind: string;
}): boolean {
  if (opts.isGuest) return false;
  if (opts.earlySmallTalk) return false;
  if (opts.wantsMemoryAnswer) return false;
  if (!opts.cerebrasValid) return false;
  if (opts.thinkMode) return true;
  if (opts.hasImageAttachments) return true;
  if (opts.depth === "long") return true;
  if (opts.depth === "medium" && (opts.kind === "stock" || opts.kind === "general_finance")) return true;
  return false;
}

export async function streamChat(
  args: StreamChatArgs
): Promise<{ stream: ReadableStream<Uint8Array>; provider: string }> {
  const setup = validateAiSetup();
  if (!setup.valid) {
    throw new Error("No LLM provider is configured");
  }

  const availableProviders =
    args.mode === "stock" ? setup.stockProviders : setup.generalProviders;

  // Decide preferred provider: explicit user override > intent-based router.
  let preferred: LlmProvider | undefined = args.model;
  if (!preferred && args.routing) {
    preferred = selectProvider({ ...args.routing, userRequestedModel: undefined });
  }
  const providers = applyModelPreference(availableProviders, preferred);

  // Splice the planner output into userMemory so the executor LLM sees it as
  // part of its system context. Both Mistral and Cerebras streamers accept
  // userMemory verbatim, so no per-provider plumbing is needed.
  const memoryWithPlan = args.plan
    ? [args.userMemory, formatPlanForExecutor(args.plan)].filter(Boolean).join("\n\n")
    : args.userMemory;

  console.log(
    `[AI] Routing → preferred=${preferred ?? "default"} order=${providers.join(",")} plan=${args.plan ? "yes" : "no"}`
  );

  for (const provider of providers) {
    try {
      let stream: ReadableStream<Uint8Array> | undefined;
      if (args.mode === "stock") {
        if (!args.analysis) throw new Error("Stock mode requires analysis data");
        if (provider === "mistral") {
          stream = await mistralStockStream(
            args.message,
            args.analysis,
            args.history,
            memoryWithPlan
          );
        } else if (provider === "cerebras") {
          stream = await cerebrasStockStream(
            args.message,
            args.analysis,
            args.history,
            memoryWithPlan
          );
        } else {
          continue;
        }
      } else {
        if (provider === "cerebras") {
          stream = await cerebrasGeneralStream(
            args.message,
            args.history,
            args.kind ?? "normal",
            memoryWithPlan
          );
        } else if (provider === "mistral") {
          stream = await mistralGeneralStream(
            args.message,
            args.history,
            args.kind ?? "normal",
            memoryWithPlan
          );
        } else {
          continue;
        }
      }
      if (stream) {
        const tag = args.plan ? `${provider}+plan` : provider;
        console.log(`[AI] Response generated by ${tag}`);
        return { stream, provider: tag };
      }
    } catch (err) {
      console.warn(`Provider ${provider} failed:`, err);
      continue;
    }
  }

  throw new Error("All LLM providers failed");
}

export async function generateDailyBrief(prompt: string): Promise<string> {
  const setup = validateAiSetup();
  if (!setup.valid) {
    return `Unable to generate brief. ${setup.error ?? "No AI provider configured."}`;
  }

  const providers = setup.generalProviders;

  for (const provider of providers) {
    try {
      const text = provider === "cerebras"
        ? await cerebrasGenerateDailyBrief(prompt)
        : await mistralGenerateDailyBrief(prompt);
      if (text && !/^Unable to generate brief/i.test(text)) {
        return text;
      }
    } catch (err) {
      console.warn(`Daily brief provider ${provider} failed:`, err);
    }
  }

  return "Unable to generate brief right now.";
}

// Legacy regex classifier — kept as a synchronous, no-cost fallback when the
// LLM classifier (classifyMessage) times out or the API key is missing. The
// route should prefer classifyMessage; this is the safety net only.
export async function classifyIntent(message: string): Promise<{
  intent: string;
  company_name: string | null;
  symbols: string[];
  query_type: string;
} | null> {
  const text = message.trim();
  if (!text) return null;

  if (/^(hi|hey|hello|yo|thanks|thank you|bye|ok|okay)$/i.test(text)) {
    return {
      intent: "greeting",
      company_name: null,
      symbols: [],
      query_type: "general",
    };
  }

  const tickerMatch = text.match(/\$?([A-Z]{1,10}(?:\.[A-Z]{1,2})?)\b/);
  if (tickerMatch) {
    return {
      intent: "stock_query",
      company_name: null,
      symbols: [tickerMatch[1].toUpperCase()],
      query_type: "analysis",
    };
  }

  if (/\b(analyze|analysis|stock|share|price|quote|buy|sell|target)\b/i.test(text)) {
    return {
      intent: "stock_query",
      company_name: text,
      symbols: [],
      query_type: "analysis",
    };
  }

  return {
    intent: "general_finance",
    company_name: null,
    symbols: [],
    query_type: "general",
  };
}

// ────────────────────────────────────────────────────────────────────────
// LLM-based message classifier
// ────────────────────────────────────────────────────────────────────────
//
// Replaces the brittle regex stack that decided: small_talk vs stock vs
// general, whether to web-search, and how long the response should be.
// One small, fast Mistral call returns a structured judgement that the
// route can trust end-to-end.

export interface MessageClassification {
  kind: "small_talk" | "stock" | "general_finance" | "general_other";
  needs_web_search: boolean;
  company_or_topic: string | null;
  depth: "tiny" | "short" | "medium" | "long";
}

const CLASSIFIER_MODEL = "mistral-small-latest";
const CLASSIFIER_CEREBRAS_MODEL =
  process.env.CEREBRAS_CLASSIFIER_MODEL || process.env.CEREBRAS_GENERAL_MODEL || "llama3.1-8b";
const CLASSIFIER_MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const CLASSIFIER_CEREBRAS_ENDPOINT = "https://api.cerebras.ai/v1/chat/completions";

const CLASSIFIER_SYSTEM_PROMPT = `You are an intent classifier for a personal finance chatbot. For each user message, return STRICT JSON with this shape:

{
  "kind": "small_talk" | "stock" | "general_finance" | "general_other",
  "needs_web_search": boolean,
  "company_or_topic": string | null,
  "depth": "tiny" | "short" | "medium" | "long"
}

Definitions:
- small_talk: casual chat, greetings, mood, daily life, exam, food, sleep, brief acks ("ok", "thanks", "lol", "im tired", "tmrw is my exam"). Never a finance question.
- stock: explicit query about a specific stock, ticker, company's price/analysis/buy-sell.
- general_finance: finance topic but not a specific stock (e.g. "what is RSI", "explain mutual funds", "is gold a good hedge").
- general_other: non-finance information question.

needs_web_search = true ONLY when the user wants fresh / external / news / time-sensitive info that the model cannot reliably answer from prior knowledge. NEVER true for small_talk or pure definitions.

company_or_topic: the entity or topic the user is asking about, or null for small_talk.

depth:
- tiny  → 1–3 sentences (small talk, simple acks, single-fact answers)
- short → ~80–180 words (definitions, quick explanations)
- medium → ~300–500 words (overviews, balanced explanations)
- long  → 500+ words with sections (deep analysis, full company breakdowns)

Return JSON only. No prose. No code fences.`;

function readApiKey(envName: "MISTRAL_API_KEY" | "CEREBRAS_API_KEY"): string {
  return normalizeCerebrasApiKey(process.env[envName]);
}

function fallbackClassification(message: string): MessageClassification {
  // Used when the LLM call fails. Conservative defaults: treat unknown short
  // messages as small_talk so we never accidentally launch a 500-word
  // response or a web search on someone saying "ok bro".
  const t = message.trim();
  const words = t.split(/\s+/).length;
  if (words <= 5 && !/\?/.test(t)) {
    return {
      kind: "small_talk",
      needs_web_search: false,
      company_or_topic: null,
      depth: "tiny",
    };
  }
  return {
    kind: "general_other",
    needs_web_search: false,
    company_or_topic: null,
    depth: "short",
  };
}

export async function classifyMessage(
  message: string,
  recentHistory: ChatHistory = []
): Promise<MessageClassification> {
  const trimmed = message.trim();
  if (!trimmed) return fallbackClassification("");

  const setup = validateAiSetup();
  const providers = setup.classifierProviders;
  if (providers.length === 0) return fallbackClassification(trimmed);

  // Give the classifier the last 2 turns for coreference (e.g. "and what
  // about its dividend?"). Keep it tiny — this is a fast/cheap call.
  const historyTail = recentHistory.slice(-2).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 240),
  }));

  for (const provider of providers) {
    const apiKey = readApiKey(provider === "cerebras" ? "CEREBRAS_API_KEY" : "MISTRAL_API_KEY");
    if (!apiKey) continue;

    const payload = {
      model: provider === "cerebras" ? CLASSIFIER_CEREBRAS_MODEL : CLASSIFIER_MODEL,
      temperature: 0.0,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
        ...historyTail,
        { role: "user", content: trimmed },
      ],
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1700);
    try {
      const res = await fetch(
        provider === "cerebras" ? CLASSIFIER_CEREBRAS_ENDPOINT : CLASSIFIER_MISTRAL_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );
      if (!res.ok) {
        console.warn(`[classifyMessage] ${provider} HTTP`, res.status);
        continue;
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = data.choices?.[0]?.message?.content ?? "";
      const cleaned = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as Partial<MessageClassification>;

      const kind: MessageClassification["kind"] =
        parsed.kind === "small_talk" ||
        parsed.kind === "stock" ||
        parsed.kind === "general_finance" ||
        parsed.kind === "general_other"
          ? parsed.kind
          : "general_other";
      const depth: MessageClassification["depth"] =
        parsed.depth === "tiny" ||
        parsed.depth === "short" ||
        parsed.depth === "medium" ||
        parsed.depth === "long"
          ? parsed.depth
          : "short";
      const needs_web_search =
        kind === "small_talk" ? false : Boolean(parsed.needs_web_search);
      const company_or_topic =
        typeof parsed.company_or_topic === "string" && parsed.company_or_topic.trim().length > 0
          ? parsed.company_or_topic.trim()
          : null;

      return { kind, needs_web_search, company_or_topic, depth };
    } catch (err) {
      console.warn(
        `[classifyMessage] ${provider} failed, trying next provider:`,
        err instanceof Error ? err.message : err
      );
    } finally {
      clearTimeout(timer);
    }
  }

  return fallbackClassification(trimmed);
}
