import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  classifyMessage,
  streamChat,
  validateAiSetup,
  type MessageClassification,
} from "@/lib/ai";
import {
  searchWeb,
  validateSerpApiSetup,
  normalizeSourceDomain,
  type WebSearchResult,
} from "@/lib/ai/web-search";
import { buildUserContext } from "@/lib/ai/user-context";
import {
  searchMemories,
  listRecentMemories,
  formatMemoriesForPrompt,
  addMemories,
} from "@/lib/ai/memory";
import { rewriteFollowupQuery, needsRewrite } from "@/lib/ai/query-rewriter";
import {
  classifyResponseShape,
  getResponseShapeDirective,
} from "@/lib/ai/response-shape";
import { detectTanglish } from "@/lib/ai/lang-detect";
import {
  LANG_INSTRUCTION_TANGLISH,
  LANG_INSTRUCTION_ENGLISH,
  WEB_SEARCH_INSTRUCTION,
} from "@/lib/ai/prompts";
import { runDeepResearch, formatResearchBundle } from "@/lib/ai/deep-research";
import { resolveSymbol } from "@/lib/stock/symbols";
import { fetchQuote, fetchHistory, fetchCompanyInfo } from "@/lib/stock/data";
import { fetchStockNews } from "@/lib/stock/news";
import { analyzeTechnicals } from "@/lib/stock/technicals";
import { assessMacroRisks, assessRawMaterialRisks } from "@/lib/stock/macro";
import type { StockAnalysis } from "@/types/stock";

const EMPTY_RESPONSE_FALLBACK =
  "Unable to generate analysis right now. Showing available data below.";

const AI_PROGRESS_FRAME_PREFIX = "\u001eALPHASIGHT_PROGRESS:";
const AI_PROGRESS_FRAME_SUFFIX = "\u001e";

type AIProgressFrame = {
  type?: "progress" | "search_source" | "phase_update" | "task_complete";
  label?: string;
  progress?: number;
  status?: "active" | "complete";
  phase?: "planning" | "searching" | "analyzing" | "synthesizing" | "finalizing";
  domain?: string;
  title?: string;
  url?: string;
  timestamp?: number;
};

const TICKER_PATTERN = /\$([A-Z]{1,10}(?:\.[A-Z]{1,2})?)\b/;
const NOUN_PHRASE_PATTERN =
  /(?:analyze|analysis\s+of|price\s+of|quote\s+for|stock\s+of)\s+([a-zA-Z0-9.&\-\s]{2,40})/i;

// Regex-only stock detection. Returns a high-confidence match (dollar ticker,
// bare all-caps ticker, or explicit "analyze X" noun phrase) or null.
// Keyword-only matches ("hold on", "what is rsi") used to trigger stock mode
// here — they're now deferred to the LLM classifier to avoid false positives.
function detectStockQuery(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const dollarMatch = trimmed.match(TICKER_PATTERN);
  if (dollarMatch?.[1]) return dollarMatch[1].toUpperCase();

  if (/^[A-Z]{1,10}(\.[A-Z]{1,2})?$/.test(trimmed)) return trimmed.toUpperCase();

  const nounPhraseMatch = trimmed.match(NOUN_PHRASE_PATTERN);
  if (nounPhraseMatch?.[1]) return nounPhraseMatch[1].trim();

  return null;
}

function isMemoryQuery(message: string): boolean {
  return /\b(remember|memory|memories|know about me|saved facts|what do you know about me|do you know me)\b/i.test(
    message
  );
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function withStreamTimeout(
  stream: ReadableStream<Uint8Array>,
  timeoutMs: number
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const result = await Promise.race<
            ReadableStreamReadResult<Uint8Array> | { timeout: true }
          >([
            reader.read(),
            new Promise<{ timeout: true }>((resolve) =>
              setTimeout(() => resolve({ timeout: true }), timeoutMs)
            ),
          ]);

          if ("timeout" in result) {
            controller.enqueue(encoder.encode(EMPTY_RESPONSE_FALLBACK));
            await reader.cancel("stream timed out");
            controller.close();
            return;
          }

          if (result.done) {
            controller.close();
            return;
          }

          if (result.value) controller.enqueue(result.value);
        }
      } finally {
        reader.releaseLock();
      }
    },
  });
}

