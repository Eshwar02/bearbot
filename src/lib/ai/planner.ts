import { normalizeApiKey, validateCerebrasSetup } from "./cerebras";

type ChatRole = "user" | "assistant";

const CEREBRAS_ENDPOINT = "https://api.cerebras.ai/v1/chat/completions";
const PLANNER_MODEL =
  process.env.CEREBRAS_PLANNER_MODEL ||
  process.env.CEREBRAS_GENERAL_MODEL ||
  "llama3.1-8b";

export interface ChatPlan {
  subtasks: string[];
  rationale: string;
}

const SYSTEM_PROMPT = `You are the planning step of a two-stage financial assistant. Another LLM will write the final answer for the user. Your job: decompose the user's query into 3-5 ordered subtasks that the executor must cover to give a thorough, well-structured response.

Rules:
- Subtasks must be specific to THIS query (no generic boilerplate).
- Order matters: foundational facts first, analysis next, conclusions last.
- Each subtask is 6-15 words, imperative voice ("Summarize current price action and 52w range").
- "rationale" is one sentence explaining what makes this query worth the deeper plan.

Return STRICT JSON: {"subtasks": string[], "rationale": string}. No prose, no code fences.`;

export function formatPlanForExecutor(plan: ChatPlan): string {
  const lines = plan.subtasks.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return `<execution_plan>
Cover these subtasks in order. Be thorough on each; do not skip.
${lines}
Rationale: ${plan.rationale}
</execution_plan>`;
}

export async function generatePlan(
  message: string,
  history: Array<{ role: ChatRole; content: string }> = [],
  opts: { timeoutMs?: number } = {},
): Promise<ChatPlan | null> {
  const trimmed = message.trim();
  if (!trimmed) return null;
  if (!validateCerebrasSetup().valid) return null;

  const apiKey = normalizeApiKey(process.env.CEREBRAS_API_KEY);
  if (!apiKey) return null;

  // 2 most recent turns for coreference. Same cheap pattern as classifyMessage.
  const historyTail = history.slice(-2).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 240),
  }));

  const payload = {
    model: PLANNER_MODEL,
    temperature: 0.2,
    max_tokens: 260,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyTail,
      { role: "user", content: trimmed },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 2500);
  try {
    const res = await fetch(CEREBRAS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn("[planner] cerebras HTTP", res.status);
      return null;
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
    const parsed = JSON.parse(cleaned) as Partial<ChatPlan>;
    const subtasks = Array.isArray(parsed.subtasks)
      ? parsed.subtasks
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .slice(0, 5)
          .map((s) => s.trim())
      : [];
    if (subtasks.length < 2) return null;
    const rationale =
      typeof parsed.rationale === "string" && parsed.rationale.trim().length > 0
        ? parsed.rationale.trim()
        : "Complex query requiring structured coverage.";
    return { subtasks, rationale };
  } catch (err) {
    console.warn(
      "[planner] failed, executor will run unplanned:",
      err instanceof Error ? err.message : err,
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}
