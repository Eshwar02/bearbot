export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

let preferredCurrency: CurrencyCode | null = null;

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === 'INR' || value === 'USD' || value === 'EUR' || value === 'GBP';
}

export function setPreferredCurrency(currency: string | null | undefined) {
  preferredCurrency = isCurrencyCode(currency) ? currency : null;

  if (typeof window === 'undefined') return;

  try {
    if (preferredCurrency) {
      localStorage.setItem('currency', preferredCurrency);
    } else {
      localStorage.removeItem('currency');
    }
  } catch {
    // ignore
  }
}

export function getPreferredCurrency(): CurrencyCode | null {
  return preferredCurrency;
}

export function resolveCurrency(fallback?: string): CurrencyCode {
  return preferredCurrency ?? (isCurrencyCode(fallback) ? fallback : DEFAULT_CURRENCY);
}
