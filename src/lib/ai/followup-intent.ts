const FOLLOWUP_CONFIRMATION_PATTERN =
  /^\s*(yes+|yeah+|yep+|yup+|sure|ok+|okay+|alright|fine|cool|great|do it|go ahead|go for it|please do|yes do|yes do that|do that|do this|proceed|continue|carry on|keep going|that works|sounds good|lets do it|let's do it|make it happen)\b[!.?\s]*$/i;

export const ASSISTANT_ACTION_PROMPT_PATTERN =
  /\b(do you want me to|want me to|should i|shall i|can i|would you like me to|i can (?:also|do|help)|if you want,? i can)\b/i;

export function normalizeNoisyEnglish(message: string): string {
  let out = message
    .replace(/\bu\b/gi, "you")
    .replace(/\bur\b/gi, "your")
    .replace(/\burs\b/gi, "yours")
    .replace(/\bwht\b/gi, "what")
    .replace(/\bwat\b/gi, "what")
    .replace(/\babt\b/gi, "about")
    .replace(/\bbcz\b/gi, "because")
    .replace(/\bcoz\b/gi, "because")
    .replace(/\bcuz\b/gi, "because")
    .replace(/\bpls\b/gi, "please")
    .replace(/\bplz\b/gi, "please")
    .replace(/\bmsg\b/gi, "message")
    .replace(/\bqn\b/gi, "question")
    .replace(/\bans\b/gi, "answer")
    .replace(/\bthx\b/gi, "thanks")
    .replace(/\btho\b/gi, "though")
    .replace(/\bidk\b/gi, "I don't know")
    .replace(/\bim\b/gi, "I'm")
    .replace(/\bive\b/gi, "I've")
    .replace(/\bcant\b/gi, "can't")
    .replace(/\bwont\b/gi, "won't")
    .replace(/\bdont\b/gi, "don't")
    .replace(/\bdoesnt\b/gi, "doesn't")
    .replace(/\bhasnt\b/gi, "hasn't")
    .replace(/\bhavent\b/gi, "haven't")
    .replace(/([a-zA-Z])\1{2,}/g, "$1$1")
    .replace(/\s+/g, " ")
    .trim();

  if (!out) out = message.trim();
  return out;
}

export function isLikelyAffirmativeFollowup(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (FOLLOWUP_CONFIRMATION_PATTERN.test(trimmed)) return true;
  if (trimmed.length > 80) return false;

  const normalized = normalizeNoisyEnglish(trimmed).toLowerCase();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const positiveWords = new Set([
    "yes",
    "yeah",
    "yep",
    "yup",
    "sure",
    "okay",
    "ok",
    "alright",
    "fine",
    "great",
    "cool",
    "please",
    "do",
    "go",
    "proceed",
    "continue",
    "carry",
    "keep",
    "works",
    "done",
  ]);
  const actionWords = new Set(["do", "go", "proceed", "continue", "carry", "keep", "start"]);

  const hasPositive = tokens.some((t) => positiveWords.has(t));
  const hasAction = tokens.some((t) => actionWords.has(t));
  const hasNegation = /\b(no|not|don't|dont|stop|cancel|wait)\b/i.test(normalized);
  if (hasNegation) return false;
  return hasPositive && (hasAction || tokens.length <= 4);
}

export function looksLikeAssistantActionPrompt(text: string): boolean {
  return ASSISTANT_ACTION_PROMPT_PATTERN.test(text) || /\?\s*$/.test(text.trim());
}
