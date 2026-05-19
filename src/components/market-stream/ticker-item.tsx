"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline } from "./sparkline";
import type { MarketStreamItem } from "./types";

interface Props {
  item: MarketStreamItem;
}

function formatPrice(p: number | null, group: MarketStreamItem["group"]) {
  if (p == null) return "—";
  if (group === "fx") return p.toFixed(2);
  if (group === "crypto" && p > 100) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (group === "crypto") return p.toFixed(2);
  if (group === "commodity") return p.toFixed(2);
  return p.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatPct(p: number | null) {
  if (p == null) return "—";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(2)}%`;
}

function sentimentLabel(s: MarketStreamItem["sentiment"], pct: number | null) {
  if (s === "bullish") return `AI detects bullish momentum${pct ? ` (${pct.toFixed(2)}%)` : ""}.`;
  if (s === "bearish") return `AI detects bearish pressure${pct ? ` (${pct.toFixed(2)}%)` : ""}.`;
  return "AI sees consolidation. Range-bound near prev close.";
}

export const TickerItem = memo(function TickerItem({ item }: Props) {
  const positive = (item.changePct ?? 0) >= 0;
  const isZero = (item.changePct ?? 0) === 0 || item.changePct == null;

  const [flash, setFlash] = useState<{ tone: "up" | "down"; id: number } | null>(null);
  const prevPrice = useRef<number | null>(item.price);
  const counterRef = useRef(0);

  useEffect(() => {
    if (prevPrice.current != null && item.price != null && item.price !== prevPrice.current) {
      counterRef.current += 1;
      const tone: "up" | "down" = item.price > prevPrice.current ? "up" : "down";
      const myId = counterRef.current;
      setFlash({ tone, id: myId });
      prevPrice.current = item.price;
      const t = setTimeout(() => {
        setFlash((f) => (f && f.id === myId ? null : f));
      }, 700);
      return () => clearTimeout(t);
    }
    prevPrice.current = item.price;
  }, [item.price]);

  const dotColor = isZero
    ? "bg-[color:var(--market-bar-muted)]/60"
    : positive
    ? "bg-[color:var(--market-positive)] shadow-[0_0_8px_var(--market-positive-glow)]"
    : "bg-[color:var(--market-negative)] shadow-[0_0_8px_var(--market-negative-glow)]";

  const priceTone = isZero
    ? "text-[color:var(--market-bar-muted)]"
    : positive
    ? "text-[color:var(--market-positive)]"
    : "text-[color:var(--market-negative)]";

  const arrow = isZero ? (
    <Minus className="h-3 w-3 text-zinc-400" />
  ) : positive ? (
    <ArrowUpRight className="h-3 w-3" />
  ) : (
    <ArrowDownRight className="h-3 w-3" />
  );

  return (
    <div className="group relative inline-flex shrink-0 items-center gap-3 px-5 py-1.5 select-none">
      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.id}
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`pointer-events-none absolute inset-0 rounded-md ${
              flash.tone === "up"
                ? "bg-[color:var(--market-positive)]/10"
                : "bg-[color:var(--market-negative)]/10"
            }`}
          />
        )}
      </AnimatePresence>

      {/* AI sentiment dot */}
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        <span className={`absolute inset-0 rounded-full ${dotColor}`} />
        {!isZero && (
          <span
            className={`absolute inset-0 animate-ping rounded-full ${
              positive ? "bg-[color:var(--market-positive)]/40" : "bg-[color:var(--market-negative)]/40"
            }`}
          />
        )}
      </span>

      {/* Label */}
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--market-bar-text)]/80 group-hover:text-[color:var(--market-bar-text)] transition-colors">
        {item.label}
      </span>

      {/* Price */}
      <span className={`font-mono text-[12.5px] font-semibold tabular-nums ${priceTone}`}>
        {formatPrice(item.price, item.group)}
      </span>

      {/* Change pct */}
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums ${
          isZero
            ? "bg-[color:var(--market-bar-muted)]/10 text-[color:var(--market-bar-muted)]"
            : positive
            ? "bg-[color:var(--market-positive)]/10 text-[color:var(--market-positive)]"
            : "bg-[color:var(--market-negative)]/10 text-[color:var(--market-negative)]"
        }`}
      >
        {arrow}
        {formatPct(item.changePct)}
      </span>

      {/* Sparkline */}
      <Sparkline data={item.spark} positive={positive} />

      {/* Hover tooltip */}
      <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 group-hover:block">
        <div
          className="whitespace-nowrap rounded-lg border px-3 py-2 text-xs shadow-2xl backdrop-blur-xl"
          style={{
            background: 'var(--market-tooltip-bg)',
            borderColor: 'var(--market-bar-border)',
            color: 'var(--market-tooltip-text)',
          }}
        >
          <div className="mb-0.5 font-semibold">{item.label}</div>
          <div className="text-[11px]" style={{ color: 'var(--market-tooltip-muted)' }}>
            {sentimentLabel(item.sentiment, item.changePct)}
          </div>
          {item.previousClose != null && (
            <div className="mt-1 text-[10px]" style={{ color: 'var(--market-tooltip-muted)' }}>
              Prev close · {formatPrice(item.previousClose, item.group)}
            </div>
          )}
        </div>
      </div>

      {/* Separator dot */}
      <span className="ml-2 h-1 w-1 rounded-full" style={{ backgroundColor: 'var(--market-bar-border)' }} />
    </div>
  );
});
