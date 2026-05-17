'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== 'undefined') {
      console.error('[global-error]', error);
    }
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          padding: '16px',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            border: '1px solid #2a2a2a',
            background: 'rgba(20,20,20,0.6)',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p
            style={{
              margin: '12px 0 20px',
              fontSize: 14,
              color: '#a3a3a3',
              lineHeight: 1.5,
            }}
          >
            We hit an unexpected error. Your data is safe. Try again, or reload
            the page.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'transparent',
                color: '#e5e5e5',
                border: '1px solid #404040',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