function buildStockMetadata(stockAnalysis: StockAnalysis | null): Record<string, unknown> {
  if (!stockAnalysis) return {};
  return {
    stockData: [
      {
        symbol: stockAnalysis.quote.symbol,
        name: stockAnalysis.quote.name,
        price: stockAnalysis.quote.price,
        change: stockAnalysis.quote.change,
        changePercent: stockAnalysis.quote.changePercent,
        volume: stockAnalysis.quote.volume,
        marketCap: stockAnalysis.quote.marketCap,
        pe: stockAnalysis.quote.pe,
        high52: stockAnalysis.quote.high52,
        low52: stockAnalysis.quote.low52,
        dayHigh: stockAnalysis.quote.dayHigh,
        dayLow: stockAnalysis.quote.dayLow,
        open: stockAnalysis.quote.open,
        previousClose: stockAnalysis.quote.previousClose,
        currency: stockAnalysis.quote.currency,
        exchange: stockAnalysis.quote.exchange,
      },
    ],
    news: stockAnalysis.news.map((n) => ({
      title: n.title,
      url: n.url,
      source: n.source,
      publishedAt: n.publishedAt,
      summary: n.summary,
    })),
  };
}

function compactStockAnalysis(input: StockAnalysis): StockAnalysis {
  const compactCompanyInfo = input.companyInfo
    ? {
        ...input.companyInfo,
        description: input.companyInfo.description
          ? input.companyInfo.description.slice(0, 400)
          : "",
      }
    : undefined;

  return {
    ...input,
    // Keep roughly one trading year to reduce context size and token usage.
    history: input.history.slice(-260),
    news: input.news.slice(0, 4),
    macroRisks: input.macroRisks.slice(0, 4),
    rawMaterialRisks: input.rawMaterialRisks.slice(0, 4),
    companyInfo: compactCompanyInfo,
  };
}

function hasVisibleText(value: string): boolean {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim().length > 0;
}

function encodeProgressFrame(frame: AIProgressFrame): Uint8Array {
  return new TextEncoder().encode(
    `${AI_PROGRESS_FRAME_PREFIX}${JSON.stringify(frame)}${AI_PROGRESS_FRAME_SUFFIX}`
  );
}

