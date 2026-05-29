'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeColumn() {
  const { theme, setTheme } = useTheme();

  const handleAuto = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('theme');
    } catch {
      // ignore
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  };

  const baseClass =
    'flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors';
  const activeClass = 'text-accent-brand hover:text-accent-brand';

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`${baseClass} ${theme === 'light' ? activeClass : ''}`}
      >
        <Sun className="h-4 w-4" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`${baseClass} ${theme === 'dark' ? activeClass : ''}`}
      >
        <Moon className="h-4 w-4" />
        <span>Dark</span>
      </button>
      <button
        type="button"
        onClick={handleAuto}
        className={baseClass}
      >
        <Monitor className="h-4 w-4" />
        <span>Auto</span>
      </button>
    </div>
  );
}
