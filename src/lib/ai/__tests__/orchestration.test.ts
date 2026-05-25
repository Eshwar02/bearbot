import { classifyMessage, selectProvider, validateAiSetup } from "@/lib/ai";

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
});
