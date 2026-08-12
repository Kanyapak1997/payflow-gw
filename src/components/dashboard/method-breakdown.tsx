import type { MethodShare } from '@/lib/analytics'
import { formatCompactCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Categorical colours are assigned by method identity in a fixed order, never
 * by rank, so filtering the dashboard never repaints a method.
 */
const METHOD_COLOR: Record<MethodShare['type'], string> = {
  CARD: 'var(--chart-1)',
  PROMPTPAY: 'var(--chart-2)',
  WALLET: 'var(--chart-3)',
  INSTALLMENT: 'var(--chart-4)',
}

export function MethodBreakdown({ shares }: { shares: MethodShare[] }) {
  const max = Math.max(...shares.map((share) => share.share), 1)

  return (
    <div className="space-y-4">
      {/* Composite bar gives the whole mix at a glance */}
      <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
        {shares.map((share) => (
          <span
            key={share.type}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${share.share}%`,
              backgroundColor: METHOD_COLOR[share.type],
              // 2px surface gap keeps adjacent fills readable
              boxShadow: '2px 0 0 0 var(--card)',
            }}
          />
        ))}
      </div>

      <ul className="space-y-3">
        {shares.map((share) => (
          <li key={share.type} className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: METHOD_COLOR[share.type] }}
              />
              <span className="text-foreground min-w-0 flex-1 truncate text-[13px]">
                {share.label}
              </span>
              <span className="tabular text-foreground shrink-0 text-[13px] font-semibold">
                {formatPercent(share.share, 0)}
              </span>
            </div>
            <div className="flex items-center gap-2.5 pl-[22px]">
              <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                <span
                  className={cn('block h-full rounded-full transition-[width] duration-500')}
                  style={{
                    width: `${(share.share / max) * 100}%`,
                    backgroundColor: METHOD_COLOR[share.type],
                  }}
                />
              </div>
              <span className="tabular text-muted-foreground shrink-0 text-[11.5px]">
                {formatCompactCurrency(share.volume)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
