// Coreference-resolving query rewriter.
//
// Why: users write follow-ups like "tell me about that" or "what about its
// dividend?" — the literal text has no entity, so detectStockQuery and
// classifyIntent both miss. Web search ends up querying the phrase verbatim
// and returns useless results.
//
// What: a small, fast Mistral call that takes the last few turns of history
// plus the new message and rewrites the message into a standalone query that
// names the entity explicitly. Only fires when the message looks pronoun-
// dependent (cheap regex pre-check) so we don't pay the round-trip on every
// turn.
//
// Best-effort. On any failure (timeout, parse error, missing key) we return
// the original message — pipeline behaviour is unchanged.

const REWRITE_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const REWRITE_MODEL = "mistral-small-latest";
const REWRITE_TIMEOUT_MS = 4000;

// Cheap heuristic for "this message depends on previous context."
// Triggers on pronouns, deictics, bare "what about / how about" follow-ups,
// or very short messages that almost certainly reference something prior.
const PRONOUN_PATTERN =
  /\b(it|its|it's|that|this|those|these|they|them|their|theirs|he|she|him|her|his|hers)\b/i;
const FOLLOWUP_PATTERN =
  /^\s*(what|how)\s+about\b|^\s*(and|also|then)\s+|^\s*(more|tell\s+me\s+more|elaborate|expand|explain\s+more|continue|go\s+on)\b/i;
const TRAILING_PUNCT = /[.,!?;:()\[\]{}"'`]+$/g;
const LEADING_PUNCT = /^[.,!?;:()\[\]{}"'`]+/g;
const COMMON_UPPERCASE_WORDS = new Set([
  "A",
  "AN",
  "AND",
  "AS",
  "AT",
  "BY",
  "FOR",
  "FROM",
  "IN",
  "IS",
  "IT",
  "OF",
  "ON",
  "OR",
  "THE",
  "TO",
  "US",
  "WE",
]);

export function needsRewrite(message: string, hasHistory: boolean): boolean {
  if (!hasHistory) return false;
  const t = message.trim();
  if (!t) return false;
  if (t.length > 300) return false; // long messages usually self-contained
  if (PRONOUN_PATTERN.test(t)) return true;
  if (FOLLOWUP_PATTERN.test(t)) return true;
  // Very short bare follow-up like "yes", "more", "and?" — probably needs context.
  if (t.length < 25 && !/[A-Z]{2,}/.test(t) && !/\$[A-Z]/.test(t)) {
    return /\?$/.test(t) || t.split(/\s+/).length <= 4;
  }
  return false;
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

const REWRITE_SYSTEM_PROMPT = `You rewrite user messages so they stand alone, without needing prior chat context.

Rules:
- Replace pronouns (it, that, this, they, its, their) with the specific entity from the recent history.
- Expand bare follow-ups ("tell me more", "what about earnings") into a full question naming the entity.
- Preserve the user's intent and tone. Do not add new requirements. Do not answer.
- If the message is already self-contained, return it unchanged.
- Output ONE line of plain text — the rewritten message. No quotes, no prefix, no explanation.`;

interface RewriteHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

const HISTORY_CHAR_CAP = 400;

function buildUserPrompt(
  message: string,
  history: RewriteHistoryEntry[]
): string {
  // Take last 4 turns max — enough to resolve "it" / "that" without bloating the call.
  const trimmed = history.slice(-4).map((m) => {
    const c =
      m.content.length > HISTORY_CHAR_CAP
        ? m.content.slice(0, HISTORY_CHAR_CAP) + " …"
        : m.content;
    return `${m.role === "user" ? "User" : "Assistant"}: ${c}`;
  });
  const historyBlock = trimmed.length ? trimmed.join("\n") : "(no prior turns)";
  return `Recent conversation:
${historyBlock}

New user message: ${message}

Rewritten standalone message:`;
}

function cleanToken(token: string): string {
  return token.replace(LEADING_PUNCT, "").replace(TRAILING_PUNCT, "");
}

function extractLikelyEntity(history: RewriteHistoryEntry[]): string | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const text = history[i].content;
    if (!text) continue;

    // Prefer explicit "about X" / "for X" fragments from latest user turns.
    const aboutMatch = text.match(
      /\b(?:about|for|on|regarding|versus|vs\.?)\s+([A-Za-z][A-Za-z0-9.&-]*(?:\s+[A-Za-z][A-Za-z0-9.&-]*){0,4})/i
    );
    if (aboutMatch?.[1]) {
      return aboutMatch[1].trim();
    }

    // Then look for ticker-like uppercase symbols.
    const rawTokens = text.split(/\s+/).map(cleanToken).filter(Boolean);
    for (let t = rawTokens.length - 1; t >= 0; t--) {
      const token = rawTokens[t];
      const normalized = token.startsWith("$") ? token.slice(1) : token;
      if (
        /^[A-Z]{1,10}(?:\.[A-Z]{1,2})?$/.test(normalized) &&
        !COMMON_UPPERCASE_WORDS.has(normalized)
      ) {
        return normalized;
      }
    }

    // Finally, title-case entities like "ITC", "Infosys", "Adani Ports".
    const properNounMatches = text.match(
      /\b[A-Z][a-zA-Z0-9.&-]*(?:\s+[A-Z][a-zA-Z0-9.&-]*){0,3}\b/g
    );
    if (properNounMatches && properNounMatches.length > 0) {
      const candidate = properNounMatches[properNounMatches.length - 1]?.trim();
      if (candidate) return candidate;
    }
  }
  return null;
}

function rewriteWithHeuristic(message: string, history: RewriteHistoryEntry[]): string {
  const entity = extractLikelyEntity(history);
  if (!entity) return message;

  const t = message.trim();
  if (!t) return message;

  if (/^\s*(more|tell\s+me\s+more|elaborate|expand|continue|go\s+on)\b/i.test(t)) {
    return `Tell me more about ${entity}`;
  }
  if (/^\s*(what|how)\s+about\b/i.test(t)) {
    return t.replace(/^\s*(what|how)\s+about\b/i, (m) => `${m} ${entity}`);
  }
  if (/^\s*(and|also|then)\b/i.test(t)) {
    return `About ${entity}, ${t}`;
  }

  const rewritten = t
    .replace(/\bits\b/gi, `${entity}'s`)
    .replace(/\btheir\b/gi, `${entity}'s`)
    .replace(/\b(it|that|this|they|them|those|these)\b/gi, entity);

  if (rewritten.toLowerCase() === t.toLowerCase()) {
    return `About ${entity}: ${t}`;
  }
  return rewritten;
}

/**
 * Rewrite a follow-up message into a standalone query using recent history.
 * Returns the original message on any failure.
 */
export async function rewriteFollowupQuery(
  message: string,
  history: RewriteHistoryEntry[]
): Promise<string> {
  const apiKey = readApiKey();
  if (!needsRewrite(message, history.length > 0)) return message;
  const heuristic = rewriteWithHeuristic(message, history);

  if (!apiKey) return heuristic;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REWRITE_TIMEOUT_MS);

  try {
    const response = await fetch(REWRITE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: REWRITE_MODEL,
        messages: [
          { role: "system", content: REWRITE_SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(message, history) },
        ],
        temperature: 0.1,
        max_tokens: 120,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[rewrite] HTTP ${response.status}`);
      return heuristic;
    }

    const parsed = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = parsed.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return heuristic;

    // Strip wrapping quotes, code fences, leading "Rewritten:" etc.
    const cleaned = raw
      .replace(/^```[a-z]*\s*/i, "")
      .replace(/```$/i, "")
      .replace(/^(rewritten|standalone)[: ]+/i, "")
      .replace(/^["'`](.*)["'`]$/, "$1")
      .trim();

    // Sanity: rewrite shouldn't be empty or ridiculously long.
    if (!cleaned || cleaned.length > 500) return heuristic;

    // If rewrite is essentially identical, return original to keep behavior predictable.
    if (cleaned.toLowerCase() === message.trim().toLowerCase()) return heuristic;

    console.debug("[rewrite]", {
      from: message.slice(0, 80),
      to: cleaned.slice(0, 80),
    });
    return cleaned;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[rewrite] failed:", msg);
    return heuristic;
  } finally {
    clearTimeout(timer);
  }
}
