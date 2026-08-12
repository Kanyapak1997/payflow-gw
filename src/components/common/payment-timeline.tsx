import {
  Ban,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  QrCode,
  RotateCcw,
  ShieldCheck,
  ShieldQuestion,
  Smartphone,
  Timer,
  XCircle,
} from 'lucide-react'
import type { TransactionEvent } from '@/types'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const ICONS: Record<string, typeof CheckCircle2> = {
  'payment.created': FileText,
  'payment.processing': Loader2,
  'payment.3ds_requested': ShieldQuestion,
  'payment.authenticated': ShieldCheck,
  'payment.authorized': CreditCard,
  'payment.success': CheckCircle2,
  'payment.failed': XCircle,
  'payment.cancelled': Ban,
  'payment.qr_generated': QrCode,
  'payment.redirected': Smartphone,
  'payment.installment_selected': CreditCard,
  'refund.requested': RotateCcw,
  'refund.processing': Loader2,
  'payment.refunded': RotateCcw,
  'payment.partially_refunded': RotateCcw,
}

const TONE_STYLES: Record<TransactionEvent['tone'], string> = {
  neutral: 'bg-neutral-bg text-neutral border-neutral-border',
  info: 'bg-info-bg text-info border-info-border',
  success: 'bg-success-bg text-success border-success-border',
  warning: 'bg-warning-bg text-warning border-warning-border',
  danger: 'bg-danger-bg text-danger border-danger-border',
  violet: 'bg-violet-bg text-violet border-violet-border',
}

export function PaymentTimeline({
  events,
  className,
}: {
  events: TransactionEvent[]
  className?: string
}) {
  if (events.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-[13px]">No events yet.</p>
  }

  return (
    <ol className={cn('relative', className)}>
      {events.map((event, index) => {
        const Icon = ICONS[event.type] ?? Timer
        const last = index === events.length - 1
        return (
          <li key={event.id} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className="bg-border absolute top-8 left-[15px] h-[calc(100%-1.5rem)] w-px"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border',
                TONE_STYLES[event.tone],
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <p className="text-[13.5px] font-medium">{event.label}</p>
                <time
                  dateTime={event.timestamp}
                  className="tabular text-muted-foreground font-mono text-[11.5px]"
                >
                  {formatTime(event.timestamp)}
                </time>
              </div>
              {event.description && (
                <p className="text-muted-foreground mt-0.5 text-[12.5px]">{event.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
