'use client'

import * as React from 'react'
import { Moon, Palette, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { persistThemePreference } from '@/lib/theme-preference'
import { publishPrefsUpdate } from '@/lib/hooks/use-prefs'

interface ThemeSwitchProps {
  className?: string
}

export function ThemeSwitch({ className = '' }: ThemeSwitchProps) {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleTheme = React.useCallback(async () => {
    const order = ['light', 'dark', 'sandal', 'blue'] as const
    const index = order.indexOf(theme)
    const nextTheme = order[(index + 1) % order.length]
    toggleTheme()
    publishPrefsUpdate({ theme: nextTheme })
    await persistThemePreference(nextTheme)
  }, [theme, toggleTheme])

  if (!mounted) return null

  return (
    <button
      onClick={handleToggleTheme}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-dark-850 transition-all overflow-hidden ${className}`}
      aria-label="Toggle theme"
      title="Switch theme"
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
      <Palette
        className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          theme === 'sandal' || theme === 'blue'
            ? 'scale-100 translate-y-0 opacity-100'
            : 'scale-50 translate-y-5 opacity-0'
        }`}
      />
    </button>
  )
}
