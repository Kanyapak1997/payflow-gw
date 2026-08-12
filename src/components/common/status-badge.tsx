import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  ShieldQuestion,
  XCircle,
} from 'lucide-react'
import type { PaymentStatus } from '@/types'
import { STATUS_META } from '@/lib/payment'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_ICON: Record<PaymentStatus, typeof CheckCircle2> = {
  CREATED: AlertCircle,
  PENDING: Clock,
  PROCESSING: Loader2,
  REQUIRES_ACTION: ShieldQuestion,
  SUCCESS: CheckCircle2,
  FAILED: XCircle,
  CANCELLED: Ban,
  REFUNDED: RotateCcw,
  PARTIALLY_REFUNDED: RotateCcw,
}

export function TransactionStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className,
}: {
  status: PaymentStatus
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  className?: string
}) {
  const meta = STATUS_META[status]
  const Icon = STATUS_ICON[status]
  return (
    <Badge variant={meta.tone} size={size} className={cn('gap-1.5', className)}>
      {showIcon && <Icon className={cn(status === 'PROCESSING' && 'animate-spin')} />}
      {meta.label}
    </Badge>
  )
}

/** Small coloured dot — used where a full badge would be too heavy. */
export function StatusDot({ status, className }: { status: PaymentStatus; className?: string }) {
  const tone = STATUS_META[status].tone
  return (
    <span
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        tone === 'success' && 'bg-success',
        tone === 'warning' && 'bg-warning',
        tone === 'danger' && 'bg-danger',
        tone === 'info' && 'bg-info',
        tone === 'violet' && 'bg-violet',
        tone === 'neutral' && 'bg-neutral',
        className,
      )}
    />
  )
}
