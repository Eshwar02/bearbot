import { isFinnhubSupportedSymbol, validateFinnhubSetup } from "../finnhub";

describe("Finnhub routing gate", () => {
  const originalEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isFinnhubSupportedSymbol", () => {
    it("accepts US-listed plain tickers", () => {
      expect(isFinnhubSupportedSymbol("AAPL")).toBe(true);
      expect(isFinnhubSupportedSymbol("MSFT")).toBe(true);
      expect(isFinnhubSupportedSymbol("BRK-B")).toBe(true);
      expect(isFinnhubSupportedSymbol("nvda")).toBe(true);
    });

    it("rejects Indian / EU / suffixed tickers", () => {
      expect(isFinnhubSupportedSymbol("RELIANCE.NS")).toBe(false);
      expect(isFinnhubSupportedSymbol("TCS.NS")).toBe(false);
      expect(isFinnhubSupportedSymbol("TCS.BO")).toBe(false);
      expect(isFinnhubSupportedSymbol("VOD.L")).toBe(false);
      expect(isFinnhubSupportedSymbol("RY.TO")).toBe(false);
      expect(isFinnhubSupportedSymbol("NYSE:AAPL")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(isFinnhubSupportedSymbol("")).toBe(false);
      expect(isFinnhubSupportedSymbol("   ")).toBe(false);
      expect(isFinnhubSupportedSymbol("TOOLONGSYMBOL12")).toBe(false);
    });
  });

  describe("validateFinnhubSetup", () => {
    it("flags missing key", () => {
      delete process.env.FINNHUB_API_KEY;
      expect(validateFinnhubSetup().valid).toBe(false);
    });

    it("accepts set key (with quotes stripped)", () => {
      process.env.FINNHUB_API_KEY = '"abc123"';
      expect(validateFinnhubSetup().valid).toBe(true);
    });
  });
});
