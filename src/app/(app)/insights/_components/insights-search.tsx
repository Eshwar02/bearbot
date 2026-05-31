'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
}

interface InsightsSearchProps {
  inputId?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

export function InsightsSearch({ inputId, autoFocus = false, compact = false }: InsightsSearchProps) {
  const router = useRouter();
  const fallbackId = useId();
  const id = inputId ?? `insights-search-${fallbackId}`;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Yahoo's autocomplete endpoint is proxied via /api/insights/search later;
  // for now we resolve on submit and let the symbol page handle bad input.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/insights/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal, credentials: 'same-origin' },
        );
        if (!res.ok) {
          if (!cancelled) setResults([]);
          return;
        }
        const data = (await res.json()) as { results?: SearchResult[] };
        if (!cancelled) {
          setResults(data.results ?? []);
          setOpen(true);
          setActive(-1);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = useCallback(
    (symbol: string) => {
      const trimmed = symbol.trim().toUpperCase();
      if (!trimmed) return;
      router.push(`/insights/${encodeURIComponent(trimmed)}`);
    },
    [router],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (active >= 0 && results[active]) {
          go(results[active].symbol);
        } else if (query.trim()) {
          go(query);
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [active, results, query, go],
  );

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={
          compact
            ? 'flex items-center gap-2 rounded-lg border border-borderSubtle bg-canvas px-3 py-1.5'
            : 'flex items-center gap-2 rounded-xl border border-borderSubtle bg-canvas px-4 py-3 focus-within:border-accent-brand'
        }
      >
        <Search size={compact ? 14 : 18} className="text-muted" aria-hidden="true" />
        <input
          id={id}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search a company or ticker"
          className="w-full bg-transparent text-base text-primary placeholder:text-muted focus:outline-none"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${id}-list`}
          aria-expanded={open}
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        />
        {loading && <Loader2 size={14} className="animate-spin text-muted" aria-hidden="true" />}
      </div>

      {open && results.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-xl border border-borderSubtle bg-canvas shadow-lg"
        >
          {results.map((r, i) => (
            <li
              key={`${r.symbol}-${i}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={active === i}
              className={
                'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm transition-colors ' +
                (active === i ? 'bg-elevated' : 'hover:bg-elevated')
              }
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                go(r.symbol);
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-primary">{r.name || r.symbol}</div>
                {r.exchange && (
                  <div className="truncate text-[11px] text-muted">{r.exchange}</div>
                )}
              </div>
              <span className="shrink-0 font-mono text-xs text-muted">{r.symbol}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
