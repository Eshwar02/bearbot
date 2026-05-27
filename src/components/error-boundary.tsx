'use client';

import React from 'react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Errors that originate outside the React tree and should never tear the app
// down. Browser extensions, ResizeObserver loop notifications, blocked
// third-party scripts, and aborted fetches all fire `window.error` /
// `unhandledrejection` events but the React tree is still healthy. Showing
// the "Something went wrong" screen for these is what made the error page
// appear "frequently" on routes like /profile that did not actually crash.
const BENIGN_ERROR_PATTERNS = [
  /ResizeObserver loop/i,
  /ResizeObserver loop completed/i,
  /Non-Error promise rejection captured/i,
  /Loading chunk \d+ failed/i,
  /Loading CSS chunk \d+ failed/i,
  /ChunkLoadError/i,
  /Script error\.?/i,
  /Failed to fetch dynamically imported module/i,
  /NetworkError when attempting to fetch resource/i,
  /The operation was aborted/i,
  /AbortError/i,
  /cancelled/i,
];

function isBenignError(message: unknown): boolean {
  const text = typeof message === 'string'
    ? message
    : message instanceof Error
      ? message.message
      : '';
  if (!text) return true;
  return BENIGN_ERROR_PATTERNS.some((re) => re.test(text));
}

function isChunkLoadError(message: unknown): boolean {
  const text = typeof message === 'string'
    ? message
    : message instanceof Error
      ? message.message
      : '';
  return /ChunkLoadError|Loading chunk \d+ failed|Loading CSS chunk \d+ failed|Failed to fetch dynamically imported module/i.test(text);
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  private windowErrorHandler = (event: ErrorEvent) => {
    if (isChunkLoadError(event.message) || isChunkLoadError(event.error)) {
      // A code-split chunk failed to load — usually because a new deploy
      // invalidated the old hashed filename while the tab was open. Reload
      // once instead of showing an error screen.
      if (typeof window !== 'undefined') {
        const key = '__chunk_reload_attempted__';
        const w = window as unknown as Record<string, unknown>;
        if (!w[key]) {
          w[key] = true;
          window.location.reload();
        }
      }
      return;
    }
    if (isBenignError(event.message) || isBenignError(event.error)) {
      return;
    }
    logger.error('Uncaught window error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    // Intentionally do NOT setState here. Window errors are not React render
    // failures — flipping the boundary on every async hiccup is what made
    // this screen appear unprompted.
  };

  private rejectionHandler = (event: PromiseRejectionEvent) => {
    if (isBenignError(event.reason)) return;
    logger.error('Unhandled promise rejection', event.reason);
  };

  componentDidMount() {
    window.addEventListener('error', this.windowErrorHandler);
    window.addEventListener('unhandledrejection', this.rejectionHandler);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.windowErrorHandler);
    window.removeEventListener('unhandledrejection', this.rejectionHandler);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (isChunkLoadError(error)) {
      const key = '__chunk_reload_attempted__';
      const w = window as unknown as Record<string, unknown>;
      if (!w[key]) {
        w[key] = true;
        window.location.reload();
        return;
      }
    }
    logger.error('React render error', error, {
      componentStack: info.componentStack,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 to-black p-4">
        <div className="max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
          <h1 className="mb-2 text-xl font-semibold text-red-400">
            Something went wrong
          </h1>
          <p className="mb-4 text-sm text-zinc-400">
            We&apos;ve been notified about this error. Try again, or refresh the
            page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4 rounded bg-zinc-800/50 p-2 text-xs text-zinc-300">
              <summary className="cursor-pointer font-mono font-semibold">
                Error details
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <button
              onClick={this.handleRetry}
              className="flex-1 rounded bg-accent-brand px-3 py-2 text-sm font-medium text-white hover:bg-accent-brand/90 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 rounded border border-zinc-700 bg-transparent px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
