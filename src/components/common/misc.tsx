import type { ComponentType, ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, FlaskConical, Inbox } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatSignedPercent } from '@/lib/format'

/* ------------------------------- SandboxBadge ----------------------------- */

export function SandboxBadge({
  className,
  withTooltip = true,
}: {
  className?: string
  withTooltip?: boolean
}) {
  const badge = (
    <Badge
      variant="warning"
      className={cn('gap-1.5 font-medium tracking-wide uppercase', className)}
    >
      <FlaskConical />
      Sandbox
    </Badge>
  )
  if (!withTooltip) return badge
  return (
    <Tooltip content="You are in test mode. No real money is processed and no card data is stored.">
      <span className="inline-flex">{badge}</span>
    </Tooltip>
  )
}

/* -------------------------------- MetricCard ------------------------------ */

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel = 'compared with last month',
  icon: Icon,
  loading = false,
  invertDelta = false,
  className,
}: {
  label: string
  value: ReactNode
  delta?: number
  deltaLabel?: string
  icon?: ComponentType<{ className?: string }>
  loading?: boolean
  /** For metrics where a decrease is good (refund volume) */
  invertDelta?: boolean
  className?: string
}) {
  const positive = (delta ?? 0) >= 0
  const good = invertDelta ? !positive : positive
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
        {Icon && (
          <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-2.5 h-4 w-40" />
        </>
      ) : (
        <>
          <p className="tabular text-foreground mt-2.5 text-[26px] leading-none font-semibold tracking-tight">
            {value}
          </p>
          {delta !== undefined && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px]">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-medium tabular-nums',
                  good ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger',
                )}
              >
                <DeltaIcon className="size-3" />
                {formatSignedPercent(delta)}
              </span>
              <span className="text-muted-foreground">{deltaLabel}</span>
            </p>
          )}
        </>
      )}
    </Card>
  )
}

/* -------------------------------- EmptyState ------------------------------ */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-6 py-10' : 'gap-3 px-6 py-16',
        className,
      )}
    >
      <span className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
        <Icon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-[15px] font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground mx-auto max-w-sm text-[13px]">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

/* ------------------------------ AmountDisplay ----------------------------- */

export function AmountDisplay({
  amount,
  className,
  strikethrough,
  size = 'default',
}: {
  amount: string
  className?: string
  strikethrough?: boolean
  size?: 'sm' | 'default' | 'lg' | 'xl'
}) {
  return (
    <span
      className={cn(
        'tabular font-semibold tracking-tight',
        size === 'sm' && 'text-[13px]',
        size === 'default' && 'text-sm',
        size === 'lg' && 'text-lg',
        size === 'xl' && 'text-3xl',
        strikethrough && 'text-muted-foreground line-through',
        className,
      )}
    >
      {amount}
    </span>
  )
}

/* ------------------------------- DetailList ------------------------------- */

export function DetailList({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('divide-y', className)}>{children}</dl>
}

export function DetailRow({
  label,
  children,
  mono = false,
  className,
}: {
  label: string
  children: ReactNode
  mono?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4',
        className,
      )}
    >
      <dt className="text-muted-foreground text-[13px]">{label}</dt>
      <dd
        className={cn(
          'text-foreground min-w-0 text-[13px] break-words',
          mono && 'font-mono text-[12.5px]',
        )}
      >
        {children}
      </dd>
    </div>
  )
}
