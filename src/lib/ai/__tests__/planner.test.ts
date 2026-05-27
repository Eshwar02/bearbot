import { generatePlan, formatPlanForExecutor } from "@/lib/ai/planner";

describe("planner", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns null when CEREBRAS_API_KEY is missing", async () => {
    delete process.env.CEREBRAS_API_KEY;
    global.fetch = jest.fn() as typeof fetch;
    const plan = await generatePlan("analyze TCS fundamentals + technicals");
    expect(plan).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("parses well-formed Cerebras JSON into a plan", async () => {
    process.env.CEREBRAS_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                subtasks: [
                  "Summarize current price and 52w range",
                  "Cover fundamentals: PE, margins, revenue growth",
                  "Lay out technical setup: SMA, RSI, trend",
                  "Highlight near-term catalysts and risks",
                ],
                rationale: "Multi-faceted stock analysis warrants structured coverage.",
              }),
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const plan = await generatePlan("Deep analysis of TCS — fundamentals, technicals, risks");
    expect(plan).not.toBeNull();
    expect(plan!.subtasks).toHaveLength(4);
    expect(plan!.subtasks[0]).toMatch(/price/i);
    expect(plan!.rationale).toMatch(/coverage/i);
  });

  it("returns null when subtask list is too short", async () => {
    process.env.CEREBRAS_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ subtasks: ["only one"], rationale: "x" }),
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;
    const plan = await generatePlan("hi");
    expect(plan).toBeNull();
  });

  it("returns null on non-OK HTTP response (executor falls back unplanned)", async () => {
    process.env.CEREBRAS_API_KEY = "test-key";
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
    const plan = await generatePlan("complex query");
    expect(plan).toBeNull();
  });

  it("formatPlanForExecutor renders an instructive block", () => {
    const formatted = formatPlanForExecutor({
      subtasks: ["one", "two"],
      rationale: "because",
    });
    expect(formatted).toContain("<execution_plan>");
    expect(formatted).toContain("1. one");
    expect(formatted).toContain("2. two");
    expect(formatted).toContain("Rationale: because");
  });
});
