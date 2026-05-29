'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { MarkdownRenderer } from '@/components/chat/markdown-renderer';
import { Button } from '@/components/ui/button';

interface AISectionCardProps {
  symbol: string;
  topic: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

type Status = 'idle' | 'streaming' | 'done' | 'error';

function formatRelative(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleString();
}

export function AISectionCard({
  symbol,
  topic,
  title,
  description,
  icon: Icon,
}: AISectionCardProps) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!symbol) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setContent('');
    setGeneratedAt(null);
    setStatus('streaming');

    try {
      const res = await fetch(
        `/api/insights/${encodeURIComponent(symbol)}/analysis?stream=1&topic=${encodeURIComponent(topic)}`,
        { signal: controller.signal, cache: 'no-store' },
      );
      if (!res.ok || !res.body) {
        throw new Error(`request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          acc += chunk;
          setContent(acc);
        }
      }
      const tail = decoder.decode();
      if (tail) {
        acc += tail;
        setContent(acc);
      }
      setGeneratedAt(formatRelative(new Date()));
      setStatus('done');
    } catch (err) {
      if ((err as { name?: string } | null)?.name === 'AbortError') return;
      setStatus('error');
    }
  }, [symbol, topic]);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
  }, [run, attempt]);

  const isStreaming = status === 'streaming';
  const isError = status === 'error';

  return (
    <section className="flex flex-col rounded-xl border border-borderSubtle bg-elevated shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-borderSubtle px-4 py-3 sm:px-5">
        <div className="flex items-start gap-2.5">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-brand" />
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-primary sm:text-base">
              {title}
            </h3>
            <p className="text-xs text-secondary">{description}</p>
          </div>
        </div>
        {isStreaming ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-brand/10 px-2.5 py-1 text-xs font-medium text-accent-brand">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating…
          </span>
        ) : null}
      </header>

      <div className="min-h-64 flex-1 px-4 py-4 sm:px-5">
        {isError && !content ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-sm text-secondary">
              Could not generate analysis. Try refreshing.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAttempt((n) => n + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        ) : content ? (
          <MarkdownRenderer
            content={content}
            streaming={isStreaming}
            className="text-sm"
          />
        ) : (
          <div className="space-y-3 py-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-skeleton" />
            <div className="h-3 w-full animate-pulse rounded bg-skeleton" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-skeleton" />
            <div className="h-3 w-4/6 animate-pulse rounded bg-skeleton" />
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-borderSubtle px-4 py-2.5 text-xs text-muted sm:px-5">
        <span>
          Cerebras AI · {topic}
          {generatedAt ? ` · Generated ${generatedAt}` : ''}
        </span>
        {status === 'done' || isError ? (
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="inline-flex items-center gap-1 text-muted transition-colors hover:text-primary"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </button>
        ) : null}
      </footer>
    </section>
  );
}
