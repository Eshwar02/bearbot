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
    description: 'Pure black canvas, professional white text',
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

const THEME_COOKIE = 'theme';
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function readCookieTheme(): Theme | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${THEME_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(THEME_COOKIE.length + 1));
  return isTheme(value) ? value : null;
}

function writeCookieTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  let domainAttr = '';
  if (host.endsWith('.alphasightai.online') || host === 'alphasightai.online') {
    domainAttr = '; Domain=.alphasightai.online';
  } else if (host.endsWith('.localhost')) {
    domainAttr = '; Domain=.localhost';
  }
  document.cookie = `${THEME_COOKIE}=${encodeURIComponent(theme)}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax${domainAttr}`;
}

function readStoredTheme(): Theme {
  const cookieTheme = readCookieTheme();
  if (cookieTheme) return cookieTheme;
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
  return 'light';
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  const isDarkFamily = theme === 'dark' || theme === 'blue';
  html.classList.toggle('dark', isDarkFamily);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // ignore
  }
  writeCookieTheme(theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('light');

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
      theme: 'light',
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
