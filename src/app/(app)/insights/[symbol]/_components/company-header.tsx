'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  ExternalLink,
  Eye,
  Globe,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import type { CompanyOverview } from '@/lib/insights/server';
import { useAuth } from '@/lib/hooks/use-auth';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

interface CompanyHeaderProps {
  overview: CompanyOverview;
}

type AddState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

function isIndianSymbol(symbol: string): boolean {
  return /\.(NS|BO)$/i.test(symbol);
}

function deriveExchangeCodes(symbol: string): { nse?: string; bse?: string } {
  const upper = symbol.toUpperCase();
  if (/\.NS$/i.test(upper)) {
    return { nse: upper.replace(/\.NS$/i, '') };
  }
  if (/\.BO$/i.test(upper)) {
    return { bse: upper.replace(/\.BO$/i, '') };
  }
  return {};
}

function shortName(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/i, '');
}

function lastUpdatedLabel(): string {
  const now = new Date();
  return now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function CompanyHeader({ overview }: CompanyHeaderProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [state, setState] = useState<AddState>({ kind: 'idle' });

  const { profile, quote, symbol } = overview;
  const indian = isIndianSymbol(symbol);
  const price0 = quote.price;
  const prev = quote.previousClose;
  const change = price0 != null && prev != null ? price0 - prev : null;
  const changePct =
    change != null && prev && prev !== 0 ? (change / prev) * 100 : null;
  const isUp = change != null && change >= 0;

  const codes = deriveExchangeCodes(symbol);
  const tickerLabel = shortName(symbol);
  const updated = lastUpdatedLabel();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = Number(qty);
    const p = Number(price);
    if (!Number.isFinite(q) || q <= 0) {
      setState({ kind: 'error', message: 'Enter a positive quantity.' });
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      setState({ kind: 'error', message: 'Enter a positive average price.' });
      return;
    }
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          quantity: q,
          avgBuyPrice: p,
          currency: quote.currency,
        }),
      });
      if (res.status === 401) {
        setState({ kind: 'error', message: 'Log in to add to portfolio.' });
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setState({
          kind: 'error',
          message: data?.error ?? 'Failed to add holding.',
        });
        return;
      }
      setState({ kind: 'success', message: 'Added to portfolio.' });
      setQty('');
      setPrice('');
      setTimeout(() => {
        setOpen(false);
        setState({ kind: 'idle' });
      }, 1200);
    } catch {
      setState({ kind: 'error', message: 'Network error. Try again.' });
    }
  }

  return (
    <header className="rounded-2xl border border-borderSubtle bg-elevated p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight text-primary md:text-3xl">
              {profile.longName || tickerLabel}
            </h1>
            <span className="hidden text-xs text-muted sm:inline">·</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-secondary">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent-brand hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            {codes.bse && (
              <span className="inline-flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                BSE: <span className="font-mono">{codes.bse}</span>
              </span>
            )}
            {codes.nse && (
              <span className="inline-flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                NSE: <span className="font-mono">{codes.nse}</span>
              </span>
            )}
            {!codes.nse && !codes.bse && (
              <span className="inline-flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                Ticker: <span className="font-mono">{tickerLabel}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-primary md:text-4xl">
              {price0 != null
                ? `${quote.currency === 'INR' ? '₹ ' : ''}${formatCurrency(price0, quote.currency).replace(/^₹/, '')}`
                : '—'}
            </span>
            {change != null && changePct != null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-medium',
                  isUp ? 'text-accent-green' : 'text-accent-red'
                )}
              >
                {isUp ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {isUp ? '+' : ''}
                {formatPercent(changePct)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted">{updated}</p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-borderSubtle bg-canvas px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary"
            >
              <Download className="h-3.5 w-3.5" />
              Export to Excel
            </button>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-borderSubtle bg-canvas px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary"
            >
              <Eye className="h-3.5 w-3.5" />
              Follow
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen((o) => !o);
                setState({ kind: 'idle' });
                if (!price && price0 != null) setPrice(String(price0));
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-brand px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-accent-brand-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              Add holding
            </button>
          </div>
        </div>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-borderSubtle bg-canvas p-3"
        >
          <label className="flex flex-col text-xs text-secondary">
            Quantity
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="10"
              className="mt-1 w-24 rounded-md border border-borderSubtle bg-elevated px-2 py-1.5 text-sm text-primary outline-none focus:border-accent-brand"
            />
          </label>
          <label className="flex flex-col text-xs text-secondary">
            Avg buy price
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={price0 != null ? String(price0) : '0.00'}
              className="mt-1 w-32 rounded-md border border-borderSubtle bg-elevated px-2 py-1.5 text-sm text-primary outline-none focus:border-accent-brand"
            />
          </label>
          <button
            type="submit"
            disabled={state.kind === 'submitting'}
            className="rounded-md bg-accent-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-brand-hover disabled:opacity-60"
          >
            {state.kind === 'submitting' ? 'Adding…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setState({ kind: 'idle' });
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-secondary hover:text-primary"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
          {state.kind === 'success' && (
            <span className="text-xs font-medium text-accent-green">
              {state.message}
            </span>
          )}
          {state.kind === 'error' && (
            <span className="text-xs font-medium text-accent-red">
              {state.message}
            </span>
          )}
          {!user && (
            <span className="text-xs text-muted">Log in to save holdings.</span>
          )}
        </form>
      )}

      {indian && (
        <p className="mt-3 text-[11px] text-muted">
          Live quote from Yahoo Finance · last refreshed {updated}
        </p>
      )}
    </header>
  );
}