function chatJsonResponse(
  text: string,
  status: number,
  opts?: { error?: string; details?: string; meta?: Record<string, unknown> }
) {
  return NextResponse.json(
    {
      text: hasVisibleText(text) ? text : EMPTY_RESPONSE_FALLBACK,
      charts: [],
      meta: opts?.meta ?? {},
      ...(opts?.error ? { error: opts.error } : {}),
      ...(opts?.details ? { details: opts.details } : {}),
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const progressEvents: AIProgressFrame[] = [];
    let hasActiveProgressTask = false;
    let lastPhase: AIProgressFrame["phase"] | null = null;
    const inferPhase = (progress: number): NonNullable<AIProgressFrame["phase"]> => {
      if (progress <= 20) return "planning";
      if (progress <= 55) return "searching";
      if (progress <= 75) return "analyzing";
      if (progress <= 92) return "synthesizing";
      return "finalizing";
    };
    const recordProgress = (label: string, progress: number) => {
      const phase = inferPhase(progress);
      if (hasActiveProgressTask) {
        progressEvents.push({ type: "task_complete" });
      }
      if (phase !== lastPhase) {
        progressEvents.push({ type: "phase_update", phase, label });
        lastPhase = phase;
      }
      progressEvents.push({ type: "progress", label, progress, status: "active" });
      hasActiveProgressTask = true;
    };

    console.debug("[chat-api] request received");
    recordProgress("Checking your session", 5);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return chatJsonResponse("Your session expired. Please log in again.", 401, {
        error: "Unauthorized",
      });
    }

    const body = (await request.json()) as {
      message?: string;
      conversationId?: string;
      model?: "mistral";
      forceWebSearch?: boolean;
    };
    const incomingMessage = body.message?.trim() ?? "";
    const requestedConversationId = body.conversationId ?? null;
    const requestedModel: "mistral" = body.model ?? "mistral";
    const forceWebSearch = body.forceWebSearch === true;

    if (!incomingMessage) {
      return chatJsonResponse("Please enter a message.", 400, {
        error: "Message is required",
      });
    }

    if (incomingMessage.length > 4000) {
      return chatJsonResponse("Message too long. Please shorten and retry.", 400, {
        error: "Message too long (max 4000 characters)",
      });
    }
    console.debug("[chat-api] validated request", {
      userId: user.id,
      messageLength: incomingMessage.length,
      hasConversationId: Boolean(requestedConversationId),
    });

    recordProgress("Checking AI provider configuration", 8);
    const aiValidation = validateAiSetup();
    if (!aiValidation.valid) {
      return chatJsonResponse(EMPTY_RESPONSE_FALLBACK, 503, {
        error: "LLM service not configured",
        details: aiValidation.error,
      });
    }

    let activeConversationId = requestedConversationId;
    if (!activeConversationId) {
      recordProgress("Creating a new conversation", 12);
      const title =
        incomingMessage.length > 60
          ? `${incomingMessage.substring(0, 60)}...`
          : incomingMessage;
      const { data: conversation, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (error || !conversation) {
        return chatJsonResponse(EMPTY_RESPONSE_FALLBACK, 500, {
          error: "Failed to create conversation",
          details: error?.message ?? "",
        });
      }
      activeConversationId = conversation.id;
    } else {
      recordProgress("Verifying conversation access", 12);
      const { data: existing, error } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", activeConversationId)
        .eq("user_id", user.id)
        .single();
      if (error || !existing) {
        return chatJsonResponse("Conversation not found.", 404, {
          error: "Conversation not found",
        });
      }
    }

    recordProgress("Loading conversation history and preferences", 18);
    const wantsMemoryAnswer = isMemoryQuery(incomingMessage);

    const [historyResponse, userMemoryBase, prefsResponse, semanticMemoryRows] =
      await Promise.all([
        supabase
          .from("messages")
          .select("role, content")
          .eq("conversation_id", activeConversationId)
          .order("created_at", { ascending: false })
          .limit(12),
        buildUserContext(supabase, user.id).catch((err) => {
          console.warn("[chat-api] buildUserContext failed", err);
          return "";
        }),
        supabase
          .from("user_preferences")
          .select("language_mode")
          .eq("user_id", user.id)
          .maybeSingle(),
        wantsMemoryAnswer
          ? listRecentMemories(supabase, user.id, { limit: 10 })
          : searchMemories(supabase, user.id, incomingMessage),
      ]);

    recordProgress("Saving your message", 22);
    // Insert user message after fetching history to avoid duplicating it in the LLM context
    const { error: userMessageError } = await supabase.from("messages").insert({
      conversation_id: activeConversationId,
      role: "user",
      content: incomingMessage,
    });
    if (userMessageError) {
      return chatJsonResponse(EMPTY_RESPONSE_FALLBACK, 500, {
        error: "Failed to save message",
        details: userMessageError.message,
      });
    }

    // Detect and save explicit name memory. Avoid broad "I am ..." capture:
    // "I am tired" is not a name and should not poison structured memory.
    const nameMatch = incomingMessage.match(
      /(?:my name is|call me)\s+([a-zA-Z][a-zA-Z\s]{0,40})(?:[.!?]|$)/i
    );
    if (nameMatch) {
      recordProgress("Updating user memory", 24);
      const name = nameMatch[1].trim();
      console.log("[chat-api] Saving name:", name);
      const { error } = await supabase
        .from("user_memory")
        .upsert({ user_id: user.id, key: "name", value: name }, { onConflict: "user_id,key" });
      if (error) console.error("[chat-api] Save name error:", error);
    }

    const languageMode: "auto" | "english" | "tanglish" =
      (prefsResponse.data?.language_mode as "auto" | "english" | "tanglish") ?? "auto";

    let useTanglish = false;
    if (languageMode === "tanglish") useTanglish = true;
    else if (languageMode === "english") useTanglish = false;
    else useTanglish = detectTanglish(incomingMessage);

    const languageInstruction = useTanglish
      ? LANG_INSTRUCTION_TANGLISH
      : LANG_INSTRUCTION_ENGLISH;

    const semanticMemoryBlock = formatMemoriesForPrompt(semanticMemoryRows);
    console.debug("[chat-api] semantic memory recall", {
      hits: semanticMemoryRows.length,
      chars: semanticMemoryBlock.length,
    });

    // Defer building the full userMemory until after we know the intent.
    // Small-talk turns must NOT receive portfolio / watchlist / deep research
    // context — that's what causes the "answer hi with a portfolio dump" bug.
    let userMemory = "";

    const historyRows = historyResponse.data;
    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = (
      historyRows || []
    )
      .filter((m): m is { role: "user" | "assistant"; content: string } =>
        m.role === "user" || m.role === "assistant"
      )
      .reverse()
      .map((m) => ({ role: m.role, content: m.content ?? "" }));

    let stockAnalysis: StockAnalysis | null = null;
    let llmMessage = incomingMessage;
    let chatMode: "stock" | "general" = "general";
    let generalKind: "brief" | "normal" = "normal";

    // Coreference resolution: if the user said "tell me about that" / "what
    // about its dividend?", rewrite into a standalone query naming the entity
    // from prior turns. Routing (detect/classify/web-search) uses the rewritten
    // form; the user's original text is still persisted as-is.
    // SKIP rewriting when the user is just chitchatting — rewriting "i'm
    // tired" into "the user is tired about TCS shares" was the bug behind
    // the random-company hallucinations.
    // LLM-based intent classifier — single source of truth for small-talk
    // vs stock vs finance vs other, depth, and whether to web-search.
    // Cheap (mistral-small, json mode, ~200 tokens) and runs in parallel
    // with the rewrite step. Falls back to a safe default on timeout.
    recordProgress("Understanding what you mean", 25);
    let llmIntent: MessageClassification;
    try {
      llmIntent = await withTimeout(
        classifyMessage(incomingMessage, conversationHistory),
        4000,
        "classifyMessage"
      );
    } catch (err) {
      console.warn(
        "[chat-api] classifyMessage timed out; using safe fallback:",
        err instanceof Error ? err.message : err
      );
      llmIntent = {
        kind: "general_other",
        needs_web_search: false,
        company_or_topic: null,
        depth: "short",
      };
    }
    const earlySmallTalk = !wantsMemoryAnswer && llmIntent.kind === "small_talk";
    console.debug("[chat-api] llm classifier", llmIntent);

    let routingMessage = incomingMessage;
    if (!earlySmallTalk && needsRewrite(incomingMessage, conversationHistory.length > 0)) {
      recordProgress("Resolving references from previous turns", 26);
      try {
        routingMessage = await withTimeout(
          rewriteFollowupQuery(incomingMessage, conversationHistory),
          4500,
          "rewriteFollowupQuery"
        );
      } catch (err) {
        console.warn(
          "[chat-api] rewrite failed, using original:",
          err instanceof Error ? err.message : err
        );
        routingMessage = incomingMessage;
      }
      if (routingMessage !== incomingMessage) {
        // Give the LLM both: the explicit standalone query (for accuracy) and
        // the user's original phrasing (for natural reply tone).
        llmMessage = `${incomingMessage}\n\n(Resolved standalone form for your reasoning, do not echo verbatim: "${routingMessage}")`;
      }
    }

    recordProgress("Detecting whether this is a stock or general query", 28);
    // Stock detection driven primarily by the LLM classifier:
    // - small_talk → never a stock query
    // - stock → trust the classifier's company_or_topic
    // - other → fall back to regex tickers / explicit symbols only
    let stockQuery: string | null = null;
    if (!earlySmallTalk) {
      if (llmIntent.kind === "stock") {
        stockQuery = llmIntent.company_or_topic ?? detectStockQuery(routingMessage);
      } else {
        // Even when the classifier said "general", honor an explicit ticker
        // like "$TCS" in the message — that's an unambiguous stock signal.
        stockQuery = detectStockQuery(routingMessage);
      }
    }
    if (earlySmallTalk) {
      generalKind = "brief";
    }
    console.debug("[chat-api] stock detection", {
      stockQuery: stockQuery ?? null,
      classifierKind: llmIntent.kind,
      smallTalk: earlySmallTalk,
    });

    if (stockQuery) {
      recordProgress(`Resolving ticker for "${stockQuery}"`, 35);
      const resolvedSymbol = await withTimeout(resolveSymbol(stockQuery), 8000, "resolveSymbol");
      console.debug("[chat-api] symbol resolution", {
        query: stockQuery,
        symbol: resolvedSymbol ?? null,
      });
      if (!resolvedSymbol) {
        // Classifier or regex thought this was a stock, but we couldn't
        // resolve a ticker. Answer in general mode with a short note instead
        // of forcing the 8-section stock prompt.
        llmMessage = `${incomingMessage}\n\n(Context note for the assistant: I tried to look up live market data for "${stockQuery}" but no matching ticker was found. Answer the user's question helpfully — use the web-search block below if present, never refuse with a "no training data" or "not in my dataset" excuse.)`;
      }
      if (resolvedSymbol) {
        try {
          recordProgress(`Fetching live quote for ${resolvedSymbol}`, 42);
          const quote = await withTimeout(fetchQuote(resolvedSymbol), 10000, "fetchQuote");
          if (!quote) throw new Error("Quote not found");

          // Detect if this is a simple query (price, quote, etc.) to skip heavy data fetching
          const isSimpleQuery =
            /\b(price|quote|current|worth|cost|value|trading\s+at)\b/i.test(routingMessage) &&
            !/\b(analyze|analysis|technical|fundamental|news|sentiment|recommend|buy|sell|invest)\b/i.test(
              routingMessage
            );

          if (isSimpleQuery) {
            console.debug("[chat-api] simple stock query detected, skipping heavy data");
            recordProgress(`Preparing quote snapshot for ${resolvedSymbol}`, 50);
            // For simple queries, just get quote and minimal data
            stockAnalysis = compactStockAnalysis({
              quote,
              history: [], // Skip history for simple queries
              technicals: {
                sma20: null,
                sma50: null,
                ema20: null,
                rsi: null,
                macd: { macdLine: null, signalLine: null, histogram: null },
                supportLevels: [],
                resistanceLevels: [],
                breakoutZones: [],
                trend: "neutral"
              },
              news: [], // Skip news for simple queries
              macroRisks: [],
              rawMaterialRisks: [],
              companyInfo: {
                sector: "Unknown",
                industry: "Unknown",
                description: "",
                employees: null,
                website: "",
                country: "",
              },
            });
            chatMode = "stock";
            console.debug("[chat-api] simple stock analysis ready", { symbol: resolvedSymbol });
          } else {
            // Full analysis for complex queries
            recordProgress(`Fetching history, company profile, and news for ${resolvedSymbol}`, 50);
            const [historyResult, companyInfoResult, newsResult] = await Promise.allSettled([
              withTimeout(fetchHistory(resolvedSymbol, 1), 10000, "fetchHistory"), // Faster timeout
              withTimeout(fetchCompanyInfo(resolvedSymbol), 10000, "fetchCompanyInfo"), // Faster timeout
              withTimeout(fetchStockNews(resolvedSymbol), 10000, "fetchStockNews"), // Faster timeout
            ]);

            const history = historyResult.status === "fulfilled" ? historyResult.value : [];
            const companyInfo =
              companyInfoResult.status === "fulfilled"
                ? companyInfoResult.value
                : {
                    sector: "Unknown",
                    industry: "Unknown",
                    description: "",
                    employees: null,
                    website: "",
                    country: "",
                  };
            const news = newsResult.status === "fulfilled" ? newsResult.value : [];

            recordProgress(`Calculating technical indicators for ${resolvedSymbol}`, 58);
            stockAnalysis = compactStockAnalysis({
              quote,
              history,
              technicals: analyzeTechnicals(history, quote.price),
              news,
              macroRisks: assessMacroRisks(resolvedSymbol, companyInfo.sector, companyInfo.country),
              rawMaterialRisks: assessRawMaterialRisks(resolvedSymbol, companyInfo.sector),
              companyInfo,
            });
            chatMode = "stock";
            console.debug("[chat-api] full stock analysis ready", {
              symbol: resolvedSymbol,
              historyPoints: history.length,
              newsCount: news.length,
            });
          }
        } catch (stockError) {
          console.error("[chat-api] stock enrichment failed", stockError);
          llmMessage = `${incomingMessage}\n\nNote: Live stock lookup for "${resolvedSymbol}" failed (${stockError instanceof Error ? stockError.message : String(stockError)}). Explain this briefly, then continue with a useful text-only analysis.`;
        }
      }
    }

    // Build the userMemory context block, gated by intent.
    //   - small_talk: semantic memories + language only. No portfolio /
    //     watchlist. This lets personal chat remember context without causing
    //     the old "hi" -> portfolio dump bug.
    //   - everything else: full context, as before.
    if (earlySmallTalk && !wantsMemoryAnswer) {
      userMemory = [semanticMemoryBlock, languageInstruction]
        .filter((s) => s && s.length > 0)
        .join("\n\n");
    } else {
      userMemory = [semanticMemoryBlock, userMemoryBase, languageInstruction]
        .filter((s) => s && s.length > 0)
        .join("\n\n");
    }

    if (wantsMemoryAnswer) {
      userMemory = [
        userMemory,
        "Memory-answer instruction: The user is asking about saved memory. Answer directly from the memory/context blocks above. Do not say you lack memory. If there are no saved facts or holdings/watchlist above, say you do not see any saved memories yet.",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    // Web search trigger driven by the LLM classifier instead of brittle
    // keyword regex. The classifier already told us whether fresh / external
    // info is needed; small_talk is hard-blocked from searching.
    const unresolvedEntityNeedsSearch = stockQuery !== null && !stockAnalysis;
    const shouldSearch =
      validateSerpApiSetup().valid &&
      !earlySmallTalk &&
      (forceWebSearch || llmIntent.needs_web_search || unresolvedEntityNeedsSearch);

    let webSearch: WebSearchResult | null = null;
    if (shouldSearch) {
      try {
        recordProgress(forceWebSearch ? "Running requested web search" : "Searching recent web/news sources", 64);
        webSearch = await searchWeb(routingMessage, 5);
        const emittedDomains = new Set<string>();
        for (const source of webSearch.sources) {
          const domain = normalizeSourceDomain(source.url);
          if (!domain || emittedDomains.has(domain)) continue;
          emittedDomains.add(domain);
          progressEvents.push({
            type: "search_source",
            domain,
            title: source.title,
            url: source.url,
            timestamp: source.publishedAt ? Date.parse(source.publishedAt) || Date.now() : Date.now(),
          });
        }
        console.debug("[chat-api] web search complete", {
          query: routingMessage.slice(0, 80),
          sourceCount: webSearch.sources.length,
          forced: forceWebSearch,
        });
      } catch (error) {
        console.warn("[chat-api] Web search failed:", error);
      }
    }

    if (webSearch && webSearch.sources.length > 0) {
      userMemory += `\n\n${WEB_SEARCH_INSTRUCTION}\n\n${webSearch.formattedForPrompt}`;
    }

    // Deep research pass for full stock analyses (skipped for simple price-only queries)
    if (chatMode === "stock" && stockAnalysis && stockAnalysis.history.length > 0) {
      try {
        recordProgress("Running deep research: peers, sector, inputs, macro", 72);
        const research = await withTimeout(runDeepResearch(stockAnalysis), 8000, "deepResearch");
        userMemory += `\n\n${formatResearchBundle(research)}`;
        console.debug("[chat-api] deep research attached", {
          companyNews: research.companyNews.length,
          sectorNews: research.sectorNews.length,
          commodityNews: research.commodityNews.length,
          geoNews: research.geoNews.length,
          peers: research.peers.length,
        });
      } catch (err) {
        console.warn("[chat-api] deep research failed (skipping):", err);
      }
    }

    const conversationId = activeConversationId as string;

    // Whether the user explicitly asked about a stock in THIS message. Used
    // to gate the stock-chart UI: a coreference rewrite could otherwise
    // attach a chart to a casual follow-up like "ok bro".
    const userExplicitlyAskedAboutStock =
      stockAnalysis !== null &&
      !earlySmallTalk &&
      (detectStockQuery(incomingMessage) !== null ||
        /\b(stock|share|ticker|price|quote|analyze|analysis|chart|buy|sell|portfolio|invest)\b/i.test(
          incomingMessage
        ) ||
        /\$[A-Z]{1,10}\b/.test(incomingMessage));

    // Adaptive response shape: tell the LLM how deep to go and how to
    // structure the answer based on the user's intent. Without this, the
    // model under-delivers after web-search results land — it treats the
    // search snippets as the answer and replies in 2-3 paragraphs.
    const isFullStockAnalysis =
      chatMode === "stock" &&
      stockAnalysis !== null &&
      stockAnalysis.history.length > 0;
    const responseShape = classifyResponseShape({
      message: incomingMessage,
      routingMessage,
      chatMode,
      isStockAnalysis: isFullStockAnalysis,
      hasWebSearch: Boolean(webSearch && webSearch.sources.length > 0),
      historyDepth: conversationHistory.length,
      generalKind,
      llmKind: wantsMemoryAnswer ? "general_other" : llmIntent.kind,
      llmDepth: wantsMemoryAnswer ? "short" : llmIntent.depth,
    });
    const shapeDirective = getResponseShapeDirective(responseShape);
    userMemory = userMemory
      ? `${userMemory}\n\n${shapeDirective}`
      : shapeDirective;
    console.debug("[chat-api] response shape", {
      shape: responseShape,
      chatMode,
      generalKind,
    });

    let llmStream: ReadableStream<Uint8Array>;
    let usedProvider = "unknown";
    try {
      recordProgress(`Opening ${chatMode === "stock" ? "stock analysis" : "general chat"} LLM stream`, 80);
      console.debug("[chat-api] opening LLM stream", { mode: chatMode });
      const result = await withTimeout(
        streamChat({
          mode: chatMode,
          message: llmMessage,
          history: conversationHistory,
          analysis: stockAnalysis ?? undefined,
          kind: generalKind,
          model: requestedModel,
          userMemory: userMemory || undefined,
        }),
        90_000,
        "streamChat"
      );
      llmStream = result.stream;
      usedProvider = result.provider;
    } catch (llmError) {
      console.error("CHAT ERROR:", llmError);
      const encoder = new TextEncoder();
      llmStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(EMPTY_RESPONSE_FALLBACK));
          controller.close();
        },
      });
    }

    const timedStream = withStreamTimeout(llmStream, 60_000);
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const chunks: string[] = [];
    let persisted = false;

    const persistAssistantMessage = async () => {
      if (persisted) return;
      persisted = true;

      let fullResponse = chunks.join("");
      if (!hasVisibleText(fullResponse)) {
        fullResponse = EMPTY_RESPONSE_FALLBACK;
      }
      console.debug("[chat-api] persisting assistant response", {
        conversationId,
        chars: fullResponse.length,
        visible: hasVisibleText(fullResponse),
      });

      // Only persist stock metadata if the user explicitly asked. Otherwise
      // a turn that incidentally resolved a ticker (via coreference) would
      // leave a stale chart on a casual reply.
      const metadata = userExplicitlyAskedAboutStock
        ? buildStockMetadata(stockAnalysis)
        : ({} as Record<string, unknown>);
      metadata.provider = usedProvider;
      if (webSearch && webSearch.sources.length > 0) {
        metadata.sources = webSearch.sources;
      }

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: fullResponse,
        metadata: metadata,
      });

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Extract durable user facts from this turn into the semantic memory
      // store. Uses next/server `after()` so the work keeps running on
      // Vercel serverless after the response is sent (Next.js 15.1+).
      // Failures are logged inside addMemories() — never throws.
      after(
        addMemories(supabase, user.id, {
          userMessage: incomingMessage,
          assistantResponse: fullResponse,
          conversationId,
        })
      );
    };

    const outboundStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const event of progressEvents) {
          controller.enqueue(encodeProgressFrame(event));
        }
        controller.enqueue(encodeProgressFrame({ type: "task_complete" }));
        controller.enqueue(
          encodeProgressFrame({
            type: "phase_update",
            phase: "synthesizing",
            label: "Streaming response from the LLM",
          })
        );
        controller.enqueue(
          encodeProgressFrame({
            type: "progress",
            label: "Streaming response from the LLM",
            progress: 88,
            status: "active",
          })
        );

        const reader = timedStream.getReader();
        let chunkCount = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;
            const text = decoder.decode(value, { stream: true });
            if (text) {
              chunks.push(text);
              chunkCount++;
            }
            controller.enqueue(value);
          }
        } catch {
          // Stream failure falls back below.
        } finally {
          reader.releaseLock();
          if (!hasVisibleText(chunks.join(""))) {
            chunks.push(EMPTY_RESPONSE_FALLBACK);
            controller.enqueue(encoder.encode(EMPTY_RESPONSE_FALLBACK));
          }
          controller.enqueue(
            encodeProgressFrame({
              type: "task_complete",
            })
          );
          controller.enqueue(
            encodeProgressFrame({
              type: "phase_update",
              phase: "finalizing",
              label: "Saving assistant response",
            })
          );
          controller.enqueue(
            encodeProgressFrame({
              type: "progress",
              label: "Saving assistant response",
              progress: 96,
              status: "active",
            })
          );
          await persistAssistantMessage();
          controller.enqueue(
            encodeProgressFrame({
              type: "task_complete",
            })
          );
          controller.enqueue(
            encodeProgressFrame({
              type: "progress",
              progress: 100,
              status: "complete",
            })
          );
          controller.close();
          console.debug("[chat-api] stream finished", {
            conversationId,
            chunks: chunkCount,
            totalChars: chunks.join("").length,
          });
        }
      },
      cancel() {
        persistAssistantMessage().catch((error) => console.error("CHAT ERROR:", error));
      },
    });

    const hasWebSources = Boolean(webSearch && webSearch.sources.length > 0);
    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Conversation-Id": conversationId,
      "X-Has-Stock-Data": userExplicitlyAskedAboutStock ? "true" : "false",
      "X-Has-Web-Sources": hasWebSources ? "true" : "false",
      "Access-Control-Expose-Headers":
        "X-Conversation-Id, X-Has-Stock-Data, X-Stock-Symbol, X-Stock-Exchange, X-Has-Web-Sources",
    };
    if (stockAnalysis && userExplicitlyAskedAboutStock) {
      responseHeaders["X-Stock-Symbol"] = stockAnalysis.quote.symbol;
      responseHeaders["X-Stock-Exchange"] = stockAnalysis.quote.exchange || "";
    }

    return new Response(outboundStream, { headers: responseHeaders });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    const details = error instanceof Error ? error.message : String(error);
    return chatJsonResponse(EMPTY_RESPONSE_FALLBACK, 500, {
      error: "Internal error",
      details,
    });
  }
}
