import { RANGE_OPTIONS, type RangeKey } from '@/lib/analytics'
import { cn } from '@/lib/utils'

export function RangeSelector({
  value,
  onChange,
  className,
}: {
  value: RangeKey
  onChange: (range: RangeKey) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label="Chart date range"
      className={cn('bg-muted inline-flex items-center gap-0.5 rounded-md p-0.5', className)}
    >
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          role="tab"
          type="button"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'focus-visible:ring-ring/40 rounded-[5px] px-2.5 py-1 text-[12.5px] font-medium transition-colors outline-none focus-visible:ring-2',
            value === option.value
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
