// Heuristic intent → response-shape mapper.
//
// Cheap, regex-only. Runs on every turn so we can tell the LLM how deep to go
// and how to structure the answer. No external calls. Tuned for the failure
// mode observed after web-search rollout: model was answering open-ended
// "tell me about X" queries with only 2-3 short paragraphs.

import {
  RESPONSE_SHAPE_INSTRUCTIONS,
  type ResponseShape,
} from "./prompts";

interface ClassifyInput {
  message: string;          // ORIGINAL user message (style cues)
  routingMessage: string;   // rewritten / resolved message (entity cues)
  chatMode: "stock" | "general";
  isStockAnalysis: boolean; // full stock analysis flow, not simple quote
  hasWebSearch: boolean;
  historyDepth: number;     // number of prior turns
  generalKind: "brief" | "normal";
  // Optional LLM-derived signals. When present, take precedence over regex.
  llmKind?: "small_talk" | "stock" | "general_finance" | "general_other";
  llmDepth?: "tiny" | "short" | "medium" | "long";
}

const EXPLORE_PATTERNS = [
  /\btell\s+me\s+(everything|all|more)?\s*about\b/i,
  /\bexplain\b/i,
  /\bdescribe\b/i,
  /\boverview\s+of\b/i,
  /\bgive\s+me\s+(a\s+)?(detailed\s+)?(rundown|breakdown|summary)\b/i,
  /\bwhat\s+do\s+you\s+know\s+about\b/i,
  /\bdeep[-\s]?dive\b/i,
  /\bin[-\s]?depth\b/i,
];

const DEEP_ANALYSIS_PATTERNS = [
  /\b(analyz|analys)e?\b/i,
  /\b(analysis|breakdown)\s+of\b/i,
  /\b(bull|bear)\s+case\b/i,
  /\bthesis\b/i,
  /\bdetailed\s+(view|take|analysis)\b/i,
  /\bdeep\s+(research|analysis)\b/i,
  /\bfundamental(s)?\b/i,
  /\btechnical(s)?\b/i,
];

const COMPARE_PATTERNS = [
  /\bvs\.?\b/i,
  /\bversus\b/i,
  /\bcompare\b/i,
  /\bcomparison\b/i,
  /\bdifference\s+between\b/i,
  /\bbetter\s+than\b/i,
  /\bwhich\s+(is|one)\s+(better|stronger|safer|cheaper)\b/i,
];

const LIST_PATTERNS = [
  /\b(top|best|worst|major|key|main|leading)\s+\d*\s*(stocks|companies|sectors|risks|reasons|factors|alternatives|players|funds|etfs|trends|catalysts|examples)\b/i,
  /\blist\s+(of|out|some)\b/i,
  /^\s*(give|show|name)\s+(me\s+)?(some|a\s+few|several|\d+)\b/i,
];

const DEFINITION_PATTERNS = [
  /^\s*(what\s+is|what\s+are|what['']?s|whats)\s+(a|an|the)?\s*[a-z]+/i,
  /\bdefine\b/i,
  /\bmeaning\s+of\b/i,
  /\bwhat\s+does\s+.+\s+mean\b/i,
];

const QUICK_FACT_PATTERNS = [
  /^\s*(price|quote|current\s+price)\s+of\b/i,
  /\bhow\s+much\s+is\b/i,
  /\b(what['']?s|whats|what\s+is)\s+the\s+(price|value|cost|market\s+cap|pe|p\/e|volume|yield|dividend)\s+of\b/i,
  /^\s*(when|where|who)\s+(is|was|did)\b/i,
];

const FOLLOWUP_PATTERNS = [
  /^\s*(more|tell\s+me\s+more|elaborate|expand|continue|go\s+on|and|also|then)\b/i,
  /^\s*(what|how)\s+about\b/i,
  /^\s*(yes|yeah|yep|sure|ok|okay)[!.?\s]+/i,
];

