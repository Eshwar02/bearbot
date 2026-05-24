'use client';

import { useEffect, useState } from 'react';
import { setPreferredCurrency } from '@/lib/currency-preference';

export type Prefs = {
  show_charts: boolean;
  show_news_cards: boolean;
  language_mode: 'auto' | 'english' | 'tanglish';
  notif_in_app: boolean;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
};

const DEFAULTS: Prefs = {
  show_charts: true,
  show_news_cards: true,
  language_mode: 'auto',
  notif_in_app: true,
  currency: 'INR',
};

let cache: Prefs | null = null;
let inflight: Promise<Prefs> | null = null;
export const PREFS_UPDATED_EVENT = 'alphasight:prefs-updated';

async function loadPrefs(): Promise<Prefs> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch('/api/user/preferences')
    .then((r) => (r.ok ? r.json() : { preferences: DEFAULTS }))
    .then((d) => {
      const p = (d.preferences ?? DEFAULTS) as Partial<Prefs>;
      cache = { ...DEFAULTS, ...p };
      setPreferredCurrency(cache.currency);
      return cache;
    })
    .catch(() => {
      cache = DEFAULTS;
      setPreferredCurrency(cache.currency);
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function invalidatePrefs() {
  cache = null;
  setPreferredCurrency(null);
}

export function publishPrefsUpdate(updates: Partial<Prefs>) {
  cache = { ...(cache ?? DEFAULTS), ...updates };
  if (updates.currency) setPreferredCurrency(updates.currency);
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<Partial<Prefs>>(PREFS_UPDATED_EVENT, { detail: updates }));
}

export function usePrefs(): Prefs {
  const [prefs, setPrefs] = useState<Prefs>(cache ?? DEFAULTS);
  useEffect(() => {
    let alive = true;
    loadPrefs().then((p) => {
      if (alive) setPrefs(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPrefsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<Partial<Prefs>>).detail ?? {};
      setPrefs((prev) => ({ ...prev, ...detail }));
    };
    window.addEventListener(PREFS_UPDATED_EVENT, onPrefsUpdated as EventListener);
    return () => {
      window.removeEventListener(PREFS_UPDATED_EVENT, onPrefsUpdated as EventListener);
    };
  }, []);

  return prefs;
}
