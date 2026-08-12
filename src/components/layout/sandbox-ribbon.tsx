import { FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Persistent reminder that nothing here is real. Deliberately understated so it
 * reads as a product affordance rather than a warning banner.
 */
export function SandboxRibbon() {
  return (
    <div className="border-warning-border bg-warning-bg text-warning border-b">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-2 px-4 py-1.5 text-[12.5px] lg:px-8">
        <FlaskConical className="size-3.5 shrink-0" />
        <p className="min-w-0 flex-1 truncate">
          <span className="font-medium">Sandbox mode.</span> All payments are simulated — no real
          money is processed and no card details are stored.
        </p>
        <Link
          to="/developers/api-keys"
          className="hidden shrink-0 font-medium underline underline-offset-2 hover:no-underline sm:inline"
        >
          View test credentials
        </Link>
      </div>
    </div>
  )
}
