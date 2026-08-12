import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-[13px]', className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.to && !last ? (
              <Link
                to={item.to}
                className="text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={last ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                {item.label}
              </span>
            )}
            {!last && <ChevronRight className="text-muted-foreground/60 size-3.5" />}
          </span>
        )
      })}
    </nav>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  badge,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumbs?: Crumb[]
  badge?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-foreground truncate text-[22px] leading-tight font-semibold tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-muted-foreground max-w-2xl text-[13.5px]">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
