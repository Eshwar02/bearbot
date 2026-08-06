'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { persistThemePreference } from '@/lib/theme-preference'
import { publishPrefsUpdate } from '@/lib/hooks/use-prefs'

interface ThemeSwitchProps {
  className?: string
  /** Persist only when the caller has established an authenticated user. */
  persist?: boolean
}

export function ThemeSwitch({ className = '', persist = false }: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleTheme = React.useCallback(async () => {
    const order = ['light', 'dark', 'system'] as const
    const index = order.indexOf(theme as (typeof order)[number])
    const nextTheme = order[(index + 1) % order.length]
    setTheme(nextTheme)
    publishPrefsUpdate({ theme: nextTheme })
    if (persist) await persistThemePreference(nextTheme)
  }, [persist, setTheme, theme])

  if (!mounted) return null

  return (
    <button
      onClick={handleToggleTheme}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-dark-850 transition-all overflow-hidden ${className}`}
      aria-label="Toggle theme"
      title="Switch theme (Light / Dark / System)"
    >
      <Sun
        className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          theme === 'light'
            ? 'scale-100 translate-y-0 opacity-100'
            : 'scale-50 translate-y-5 opacity-0'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          theme === 'dark'
            ? 'scale-100 translate-y-0 opacity-100'
            : 'scale-50 translate-y-5 opacity-0'
        }`}
      />
      <Monitor
        className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          theme === 'system'
            ? 'scale-100 translate-y-0 opacity-100'
            : 'scale-50 translate-y-5 opacity-0'
        }`}
      />
    </button>
  )
}
