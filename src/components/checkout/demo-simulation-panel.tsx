import type { ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SimulationAction {
  label: string
  onClick: () => void
  tone?: 'default' | 'outline' | 'destructive'
}

/**
 * Explicit demo controls. These stay visible on purpose — when showing PayFlow
 * to a client you need to be able to force any outcome on demand.
 */
export function DemoSimulationPanel({
  actions,
  description,
  children,
  className,
}: {
  actions?: SimulationAction[]
  description?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-warning-border bg-warning-bg/60 rounded-lg border border-dashed p-3.5',
        className,
      )}
    >
      <p className="text-warning flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
        <FlaskConical className="size-3.5" />
        Demo simulation
      </p>
      {description && (
        <p className="text-muted-foreground mt-1.5 text-[12.5px] leading-relaxed">{description}</p>
      )}
      {actions && actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              size="sm"
              variant={
                action.tone === 'destructive'
                  ? 'destructive'
                  : action.tone === 'default'
                    ? 'default'
                    : 'outline'
              }
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}
