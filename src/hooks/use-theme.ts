import { useEffect, useMemo } from 'react'
import { useUiStore, type ThemePreference } from '@/stores/ui-store'

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

/** Reads the stored preference, resolves "system", and applies it to <html>. */
export function useTheme() {
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light'
    return theme
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark())
      root.classList.toggle('dark', dark)
      root.style.colorScheme = dark ? 'dark' : 'light'
    }
    apply()

    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const cycleTheme = () => {
    const order: ThemePreference[] = ['light', 'dark', 'system']
    setTheme(order[(order.indexOf(theme) + 1) % order.length])
  }

  return { theme, resolvedTheme, setTheme, cycleTheme }
}
