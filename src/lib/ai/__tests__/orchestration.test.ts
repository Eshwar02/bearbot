import { classifyMessage, selectProvider, streamChat, validateAiSetup, shouldUsePlanner } from "@/lib/ai";

describe("AI orchestration", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("prefers Mistral for stock and Cerebras for general/classifier when both are configured", () => {
    process.env.MISTRAL_API_KEY = "mistral-test-key";
    process.env.CEREBRAS_API_KEY = "cerebras-test-key";

    const setup = validateAiSetup();
    expect(setup.valid).toBe(true);
    expect(setup.stockPrimary).toBe("mistral");
    expect(setup.generalPrimary).toBe("cerebras");
    expect(setup.stockProviders).toEqual(["mistral", "cerebras"]);
    expect(setup.generalProviders).toEqual(["cerebras", "mistral"]);
    expect(setup.classifierProviders).toEqual(["cerebras", "mistral"]);
  });

  it("uses Cerebras as primary when Mistral is unavailable", () => {
    delete process.env.MISTRAL_API_KEY;
    process.env.CEREBRAS_API_KEY = "cerebras-test-key";

    const setup = validateAiSetup();
    expect(setup.valid).toBe(true);
    expect(setup.stockPrimary).toBe("cerebras");
    expect(setup.generalPrimary).toBe("cerebras");
    expect(setup.stockProviders).toEqual(["cerebras"]);
    expect(setup.generalProviders).toEqual(["cerebras"]);
    expect(setup.classifierProviders).toEqual(["cerebras"]);
  });

  it("falls back from Cerebras to Mistral in classifier orchestration", async () => {
    process.env.MISTRAL_API_KEY = "mistral-test-key";
    process.env.CEREBRAS_API_KEY = "cerebras-test-key";

    const fetchMock = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  kind: "general_finance",
                  needs_web_search: false,
                  company_or_topic: "RSI",
                  depth: "short",
                }),
              },
            },
          ],
        }),
      } as Response);
    global.fetch = fetchMock as typeof fetch;

    const result = await classifyMessage("What is RSI?");
    expect(result.kind).toBe("general_finance");
    expect(result.company_or_topic).toBe("RSI");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.cerebras.ai/v1/chat/completions");
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.mistral.ai/v1/chat/completions");
  });

  describe("selectProvider routing", () => {
    const base = {
      kind: "general_other" as const,
      depth: "short" as const,
      chatMode: "general" as const,
      isDetailedStockRequest: false,
      hasWebSearch: false,
      thinkMode: false,
      canvasMode: false,
      generalKind: "normal" as const,
    };

    it("routes small_talk → cerebras", () => {
      expect(selectProvider({ ...base, kind: "small_talk", depth: "tiny", generalKind: "brief" })).toBe("cerebras");
    });

    it("routes simple stock query → cerebras", () => {
      expect(selectProvider({ ...base, kind: "stock", depth: "tiny", chatMode: "stock" })).toBe("cerebras");
    });

    it("routes detailed stock analysis → mistral", () => {
      expect(
        selectProvider({ ...base, kind: "stock", depth: "long", chatMode: "stock", isDetailedStockRequest: true })
      ).toBe("mistral");
    });

    it("routes web-search-backed query → mistral", () => {
      expect(selectProvider({ ...base, hasWebSearch: true })).toBe("mistral");
    });

    it("routes thinkMode / canvasMode → mistral", () => {
      expect(selectProvider({ ...base, thinkMode: true })).toBe("mistral");
      expect(selectProvider({ ...base, canvasMode: true })).toBe("mistral");
    });

    it("routes long depth → mistral", () => {
      expect(selectProvider({ ...base, depth: "long" })).toBe("mistral");
    });

    it("routes general_finance medium+ → mistral", () => {
      expect(selectProvider({ ...base, kind: "general_finance", depth: "medium" })).toBe("mistral");
    });

    it("honors explicit userRequestedModel override", () => {
      expect(
        selectProvider({ ...base, hasWebSearch: true, userRequestedModel: "cerebras" })
      ).toBe("cerebras");
      expect(
        selectProvider({ ...base, kind: "small_talk", depth: "tiny", userRequestedModel: "mistral" })
      ).toBe("mistral");
    });
  });

  it("returns regex fallback classification when no providers are configured", async () => {
    delete process.env.MISTRAL_API_KEY;
    delete process.env.CEREBRAS_API_KEY;
    global.fetch = jest.fn() as typeof fetch;

    const result = await classifyMessage("ok bro");
    expect(result.kind).toBe("small_talk");
    expect(result.depth).toBe("tiny");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  describe("streamChat plan integration", () => {
    function mockProviderStreamOnce() {
      // Single SSE-shaped JSON line so both mistral.ts and cerebras.ts can
      // parse a "ok" delta and exit cleanly.
      const sseBody = `data: ${JSON.stringify({ choices: [{ delta: { content: "ok" } }] })}\n\ndata: [DONE]\n\n`;
      const encoder = new TextEncoder();
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/event-stream" }),
        body: new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(encoder.encode(sseBody));
            c.close();
          },
        }),
      } as unknown as Response;
    }

    it("tags provider with +plan when a plan is passed in", async () => {
      process.env.MISTRAL_API_KEY = "m";
      process.env.CEREBRAS_API_KEY = "c";
      global.fetch = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockProviderStreamOnce())) as typeof fetch;

      const result = await streamChat({
        mode: "general",
        message: "deep finance question",
        history: [],
        kind: "normal",
        plan: {
          subtasks: ["one", "two", "three"],
          rationale: "complex",
        },
      });
      expect(result.provider.endsWith("+plan")).toBe(true);
    });

    it("does not tag +plan when no plan is passed", async () => {
      process.env.MISTRAL_API_KEY = "m";
      process.env.CEREBRAS_API_KEY = "c";
      global.fetch = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockProviderStreamOnce())) as typeof fetch;

      const result = await streamChat({
        mode: "general",
        message: "casual question",
        history: [],
        kind: "normal",
      });
      expect(result.provider.endsWith("+plan")).toBe(false);
    });

    it("tags provider with +plan in stock mode", async () => {
      process.env.MISTRAL_API_KEY = "m";
      process.env.CEREBRAS_API_KEY = "c";
      global.fetch = jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockProviderStreamOnce())) as typeof fetch;

      const result = await streamChat({
        mode: "stock",
        message: "analyze AAPL",
        history: [],
        kind: "normal",
        analysis: {
          quote: {
            symbol: "AAPL", name: "Apple Inc", price: 150, change: 2, changePercent: 1.5,
            volume: 50000000, marketCap: 2000000000000, pe: 28, high52: 180, low52: 120,
            dayHigh: 152, dayLow: 149, open: 149, previousClose: 148, currency: "USD", exchange: "NASDAQ",
          },
          history: [], technicals: {
            sma20: null, sma50: null, ema20: null, rsi: null,
            macd: { macdLine: null, signalLine: null, histogram: null },
            supportLevels: [], resistanceLevels: [], breakoutZones: [], trend: "neutral",
          },
          news: [], macroRisks: [], rawMaterialRisks: [],
          companyInfo: {
            sector: "Tech", industry: "Consumer Electronics", description: "",
            employees: null, website: "", country: "US",
          },
        },
        plan: {
          subtasks: ["one", "two"],
          rationale: "deep dive",
        },
      });
      expect(result.provider.endsWith("+plan")).toBe(true);
    });
  });

  describe("shouldUsePlanner gating", () => {
    const base = {
      isGuest: false,
      earlySmallTalk: false,
      wantsMemoryAnswer: false,
      cerebrasValid: true,
      thinkMode: false,
      hasImageAttachments: false,
      depth: "long" as const,
      kind: "stock" as const,
    };

    it("returns false for guests", () => {
      expect(shouldUsePlanner({ ...base, isGuest: true })).toBe(false);
    });

    it("returns false for early small talk", () => {
      expect(shouldUsePlanner({ ...base, earlySmallTalk: true })).toBe(false);
    });

    it("returns false for memory queries", () => {
      expect(shouldUsePlanner({ ...base, wantsMemoryAnswer: true })).toBe(false);
    });

    it("returns false when Cerebras is not configured", () => {
      expect(shouldUsePlanner({ ...base, cerebrasValid: false })).toBe(false);
    });

    it("returns true when thinkMode is on, regardless of depth", () => {
      expect(shouldUsePlanner({ ...base, depth: "tiny", thinkMode: true })).toBe(true);
    });

    it("returns true when images are attached", () => {
      expect(shouldUsePlanner({ ...base, depth: "short", hasImageAttachments: true })).toBe(true);
    });

    it("returns true for depth=long (stock)", () => {
      expect(shouldUsePlanner({ ...base, depth: "long", kind: "stock" })).toBe(true);
    });

    it("returns true for depth=long (general_finance)", () => {
      expect(shouldUsePlanner({ ...base, depth: "long", kind: "general_finance" })).toBe(true);
    });

    it("returns true for depth=long (small_talk)", () => {
      expect(shouldUsePlanner({ ...base, depth: "long", kind: "small_talk" })).toBe(true);
    });

    it("returns true for depth=medium + kind=stock", () => {
      expect(shouldUsePlanner({ ...base, depth: "medium", kind: "stock" })).toBe(true);
    });

    it("returns true for depth=medium + kind=general_finance", () => {
      expect(shouldUsePlanner({ ...base, depth: "medium", kind: "general_finance" })).toBe(true);
    });

    it("returns false for depth=medium + kind=small_talk", () => {
      expect(shouldUsePlanner({ ...base, depth: "medium", kind: "small_talk" })).toBe(false);
    });

    it("returns false for depth=medium + kind=general_other", () => {
      expect(shouldUsePlanner({ ...base, depth: "medium", kind: "general_other" })).toBe(false);
    });

    it("returns false for depth=short with no other trigger", () => {
      expect(shouldUsePlanner({ ...base, depth: "short" })).toBe(false);
    });

    it("returns false for depth=tiny with no other trigger", () => {
      expect(shouldUsePlanner({ ...base, depth: "tiny" })).toBe(false);
    });

    it("returns false when multiple negatives stack (guest + small_talk + short)", () => {
      expect(shouldUsePlanner({ ...base, isGuest: true, earlySmallTalk: true, depth: "short" })).toBe(false);
    });
  });
});
