import * as React from 'react'
import { cn } from '@/lib/utils'

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="scrollbar-thin relative w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return <tfoot className={cn('bg-muted/50 border-t font-medium', className)} {...props} />
}

function TableRow({
  className,
  interactive,
  ...props
}: React.ComponentProps<'tr'> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        'border-b transition-colors',
        interactive && 'hover:bg-muted/60 focus-visible:bg-muted/60 cursor-pointer outline-none',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'text-muted-foreground h-10 px-4 text-left align-middle text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />
}

export { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow }
