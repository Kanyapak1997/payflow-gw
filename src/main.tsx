import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'
import { ThemeGate } from '@/components/layout/theme-gate'
import { router } from '@/routes/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeGate>
      <TooltipProvider delayDuration={250} skipDelayDuration={300}>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </ThemeGate>
  </StrictMode>,
)
