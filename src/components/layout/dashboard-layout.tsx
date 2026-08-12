import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from './app-sidebar'
import { TopNavigation } from './top-navigation'
import { SandboxRibbon } from './sandbox-ribbon'

export function DashboardLayout() {
  const { pathname } = useLocation()

  // Route changes should start at the top, the way a server-rendered app would.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavigation />
        <SandboxRibbon />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
        <footer className="text-muted-foreground mx-auto w-full max-w-[1400px] px-4 pb-8 text-[12px] lg:px-8">
          <div className="flex flex-col gap-1 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p>
              PayFlow — Payments made simple for modern businesses. Frontend-only demo, no real
              payments are processed.
            </p>
            <p className="font-mono text-[11px]">API v2026-04-01 · Sandbox</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
