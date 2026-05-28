'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';
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

function formatLargeCurrency(
  value: number | null,
  currency: string,
  isIndian: boolean
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const symbol =
    currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '';

  if (isIndian) {
    if (abs >= 1e7) return `${sign}${symbol}${(abs / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `${sign}${symbol}${(abs / 1e5).toFixed(2)} L`;
    return `${sign}${symbol}${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
  if (abs >= 1e12) return `${sign}${symbol}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${symbol}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${symbol}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function CompanyHeader({ overview }: CompanyHeaderProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [state, setState] = useState<AddState>({ kind: 'idle' });

  const { profile, ratios, quote, symbol } = overview;
  const indian = isIndianSymbol(symbol);
  const price0 = quote.price;
  const prev = quote.previousClose;
  const change =
    price0 != null && prev != null ? price0 - prev : null;
  const changePct =
    change != null && prev && prev !== 0 ? (change / prev) * 100 : null;
  const isUp = change != null && change >= 0;

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
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-primary md:text-3xl">
            {profile.longName || symbol}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-canvas px-2 py-1 font-mono font-semibold uppercase tracking-wide text-secondary">
              {symbol}
            </span>
            {profile.exchange && (
              <span className="rounded-md bg-canvas px-2 py-1 text-secondary">
                {profile.exchange}
              </span>
            )}
            {profile.sector && (
              <span className="rounded-md bg-accent-brand/10 px-2 py-1 font-medium text-accent-brand">
                {profile.sector}
              </span>
            )}
            {profile.website && (
              <Link
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </Link>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted">
            Current price
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-primary md:text-4xl">
            {price0 != null ? formatCurrency(price0, quote.currency) : '—'}
          </p>
          {change != null && changePct != null && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium',
                isUp
                  ? 'bg-accent-green/15 text-accent-green'
                  : 'bg-accent-red/15 text-accent-red'
              )}
            >
              {isUp ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isUp ? '+' : ''}
              {formatCurrency(Math.abs(change), quote.currency)} (
              {formatPercent(changePct)})
            </div>
          )}
          {prev != null && (
            <p className="mt-1 text-xs text-muted tabular-nums">
              Prev close {formatCurrency(prev, quote.currency)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-borderSubtle pt-4 sm:grid-cols-4">
        <Stat label="Market cap" value={formatLargeCurrency(profile.marketCap, quote.currency, indian)} />
        <Stat
          label="Day high"
          value={quote.dayHigh != null ? formatCurrency(quote.dayHigh, quote.currency) : '—'}
        />
        <Stat
          label="Day low"
          value={quote.dayLow != null ? formatCurrency(quote.dayLow, quote.currency) : '—'}
        />
        <Stat
          label="52w range"
          value={
            ratios.fiftyTwoWeekLow != null && ratios.fiftyTwoWeekHigh != null
              ? `${formatCurrency(ratios.fiftyTwoWeekLow, quote.currency)} – ${formatCurrency(ratios.fiftyTwoWeekHigh, quote.currency)}`
              : '—'
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setState({ kind: 'idle' });
              if (!price && price0 != null) setPrice(String(price0));
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-brand px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-brand-hover"
          >
            <Plus className="h-4 w-4" />
            Add to portfolio
          </button>
        ) : (
          <form
            onSubmit={submit}
            className="flex w-full flex-wrap items-end gap-2 rounded-lg border border-borderSubtle bg-canvas p-3"
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
          </form>
        )}
        {!user && !open && (
          <span className="text-xs text-muted">
            Log in to save holdings.
          </span>
        )}
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums text-primary">
        {value}
      </p>
    </div>
  );
}
