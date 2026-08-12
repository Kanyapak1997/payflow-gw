import type { ReactNode } from 'react'
import { useTheme } from '@/hooks/use-theme'

/**
 * Applies the persisted theme preference to <html> before anything renders.
 * Mounted once at the root so every surface — including the hosted checkout,
 * which sits outside the dashboard layout — picks it up.
 */
export function ThemeGate({ children }: { children: ReactNode }) {
  useTheme()
  return <>{children}</>
}
