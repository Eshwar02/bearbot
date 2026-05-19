"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { TickerItem } from "./ticker-item";
import type { MarketStreamItem } from "./types";

const POLL_MS = 2_000;
const SCROLL_SPEED = 38; // px / sec — slower = more premium

export function MarketStreamBar() {
  const [items, setItems] = useState<MarketStreamItem[] | null>(null);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/market-stream", { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (!alive) return;
        setItems(data.items);
        setError(false);
      } catch {
        if (alive) setError(true);
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Hide loading state if nothing came back yet
  const hasData = items && items.length > 0;

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

        {hasData && <ScrollingStream items={items!} paused={paused} />}
      </div>
    </div>
  );
}

function ScrollingStream({ items, paused }: { items: MarketStreamItem[]; paused: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const trackWidthRef = useRef(0);

  // Re-measure on items change
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    // measure half (one copy) so we can loop
    trackWidthRef.current = el.scrollWidth / 2;
  }, [items]);

  useEffect(() => {
    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

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
    <div ref={trackRef} className="flex h-full items-center will-change-transform">
      {items.map((it) => (
        <TickerItem key={`a-${it.key}`} item={it} />
      ))}
      {items.map((it) => (
        <TickerItem key={`b-${it.key}`} item={it} />
      ))}
    </div>
  );
}
