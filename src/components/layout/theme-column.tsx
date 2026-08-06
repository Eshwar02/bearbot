'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeColumn() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAuto = () => setTheme('system');

  const baseClass =
    'flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors';
  const activeClass = 'text-accent-brand hover:text-accent-brand';

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`${baseClass} ${mounted && theme === 'light' ? activeClass : ''}`}
      >
        <Sun className="h-4 w-4" />
        <span>Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`${baseClass} ${mounted && theme === 'dark' ? activeClass : ''}`}
      >
        <Moon className="h-4 w-4" />
        <span>Dark</span>
      </button>
      <button
        type="button"
        onClick={handleAuto}
        className={`${baseClass} ${mounted && theme === 'system' ? activeClass : ''}`}
      >
        <Monitor className="h-4 w-4" />
        <span>Auto</span>
      </button>
    </div>
  );
}
