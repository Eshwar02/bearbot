// Semantic memory layer (mem0-style) for AlphaSight AI chat.
//
// Two paths:
//   - searchMemories(): retrieve top-K facts about the user, semantically
//     similar to the latest message. Called before the LLM stream opens.
//   - addMemories(): non-blocking post-stream extraction. Asks a small LLM to
//     decide ADD/UPDATE/SKIP relative to existing nearby memories, then writes
//     back via pgvector. Wrapped in try/catch — never throws.
//
// Both paths are best-effort. Failures are logged and swallowed so chat is
// never blocked by memory operations.

import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "./embeddings";
import { AGENT_CONFIG } from "./config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AiMemoryMatch } from "@/types/database";

const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const EXTRACT_MODEL = "mistral-small-latest";

export interface SearchMemoriesOptions {
  limit?: number;
  threshold?: number;
}

export interface AddMemoriesInput {
  userMessage: string;
  assistantResponse: string;
  conversationId: string;
}

interface ExtractOperation {
  action: "ADD" | "UPDATE" | "SKIP";
  id?: string;
  memory?: string;
  category?: string;
}

// ────────────────────────────────────────────────────────────────────────
// Search
// ────────────────────────────────────────────────────────────────────────

/**
 * Retrieve the top-K semantic memories for a user given a query string.
 * Returns [] on any failure (embedding error, RPC error, etc.) — semantic
 * recall is non-critical and must never break chat.
 */
// Messages that are too short or are pure greetings/acks aren't worth a
// Mistral embed call — they won't match anything meaningful and they burn
// quota + p50 latency on every "hi" / "ok" / "thanks".
const TRIVIAL_PATTERN =
  /^(hi+|hey+|hello+|yo+|sup|howdy|ok+|okay+|kk|k|thanks|thank\s*you|ty|bye|good\s+(morning|afternoon|evening|night)|cool|nice|great|lol|haha|hmm+|alright|sure|yes|yeah|yep|no|nope|np|done|cancel|stop|pls|please|sorry)[!.?\s]*$/i;

// Small-talk / personal-life chitchat: messages where the user is sharing
// their day or making a one-off remark. These should NEVER be mined for
// "durable facts" — they're context for the current turn, not memories.
const SMALL_TALK_PATTERN =
  /\b(tmrw|tomorrow|today|tonight|exam|test|sleep|tired|bored|busy|free|movie|food|eat|eating|gym|home|class|college|office|meeting|sad|happy|angry|bro|dude|da|bruh)\b/i;

function isTrivialMessage(text: string): boolean {
  const t = text.trim();
  if (t.length < 8) return true;
  return TRIVIAL_PATTERN.test(t);
}

function isSmallTalkOrChitchat(text: string): boolean {
  const t = text.trim();
  if (t.length < 6) return true;
  if (TRIVIAL_PATTERN.test(t)) return true;
  if (t.length < 60 && SMALL_TALK_PATTERN.test(t)) return true;
  return false;
}

