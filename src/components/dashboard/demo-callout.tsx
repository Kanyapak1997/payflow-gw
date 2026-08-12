import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, PlayCircle, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

const STEPS = [
  'Create a payment for ฿2,590',
  'Copy the payment link and open the hosted checkout',
  'Pay with the sandbox card 4242 4242 4242 4242',
  'Authenticate with OTP 123456',
  'Land on the success screen and open the transaction',
  'Inspect the API request, response and webhook payload',
  'Refund ฿1,000 and watch the status become PARTIALLY REFUNDED',
]

/**
 * Lightweight guided tour: a callout that explains the hero flow and drops the
 * user at step one with the demo order pre-filled. Deliberately not a modal
 * takeover — it can be dismissed and restored from Settings.
 */
export function DemoCallout() {
  const navigate = useNavigate()
  const dismissed = useUiStore((state) => state.demoTourDismissed)
  const dismiss = useUiStore((state) => state.dismissDemoTour)
  const [expanded, setExpanded] = useState(false)

  if (dismissed) return null

  return (
    <div className="border-primary/25 bg-primary-subtle/70 relative overflow-hidden rounded-lg border">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Sparkles className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-foreground text-[14.5px] font-semibold">
            Take the guided payment tour
          </p>
          <p className="text-muted-foreground mt-0.5 text-[13px]">
            Walk the full lifecycle — create a payment, pay it on the hosted checkout, then inspect
            the transaction, webhook and refund.
          </p>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="text-primary mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium outline-none hover:underline"
          >
            {expanded ? 'Hide steps' : `Show all ${STEPS.length} steps`}
            <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>

          {expanded && (
            <ol className="animate-in fade-in-0 slide-in-from-top-1 mt-3 space-y-1.5 duration-200">
              {STEPS.map((step, index) => (
                <li key={step} className="text-muted-foreground flex gap-2.5 text-[12.5px]">
                  <span className="bg-primary/12 text-primary mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>

        <Button
          className="shrink-0"
          onClick={() => navigate('/payments/create?demo=1')}
        >
          <PlayCircle />
          Start Demo
        </Button>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss demo tour"
        className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 rounded p-1 outline-none"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
