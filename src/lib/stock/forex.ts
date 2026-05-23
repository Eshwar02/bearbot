import { fetchQuote } from './data';

// Yahoo Finance forex symbol format: "EURUSD=X" → price of 1 EUR in USD
// "INRUSD=X" → price of 1 INR in USD
// "GBPUSD=X" → price of 1 GBP in USD

const SUPPORTED = ['USD', 'INR', 'EUR', 'GBP'] as const;
export type SupportedCurrency = typeof SUPPORTED[number];

/**
 * Fetch the exchange rate to convert `from` currency → `to` currency.
 * e.g. getRate('INR', 'USD') returns ~0.012 (1 INR = $0.012 USD)
 * Returns 1 if from === to, or on failure.
 */
export async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  // Special case: Yahoo uses "USDINR=X" for USD→INR, "INRUSD=X" for INR→USD
  const symbol = `${from}${to}=X`;
  try {
    const quote = await fetchQuote(symbol);
    if (quote && quote.price > 0) return quote.price;
  } catch {
    // fall through to inverse
  }

  // Try inverse: 1/rate
  try {
    const inverse = await fetchQuote(`${to}${from}=X`);
    if (inverse && inverse.price > 0) return 1 / inverse.price;
  } catch {
    // give up
  }

  return 1; // fallback: treat as 1:1
}

/**
 * Fetch all rates needed to convert a set of currencies into `baseCurrency`.
 * Returns a map: { INR: 0.012, EUR: 1.08, GBP: 1.27, USD: 1 } (if base = USD)
 */
export async function getRatesTo(
  currencies: string[],
  baseCurrency: string
): Promise<Record<string, number>> {
  const unique = [...new Set(currencies.filter(c => c !== baseCurrency))];
  const entries = await Promise.all(
    unique.map(async (cur) => [cur, await getRate(cur, baseCurrency)] as const)
  );
  return Object.fromEntries([...entries, [baseCurrency, 1]]);
}