// Small-talk / chitchat: user is making casual conversation (mood, plans,
// daily life, brief acks). These should NEVER be answered with a 500-word
// finance essay. Detected by topic words and short length.
const SMALL_TALK_PATTERNS = [
  /\b(tmrw|tomorrow|today|tonight|yesterday)\s+(is|got|have|i\s+have)\b/i,
  /\b(exam|test|quiz|class|college|school|office|meeting|interview|sleep|sleepy|tired|bored|busy|free)\b/i,
  /\b(i'?m|im|i\s+am)\s+(tired|bored|happy|sad|angry|excited|nervous|stressed|fine|good|ok|okay)\b/i,
  /\b(thanks|thank\s*you|thx|ty|ok|okay|cool|nice|great|lol|haha|hmm+|alright|sure|np|no\s+problem)\b/i,
  /\b(good\s+(morning|afternoon|evening|night))\b/i,
  /\b(how\s+are\s+you|whats\s+up|what'?s\s+up|sup)\b/i,
  /\b(bro|dude|da|bruh|mate|man)\b/i,
];

// Cheap, regex-only small-talk gate. Skips when there's a clear finance
// signal in the same message.
export function isSmallTalk(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  // Very short messages with no question mark are almost always small-talk
  // unless they contain a finance signal.
  const hasFinanceSignal =
    /\b(stock|share|ticker|price|quote|portfolio|invest|market|nifty|sensex|sp500|nasdaq|crypto|btc|eth|usd|inr|eur|gbp|earnings|dividend|sector|rsi|p\/?e|sma|ema|macd)\b/i.test(
      t
    ) || /\$[A-Z]{1,10}\b/.test(t);
  if (hasFinanceSignal) return false;

  // Explicit small-talk pattern match
  if (SMALL_TALK_PATTERNS.some((p) => p.test(t))) return true;

  // Very short non-question messages are almost always chitchat.
  const words = t.split(/\s+/).length;
  if (words <= 5 && !/\?/.test(t)) return true;

  return false;
}

function matchesAny(patterns: RegExp[], text: string): boolean {
  return patterns.some((p) => p.test(text));
}

export function classifyResponseShape(input: ClassifyInput): ResponseShape {
  const { message, routingMessage, chatMode, isStockAnalysis, generalKind, llmKind, llmDepth } = input;

  // LLM classifier takes priority when available.
  if (llmKind === "small_talk") return "small_talk";
  if (chatMode === "stock" && isStockAnalysis) return "deep_analysis";

  // Map LLM depth → shape for non-stock cases.
  if (llmKind && llmKind !== "stock") {
    if (llmDepth === "tiny") return "quick_fact";
    if (llmDepth === "short") return "definition";
    if (llmDepth === "medium") return "explore";
    if (llmDepth === "long") return "deep_analysis";
  }

  // Legacy regex fallback (used only when classifier output is missing).
  if (chatMode === "general" && isSmallTalk(message)) return "small_talk";
  if (generalKind === "brief") return "quick_fact";

  // Combined text — use original for style cues, routing for entity cues.
  const t = `${message} ${routingMessage}`;

  if (matchesAny(COMPARE_PATTERNS, t)) return "compare";
  if (matchesAny(LIST_PATTERNS, t)) return "list";
  if (matchesAny(DEEP_ANALYSIS_PATTERNS, t)) return "deep_analysis";
  if (matchesAny(EXPLORE_PATTERNS, t)) return "explore";

  // Definition heuristic: short "what is X" without other depth markers.
  if (matchesAny(DEFINITION_PATTERNS, t) && message.trim().length < 80) {
    // "what is X" can also be exploratory if X is a company/proper noun.
    if (/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}\b/.test(routingMessage)) {
      return "explore";
    }
    return "definition";
  }

  if (matchesAny(QUICK_FACT_PATTERNS, t) && message.trim().length < 80) {
    return "quick_fact";
  }

  // Follow-up only AFTER we've ruled out the explicit shapes above, so
  // "tell me more about X" still goes to explore.
  if (input.historyDepth > 0 && matchesAny(FOLLOWUP_PATTERNS, message)) {
    return "follow_up";
  }

  // Length-based fallback: very short questions → quick_fact, longer
  // open-ended ones → explore.
  const wordCount = message.trim().split(/\s+/).length;
  if (wordCount <= 4 && !/\?$/.test(message)) return "quick_fact";
  if (wordCount >= 8 || /\?$/.test(message)) return "explore";

  return "default";
}

export function getResponseShapeDirective(shape: ResponseShape): string {
  return RESPONSE_SHAPE_INSTRUCTIONS[shape] ?? RESPONSE_SHAPE_INSTRUCTIONS.default;
}
