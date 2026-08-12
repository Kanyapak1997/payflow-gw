import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CopyButton } from './copy-button'

const TOKEN =
  /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g

function classFor(token: string) {
  if (token.startsWith('"')) {
    return token.trimEnd().endsWith(':')
      ? 'text-sky-700 dark:text-sky-300'
      : 'text-emerald-700 dark:text-emerald-300'
  }
  if (token === 'true' || token === 'false') return 'text-violet-700 dark:text-violet-300'
  if (token === 'null') return 'text-muted-foreground'
  return 'text-amber-700 dark:text-amber-300'
}

/** Lightweight JSON syntax highlighting — no external highlighter needed. */
function highlight(json: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of json.matchAll(TOKEN)) {
    const index = match.index ?? 0
    if (index > lastIndex) nodes.push(<Fragment key={key++}>{json.slice(lastIndex, index)}</Fragment>)
    nodes.push(
      <span key={key++} className={classFor(match[0])}>
        {match[0]}
      </span>,
    )
    lastIndex = index + match[0].length
  }
  if (lastIndex < json.length) nodes.push(<Fragment key={key++}>{json.slice(lastIndex)}</Fragment>)
  return nodes
}

export function JsonViewer({
  value,
  className,
  maxHeight = '22rem',
}: {
  value: unknown
  className?: string
  maxHeight?: string
}) {
  const json = useMemo(() => JSON.stringify(value, null, 2), [value])
  const nodes = useMemo(() => highlight(json), [json])

  return (
    <pre
      className={cn(
        'scrollbar-thin bg-muted/50 text-foreground overflow-auto rounded-md border p-3.5 font-mono text-[12.5px] leading-relaxed',
        className,
      )}
      style={{ maxHeight }}
    >
      <code>{nodes}</code>
    </pre>
  )
}

/**
 * A titled, collapsible JSON block with a copy affordance — used for the
 * request / response / webhook payload panels.
 */
export function JsonSection({
  title,
  description,
  value,
  defaultOpen = false,
  badge,
  className,
}: {
  title: string
  description?: string
  value: unknown
  defaultOpen?: boolean
  badge?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const json = useMemo(() => JSON.stringify(value, null, 2), [value])

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <div className="bg-muted/40 flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="hover:text-foreground text-foreground/90 focus-visible:ring-ring/40 -ml-1 flex flex-1 items-center gap-2 rounded px-1 py-0.5 text-left text-[13px] font-medium outline-none focus-visible:ring-2"
        >
          <ChevronRight
            className={cn(
              'text-muted-foreground size-4 transition-transform duration-200',
              open && 'rotate-90',
            )}
          />
          <span>{title}</span>
          {badge}
          {description && !open && (
            <span className="text-muted-foreground ml-1 truncate text-xs font-normal">
              {description}
            </span>
          )}
        </button>
        <CopyButton value={json} label={`${title} copied`} />
      </div>
      {open && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 border-t p-3 duration-200">
          <JsonViewer value={value} />
        </div>
      )}
    </div>
  )
}
