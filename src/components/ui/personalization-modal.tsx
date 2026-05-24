'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check, Palette, X } from 'lucide-react';
import { THEMES, THEME_META, useTheme, type Theme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

interface PersonalizationModalProps {
  open: boolean;
  onClose: () => void;
}

export function PersonalizationModal({ open, onClose }: PersonalizationModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-borderSubtle bg-canvas shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalization-title"
      >
        <header className="flex items-center justify-between border-b border-borderSubtle px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-brand/15 text-accent-brand">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 id="personalization-title" className="text-base font-semibold text-primary">
                Personalization
              </h2>
              <p className="text-xs text-muted">Pick a theme. Applies across the whole app.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-elevated hover:text-primary"
            aria-label="Close personalization"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <section className="px-5 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Theme
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {THEMES.map((t) => (
              <ThemeCard
                key={t}
                themeKey={t}
                active={theme === t}
                onSelect={() => setTheme(t)}
              />
            ))}
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-borderSubtle bg-elevated/40 px-5 py-3 text-xs text-muted">
          <span>Your choice is saved in this browser.</span>
          <button
            onClick={onClose}
            className="rounded-md bg-accent-brand px-3 py-1.5 text-xs font-medium text-inverse transition-colors hover:bg-accent-brand-hover"
          >
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

function ThemeCard({
  themeKey,
  active,
  onSelect,
}: {
  themeKey: Theme;
  active: boolean;
  onSelect: () => void;
}) {
  const meta = THEME_META[themeKey];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-all',
        active
          ? 'border-accent-brand bg-accent-brand/5 shadow-sm'
          : 'border-borderSubtle bg-elevated hover:border-borderStrong hover:bg-elevated-hover'
      )}
      aria-pressed={active}
    >
      <div
        className="relative h-16 w-full overflow-hidden rounded-lg border border-borderSubtle"
        style={{ background: meta.swatch.bg }}
      >
        {/* Mini preview: a "header bar" stripe + accent dot + text line */}
        <div
          className="absolute left-2 top-2 h-2 w-12 rounded-full"
          style={{ background: meta.swatch.fg, opacity: 0.85 }}
        />
        <div
          className="absolute left-2 top-6 h-1.5 w-20 rounded-full"
          style={{ background: meta.swatch.fg, opacity: 0.45 }}
        />
        <div
          className="absolute left-2 top-9 h-1.5 w-16 rounded-full"
          style={{ background: meta.swatch.fg, opacity: 0.3 }}
        />
        <div
          className="absolute right-2 top-2 h-4 w-4 rounded-full"
          style={{ background: meta.swatch.accent }}
        />
        {active && (
          <div className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-brand text-inverse">
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-primary">{meta.label}</span>
        {active && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-brand">
            Active
          </span>
        )}
      </div>
      <span className="text-xs leading-snug text-muted">{meta.description}</span>
    </button>
  );
}
