import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn, copyToClipboard } from '@/lib/utils'

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'value'> {
  value: string
  /** Shown in the toast, e.g. "Transaction ID copied" */
  label?: string
  /** Render the label next to the icon instead of icon-only */
  withText?: string
  silent?: boolean
}

export function CopyButton({
  value,
  label = 'Copied to clipboard',
  withText,
  silent = false,
  variant = 'ghost',
  size,
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const handleCopy = async () => {
    const ok = await copyToClipboard(value)
    if (!ok) {
      toast.error('Could not access the clipboard')
      return
    }
    setCopied(true)
    if (!silent) toast.success(label)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1600)
  }

  const Icon = copied ? Check : Copy

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size ?? (withText ? 'sm' : 'icon-sm')}
      onClick={handleCopy}
      className={cn(copied && 'text-success', className)}
      {...props}
    >
      <Icon />
      {withText && <span>{copied ? 'Copied' : withText}</span>}
      {!withText && <span className="sr-only">Copy</span>}
    </Button>
  )

  if (withText) return button
  return <Tooltip content={copied ? 'Copied' : 'Copy'}>{button}</Tooltip>
}
