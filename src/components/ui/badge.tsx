import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-md border text-xs font-medium whitespace-nowrap transition-colors [&>svg]:size-3 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'bg-muted text-muted-foreground border-transparent',
        outline: 'text-foreground bg-background',
        success: 'bg-success-bg text-success border-success-border',
        warning: 'bg-warning-bg text-warning border-warning-border',
        danger: 'bg-danger-bg text-danger border-danger-border',
        info: 'bg-info-bg text-info border-info-border',
        violet: 'bg-violet-bg text-violet border-violet-border',
        neutral: 'bg-neutral-bg text-neutral border-neutral-border',
      },
      size: {
        default: 'px-2 py-0.5',
        sm: 'px-1.5 py-px text-[11px]',
        lg: 'px-2.5 py-1 text-[13px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