export async function searchMemories(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  opts: SearchMemoriesOptions = {}
): Promise<AiMemoryMatch[]> {
  const trimmed = query.trim();
  if (!trimmed || !userId) return [];
  if (isTrivialMessage(trimmed)) return [];

  const limit = opts.limit ?? AGENT_CONFIG.memory.searchLimit;
  const threshold = opts.threshold ?? AGENT_CONFIG.memory.similarityThreshold;

  try {
    const embedding = await embedText(trimmed);
    const { data, error } = await supabase.rpc("match_ai_memories", {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: limit,
      similarity_threshold: threshold,
    });
    if (error) {
      console.warn("[memory] match_ai_memories failed:", error.message);
      return [];
    }
    return (data ?? []) as AiMemoryMatch[];
  } catch (err) {
    console.warn(
      "[memory] searchMemories failed:",
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

/**
 * Format retrieved memories into a human-readable block for the system prompt.
 * Returns "" when there are no rows. Truncated to the configured char budget
 * so we stay inside the existing 1200-char userMemory cap alongside structured
 * context.
 */
export function formatMemoriesForPrompt(rows: AiMemoryMatch[]): string {
  if (!rows || rows.length === 0) return "";

  // Already returned sorted by distance ascending (= similarity desc).
  const lines = rows.map((r) => `- ${r.memory}`);
  const header = "Known facts about the user (from past chats):";
  const body = lines.join("\n");
  const footer = "Use these naturally when relevant. Never invent or expand.";
  let block = `${header}\n${body}\n${footer}`;

  const budget = AGENT_CONFIG.memory.promptCharBudget;
  if (block.length > budget) {
    block = block.slice(0, budget - 1) + "…";
  }
  return block;
}

// ────────────────────────────────────────────────────────────────────────
// Extraction / write
// ────────────────────────────────────────────────────────────────────────

const EXTRACT_SYSTEM_PROMPT = `You extract durable user facts from ONE user message for a personal finance assistant.

STRICT RULES:
- Only the user's own message is your source of truth. You are NOT given the assistant's reply.
- Extract ONLY facts the user explicitly stated about THEMSELVES, with first-person framing ("I am…", "my…", "I prefer…", "I hold…", "I live in…", "I want…").
- DO NOT extract: company names, stock tickers, prices, news, market data, third-party facts, opinions, questions, or anything transient ("tomorrow is my exam", "I'm bored", "I'm tired" — these are mood/chitchat, not durable facts → SKIP).
- DO NOT extract anything about companies, stocks, or financial instruments unless the user explicitly stated they own / want to own / are watching it ("I own TCS", "I'm holding INFY", "I want to invest in dividend stocks").
- If unsure → SKIP. False memories are far worse than missing memories.
- Compare each candidate to existing memories. If it contradicts an existing memory, UPDATE the existing memory by id. If it's already covered or redundant, SKIP.
- Memories must be short, third-person, self-contained sentences (e.g. "Prefers dividend stocks", "Lives in Bangalore", "Has low risk tolerance").
- Use one-word categories: preference, risk_profile, holding_intent, personal, goal, constraint.
- If the user message is small-talk, a question, or anything other than a clear self-disclosure → return empty operations array.

Output JSON only, no prose, no code fences. Schema:
{"operations":[{"action":"ADD","memory":"...","category":"..."}, {"action":"UPDATE","id":"<existing-uuid>","memory":"...","category":"..."}, {"action":"SKIP"}]}`;

function buildExtractUserPrompt(
  input: AddMemoriesInput,
  existing: AiMemoryMatch[]
): string {
  const existingBlock = existing.length
    ? existing.map((m) => `- [${m.id}] (${m.category ?? "n/a"}) ${m.memory}`).join("\n")
    : "(none)";

  // Intentionally DO NOT pass the assistant response. The extractor was
  // hallucinating durable user facts out of assistant-generated content
  // (random company names, news fragments), poisoning future turns. The
  // user's own message is the only authoritative source for what they said
  // about themselves.
  return `Existing memories:
${existingBlock}

User message (the only source of facts you may extract from):
${input.userMessage}`;
}

function readApiKey(): string {
  const raw = process.env.MISTRAL_API_KEY?.trim() ?? "";
  if (!raw) return "";
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

// JSON schema for the extractor — strict mode locks the model to this shape.
// More reliable than json_object on mistral-small-latest (Mistral testing
// shows 100% vs 64% conformance for complex shapes).
const EXTRACT_JSON_SCHEMA = {
  name: "memory_operations",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["operations"],
    properties: {
      operations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["action"],
          properties: {
            action: { type: "string", enum: ["ADD", "UPDATE", "SKIP"] },
            id: { type: "string" },
            memory: { type: "string" },
            category: { type: "string" },
          },
        },
      },
    },
  },
} as const;

async function callExtractor(
  userPrompt: string
): Promise<ExtractOperation[]> {
  const apiKey = readApiKey();
  if (!apiKey) throw new Error("MISTRAL_API_KEY not set");

  const basePayload = {
    model: EXTRACT_MODEL,
    messages: [
      { role: "system", content: EXTRACT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: AGENT_CONFIG.memory.extractMaxTokens,
    stream: false,
  };

  // Try strict json_schema mode first; degrade to json_object then no
  // response_format on 400-class errors (older Mistral revs / quota mismatch).
  const attempts: Array<Record<string, unknown>> = [
    { ...basePayload, response_format: { type: "json_schema", json_schema: EXTRACT_JSON_SCHEMA } },
    { ...basePayload, response_format: { type: "json_object" } },
    { ...basePayload },
  ];

  let lastError: unknown = new Error("extractor: no attempt ran");
  for (const payload of attempts) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      AGENT_CONFIG.memory.extractTimeoutMs
    );
    try {
      const response = await fetch(MISTRAL_ENDPOINT, {
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
        const err = new Error(
          `Mistral extract HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`
        );
        // Only retry on 400 (likely response_format incompatibility). 401/403/429/5xx → bail.
        if (response.status === 400) {
          lastError = err;
          continue;
        }
        throw err;
      }

      const parsed = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = parsed.choices?.[0]?.message?.content ?? "";
      return parseOperations(content);
    } catch (err) {
      lastError = err;
      // AbortError or non-400 HTTP — stop retrying.
      const msg = err instanceof Error ? err.message : String(err);
      if (!/HTTP 400/.test(msg)) throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

function parseOperations(raw: string): ExtractOperation[] {
  if (!raw) return [];
  // Strip code fences if the model added them despite json_object mode.
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as { operations?: unknown };
    const ops = Array.isArray(parsed.operations) ? parsed.operations : [];
    return ops
      .filter((o): o is ExtractOperation => {
        if (!o || typeof o !== "object") return false;
        const action = (o as { action?: unknown }).action;
        return action === "ADD" || action === "UPDATE" || action === "SKIP";
      })
      .map((o) => ({
        action: o.action,
        id: typeof o.id === "string" ? o.id : undefined,
        memory: typeof o.memory === "string" ? o.memory.trim() : undefined,
        category: typeof o.category === "string" ? o.category.trim() : undefined,
      }));
  } catch (err) {
    console.warn(
      "[memory] failed to parse extractor JSON:",
      err instanceof Error ? err.message : err,
      "raw=",
      cleaned.slice(0, 200)
    );
    return [];
  }
}

// DB has CHECK constraints (memory 1..500, category 1..32). Clamp app-side
// too so we never round-trip just to get rejected.
const MEMORY_MAX_CHARS = 500;
const CATEGORY_MAX_CHARS = 32;

function clampMemory(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ");
  return t.length > MEMORY_MAX_CHARS ? t.slice(0, MEMORY_MAX_CHARS) : t;
}

// Final sanity check before persisting. Rejects memories that look like
// market/news content the extractor scraped from an assistant response or
// from a search snippet rather than a real user self-statement.
const BAD_MEMORY_PATTERNS: RegExp[] = [
  /\b(reported|announced|launched|acquired|raised|priced at|trading at|surged|plunged|rallied|fell|jumped|dropped)\b/i,
  /\b\$\d|\b(usd|inr|eur|gbp)\s+\d/i,                       // currency + number
  /\b\d{4}-\d{2}-\d{2}\b/,                                   // ISO date
  /\b(q[1-4]|fy\s*\d{2,4}|earnings|guidance|ipo|merger)\b/i, // financial reporting jargon
  /https?:\/\//i,
];

function looksLikeRealUserFact(memText: string): boolean {
  if (!memText) return false;
  if (memText.length < 6) return false;
  for (const re of BAD_MEMORY_PATTERNS) {
    if (re.test(memText)) return false;
  }
  return true;
}

function clampCategory(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (!t) return null;
  return t.length > CATEGORY_MAX_CHARS ? t.slice(0, CATEGORY_MAX_CHARS) : t;
}

/**
 * Post-stream: extract memory operations from the latest turn and apply them.
 * Best-effort, never throws. Call without awaiting from the chat route.
 */
export async function addMemories(
  supabase: SupabaseClient,
  userId: string,
  input: AddMemoriesInput
): Promise<void> {
  try {
    const userMsg = input.userMessage.trim();
    if (!userMsg || !userId) return;
    if (isSmallTalkOrChitchat(userMsg)) return;
    // Skip if message is a question (questions are never durable self-facts).
    if (/\?\s*$/.test(userMsg) || /^(what|why|how|when|where|who|which|is|are|does|do|can|could|should|would|will)\b/i.test(userMsg)) {
      return;
    }

    // Find similar existing memories for dedupe context.
    const existing = await searchMemories(supabase, userId, userMsg, {
      limit: AGENT_CONFIG.memory.dedupeLimit,
      threshold: AGENT_CONFIG.memory.dedupeThreshold,
    });

    const userPrompt = buildExtractUserPrompt(input, existing);
    const operations = await callExtractor(userPrompt);
    if (operations.length === 0) return;

    // Writes run inside Next 16 `after()` — the cookie-scoped supabase client
    // passed in loses request context once the response closes, so RLS-gated
    // inserts/updates fail silently. Use service-role for writes; we still
    // scope every statement by user_id manually.
    let writeClient: SupabaseClient;
    try {
      writeClient = createAdminClient();
    } catch (err) {
      console.warn(
        "[memory] admin client unavailable, falling back to request client:",
        err instanceof Error ? err.message : err
      );
      writeClient = supabase;
    }

    // Per-turn dedupe: extractor occasionally emits two ADDs with the same
    // text. Collapse them so we never insert duplicates from one turn.
    const seenAddText = new Set<string>();
    const seenUpdateId = new Set<string>();

    for (const op of operations) {
      if (op.action === "SKIP") continue;

      if (op.action === "ADD") {
        if (!op.memory) continue;
        const memText = clampMemory(op.memory);
        if (!looksLikeRealUserFact(memText)) {
          console.log("[memory] ADD rejected (looks like scraped/market content):", memText.slice(0, 80));
          continue;
        }
        const cat = clampCategory(op.category);
        const key = memText.toLowerCase();
        if (seenAddText.has(key)) continue;
        seenAddText.add(key);

        try {
          const embedding = await embedText(memText);
          const { error } = await writeClient.from("ai_memories").insert({
            user_id: userId,
            memory: memText,
            embedding: embedding as unknown as number[],
            category: cat,
            metadata: { conversation_id: input.conversationId },
          });
          if (error) {
            console.warn("[memory] ADD insert failed:", error.message);
          } else {
            console.log(
              `[memory] ADD ok user=${userId.slice(0, 8)} cat=${cat ?? "-"} mem="${memText.slice(0, 60)}"`
            );
          }
        } catch (err) {
          console.warn(
            "[memory] ADD failed:",
            err instanceof Error ? err.message : err
          );
        }
        continue;
      }

      if (op.action === "UPDATE") {
        if (!op.id || !op.memory) continue;
        if (seenUpdateId.has(op.id)) continue;
        seenUpdateId.add(op.id);

        const memText = clampMemory(op.memory);
        if (!looksLikeRealUserFact(memText)) {
          console.log("[memory] UPDATE rejected (looks like scraped/market content):", memText.slice(0, 80));
          continue;
        }
        const cat = clampCategory(op.category);

        try {
          const embedding = await embedText(memText);
          const { error } = await writeClient
            .from("ai_memories")
            .update({
              memory: memText,
              embedding: embedding as unknown as number[],
              category: cat,
            })
            .eq("id", op.id)
            .eq("user_id", userId);
          if (error) {
            console.warn("[memory] UPDATE failed:", error.message);
          } else {
            console.log(
              `[memory] UPDATE ok user=${userId.slice(0, 8)} id=${op.id.slice(0, 8)} mem="${memText.slice(0, 60)}"`
            );
          }
        } catch (err) {
          console.warn(
            "[memory] UPDATE failed:",
            err instanceof Error ? err.message : err
          );
        }
      }
    }
  } catch (err) {
    console.warn(
      "[memory] addMemories failed:",
      err instanceof Error ? err.message : err
    );
  }
}
