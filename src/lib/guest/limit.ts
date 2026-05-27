"use client";

import { useEffect, useState } from "react";

export const GUEST_PROMPT_LIMIT = 5;
const STORAGE_KEY = "alphasight:guest-prompt-count";
const EVENT_NAME = "alphasight:guest-prompt-count-changed";

function readCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function writeCount(n: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(n));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getGuestPromptCount(): number {
  return readCount();
}

export function incrementGuestPromptCount(): number {
  const next = readCount() + 1;
  writeCount(next);
  return next;
}

export function resetGuestPromptCount(): void {
  writeCount(0);
}

export function isGuestAtLimit(): boolean {
  return readCount() >= GUEST_PROMPT_LIMIT;
}

// Subscribe to count changes across the app. Re-renders any consumer when
// another component bumps or resets the counter, including across tabs.
export function useGuestPromptCount(): number {
  const [count, setCount] = useState<number>(() => readCount());

  useEffect(() => {
    const refresh = () => setCount(readCount());
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return count;
}
