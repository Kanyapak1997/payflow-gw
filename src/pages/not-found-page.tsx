import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PayFlowLogo } from '@/components/common/brand-marks'

export function NotFoundPage() {
  return (
    <div className="bg-canvas flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <PayFlowLogo className="mb-10" />

      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Compass className="size-5" />
      </span>
      <p className="text-muted-foreground mt-5 font-mono text-[12px] tracking-widest uppercase">
        404 — Not found
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">This page doesn't exist</h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-[13.5px]">
        The link may be out of date, or the page may have been part of a different demo route.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/dashboard">
            <ArrowLeft />
            Back to dashboard
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/transactions">View transactions</Link>
        </Button>
      </div>
    </div>
  )
}
