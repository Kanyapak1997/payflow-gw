import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

interface UiState {
  theme: ThemePreference
  sidebarCollapsed: boolean
  /** Whether the guided demo callout has been dismissed on the dashboard */
  demoTourDismissed: boolean
  setTheme: (theme: ThemePreference) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  dismissDemoTour: () => void
  restoreDemoTour: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      demoTourDismissed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      dismissDemoTour: () => set({ demoTourDismissed: true }),
      restoreDemoTour: () => set({ demoTourDismissed: false }),
    }),
    { name: 'payflow.ui' },
  ),
)
