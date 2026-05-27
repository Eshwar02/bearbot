"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { TickerItem } from "./ticker-item";
import type { MarketStreamItem } from "./types";

const POLL_MS = 8_000;
const SCROLL_SPEED = 38; // px / sec — slower = more premium

export function MarketStreamBar() {
  const [items, setItems] = useState<MarketStreamItem[] | null>(null);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    let inflight = false;
    const load = async () => {
      if (inflight) return;
      // Skip background refresh when the tab is hidden. Browsers throttle
      // timers anyway, but we'd still queue up stale fetches.
      if (typeof document !== "undefined" && document.hidden) return;
      inflight = true;
      try {
        const res = await fetch("/api/market-stream", { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (!alive) return;
        const next: MarketStreamItem[] = data.items ?? [];
        // Merge in place — preserve array length + per-item identity when the
        // key set is unchanged so the scrolling track is not remounted on
        // every refresh. That remount is what produced the visible stutter.
        setItems((prev) => mergeItems(prev, next));
        setError(false);
      } catch {
        if (alive) setError(true);
      } finally {
        inflight = false;
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    const onVisibility = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const hasData = items && items.length > 0;

  // The keyset only changes when the API actually returns a different set of
  // tickers. While the keyset is stable we hand the SAME items reference
  // (mutated in place by mergeItems) to ScrollingStream so it never re-measures.
  const itemsKey = useMemo(
    () => (items ? items.map((i) => i.key).join("|") : ""),
    [items],
  );

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group relative -z-10 w-full overflow-hidden border-y backdrop-blur-xl print:hidden"
      style={{
        height: 38,
        background:
          'linear-gradient(to bottom, var(--market-bar-bg), var(--market-bar-bg-soft))',
        borderColor: 'var(--market-bar-border)',
        contain: 'layout paint',
      }}
    >
      {/* Edge fade masks */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-0 h-full w-16"
        style={{
          background:
            'linear-gradient(to right, var(--market-bar-bg-soft), transparent)',
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 z-0 h-full w-16"
        style={{
          background:
            'linear-gradient(to left, var(--market-bar-bg-soft), transparent)',
        }}
      />

      {/* Brand badge — left fixed */}
      <div
        className="absolute left-0 top-0 z-10 flex h-full items-center gap-1.5 border-r pl-3 pr-3 backdrop-blur-xl"
        style={{
          borderColor: 'var(--market-bar-border)',
          background: 'var(--market-bar-bg)',
        }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="absolute inset-0 animate-ping rounded-full"
            style={{ backgroundColor: 'var(--market-bar-accent)', opacity: 0.55 }}
          />
          <span className="absolute inset-0 rounded-full" style={{ backgroundColor: 'var(--market-bar-accent)' }} />
        </span>
        <Activity className="h-3 w-3" style={{ color: 'var(--market-bar-accent)' }} />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: 'var(--market-bar-text)' }}
        >
          Live · AI Stream
        </span>
      </div>

      {/* Stream */}
      <div className="absolute inset-y-0 left-0 right-0 pl-[150px]">
        {!hasData && !error && (
          <div className="flex h-full items-center gap-2 pl-2 text-[11px]" style={{ color: 'var(--market-bar-muted)' }}>
            <Loader2 className="h-3 w-3 animate-spin" />
            Connecting to markets…
          </div>
        )}
        {error && !hasData && (
          <div className="flex h-full items-center pl-2 text-[11px]" style={{ color: 'var(--market-negative)' }}>
            Market feed unavailable. Retrying…
          </div>
        )}

        {hasData && <ScrollingStream items={items!} keyset={itemsKey} paused={paused} />}
      </div>
    </div>
  );
}

function itemsEqual(a: MarketStreamItem, b: MarketStreamItem): boolean {
  if (a === b) return true;
  if (a.price !== b.price) return false;
  if (a.changePct !== b.changePct) return false;
  if (a.previousClose !== b.previousClose) return false;
  if (a.sentiment !== b.sentiment) return false;
  const as = a.spark, bs = b.spark;
  if (as === bs) return true;
  if (!as || !bs || as.length !== bs.length) return false;
  for (let i = 0; i < as.length; i++) {
    if (as[i] !== bs[i]) return false;
  }
  return true;
}

function mergeItems(
  prev: MarketStreamItem[] | null,
  next: MarketStreamItem[],
): MarketStreamItem[] {
  if (!prev || prev.length === 0) return next;
  const prevKeys = prev.map((p) => p.key).join("|");
  const nextKeys = next.map((n) => n.key).join("|");
  // Keyset changed (added/removed/reordered ticker) — accept the new array,
  // the track will re-measure once.
  if (prevKeys !== nextKeys) return next;
  // Same keyset — return a new array but reuse the previous element ref for
  // any ticker whose payload is unchanged. TickerItem is memoized; with the
  // same ref it skips render. Only the tickers that actually moved re-render,
  // so a 2-second poll where only one or two prices ticked doesn't reconcile
  // the entire strip.
  let changed = false;
  const merged = prev.map((p, i) => {
    const n = next[i];
    if (itemsEqual(p, n)) return p;
    changed = true;
    return n;
  });
  return changed ? merged : prev;
}

function ScrollingStream({
  items,
  keyset,
  paused,
}: {
  items: MarketStreamItem[];
  keyset: string;
  paused: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const trackWidthRef = useRef(0);

  // Re-measure ONLY when the set of tickers changes (add/remove/reorder),
  // not on every price refresh. When the half-width changes we keep the
  // visible offset stable by scaling xRef proportionally so the strip does
  // not visually jump.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const newHalf = el.scrollWidth / 2;
    const oldHalf = trackWidthRef.current;
    if (oldHalf > 0 && newHalf > 0 && oldHalf !== newHalf) {
      const progress = (-xRef.current) / oldHalf; // 0..1 within the loop
      xRef.current = -progress * newHalf;
    }
    trackWidthRef.current = newHalf;
  }, [keyset]);

  useEffect(() => {
    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const rawDt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      // Cap dt so a backgrounded tab returning doesn't snap the strip
      // forward by tens of pixels at once.
      const dt = rawDt > 0.05 ? 0.05 : rawDt;

      if (!paused) {
        xRef.current -= SCROLL_SPEED * dt;
        const half = trackWidthRef.current;
        if (half > 0 && -xRef.current >= half) {
          xRef.current += half;
        }
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${xRef.current}px,0,0)`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
    };
  }, [paused]);

  return (
    <div
      ref={trackRef}
      className="flex h-full items-center will-change-transform"
      style={{ contain: 'layout paint' }}
    >
      {items.map((it) => (
        <TickerItem key={`a-${it.key}`} item={it} />
      ))}
      {items.map((it) => (
        <TickerItem key={`b-${it.key}`} item={it} />
      ))}
    </div>
  );
}
