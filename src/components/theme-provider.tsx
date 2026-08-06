'use client';

import * as React from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEMES: Theme[] = ['light', 'dark', 'system'];

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
  system: {
    label: 'System',
    description: 'Follows your device appearance setting',
    swatch: { bg: '#808080', fg: '#ffffff', accent: '#6b7280' },
  },
};

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
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
  return 'system';
}

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') return getSystemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  const resolved = resolveTheme(theme);
  html.setAttribute('data-theme', theme);
  html.classList.toggle('dark', resolved === 'dark');
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // ignore
  }
  writeCookieTheme(theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>('light');

  React.useEffect(() => {
    const initial = readStoredTheme();
    applyTheme(initial);
    setThemeState(initial);
    setResolvedTheme(resolveTheme(initial));
  }, []);

  // Keep resolvedTheme (and the DOM) in sync with OS changes while theme === 'system'.
  React.useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const resolved = resolveTheme('system');
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
    setResolvedTheme(resolveTheme(next));
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const idx = THEMES.indexOf(prev);
      const next = THEMES[(idx + 1) % THEMES.length];
      applyTheme(next);
      setResolvedTheme(resolveTheme(next));
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
