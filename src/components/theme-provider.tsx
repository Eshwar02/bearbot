'use client';

import * as React from 'react';

export type Theme = 'light' | 'dark' | 'sandal' | 'blue';

export const THEMES: Theme[] = ['light', 'dark', 'sandal', 'blue'];

export const THEME_META: Record<
  Theme,
  { label: string; description: string; swatch: { bg: string; fg: string; accent: string } }
> = {
  light: {
    label: 'Light',
    description: 'Crisp white surface, dark text',
    swatch: { bg: '#ffffff', fg: '#0d0d0d', accent: '#14b8a6' },
  },
  dark: {
    label: 'Dark',
    description: 'Pure black canvas, ChatGPT-style white text',
    swatch: { bg: '#000000', fg: '#ffffff', accent: '#10a37f' },
  },
  sandal: {
    label: 'Sandal',
    description: 'Warm beige paper with terracotta accents',
    swatch: { bg: '#f4ead5', fg: '#3d2c1e', accent: '#b8593c' },
  },
  blue: {
    label: 'Blue',
    description: 'Deep navy canvas with sky accents',
    swatch: { bg: '#0b1a33', fg: '#e6efff', accent: '#3b82f6' },
  },
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEMES as readonly string[]).includes(v);
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme');
    if (isTheme(stored)) return stored;
  } catch {
    // ignore
  }
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme');
    if (isTheme(attr)) return attr;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  return 'dark';
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  // Keep .dark class in sync for any legacy `dark:` Tailwind selectors.
  // Treat sandal as light-family, blue + dark as dark-family.
  const isDarkFamily = theme === 'dark' || theme === 'blue';
  html.classList.toggle('dark', isDarkFamily);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('dark');

  React.useEffect(() => {
    const initial = readStoredTheme();
    applyTheme(initial);
    setThemeState(initial);
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      // Cycle through all themes.
      const idx = THEMES.indexOf(prev);
      const next = THEMES[(idx + 1) % THEMES.length];
      applyTheme(next);
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'dark',
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
