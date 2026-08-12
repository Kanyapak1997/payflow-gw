import type { PaymentMethod } from '@/types'
import { cn } from '@/lib/utils'
import { BankMark, CardBrandMark, PromptPayMark, WalletMark } from './brand-marks'

/**
 * Renders a payment method the way an operations dashboard would: the scheme
 * mark plus the human label, aligned on a consistent baseline.
 */
export function PaymentMethodBadge({
  method,
  className,
  compact = false,
}: {
  method: PaymentMethod
  className?: string
  compact?: boolean
}) {
  const markClass = compact ? 'scale-[0.82] origin-left' : ''

  const mark = (() => {
    switch (method.type) {
      case 'CARD':
        return <CardBrandMark brand={method.cardBrand ?? 'unknown'} className={markClass} />
      case 'PROMPTPAY':
        return <PromptPayMark className={cn('size-6 rounded-[5px]', markClass)} />
      case 'WALLET':
        return (
          <WalletMark
            wallet={method.wallet ?? 'truemoney'}
            className={cn('size-6 rounded-[5px] text-[9px]', markClass)}
          />
        )
      case 'INSTALLMENT':
        return <BankMark bank={method.bank ?? 'kbank'} className={cn('size-6 text-[10px]', markClass)} />
    }
  })()

  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)}>
      {mark}
      <span className={cn('truncate', compact ? 'text-[13px]' : 'text-sm')}>{method.label}</span>
    </span>
  )
}
