import { ChevronRight } from 'lucide-react'
import type { CurrencyCode, MerchantSettings, PaymentMethodType } from '@/types'
import { CardBrandMark, PromptPayMark, WalletMark } from '@/components/common/brand-marks'
import { useSettingsStore } from '@/stores/settings-store'
import { INSTALLMENT_MIN_AMOUNT } from '@/lib/payment'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MethodOption {
  type: PaymentMethodType
  title: string
  description: string
  enabledKey: keyof MerchantSettings['paymentMethods']
}

const OPTIONS: MethodOption[] = [
  {
    type: 'CARD',
    title: 'Credit / Debit Card',
    description: 'Visa, Mastercard, JCB, American Express',
    enabledKey: 'cards',
  },
  {
    type: 'PROMPTPAY',
    title: 'PromptPay QR',
    description: 'Scan with any Thai mobile banking app',
    enabledKey: 'promptpay',
  },
  {
    type: 'WALLET',
    title: 'Digital Wallet',
    description: 'TrueMoney, LINE Pay, ShopeePay',
    enabledKey: 'wallets',
  },
  {
    type: 'INSTALLMENT',
    title: 'Installment',
    description: 'Pay over 3, 6 or 10 months',
    enabledKey: 'installments',
  },
]

function MethodIcon({ type }: { type: PaymentMethodType }) {
  switch (type) {
    case 'CARD':
      return (
        <span className="flex items-center -space-x-2">
          <CardBrandMark brand="visa" className="h-7 w-10" />
          <CardBrandMark brand="mastercard" className="h-7 w-10 shadow-sm" />
        </span>
      )
    case 'PROMPTPAY':
      return <PromptPayMark className="size-10 rounded-lg" />
    case 'WALLET':
      return (
        <span className="flex items-center -space-x-2">
          <WalletMark wallet="truemoney" className="size-8 rounded-lg text-[10px]" />
          <WalletMark wallet="linepay" className="size-8 rounded-lg text-[10px] shadow-sm" />
        </span>
      )
    case 'INSTALLMENT':
      return (
        <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg text-[11px] font-bold">
          0%
        </span>
      )
  }
}

export function PaymentMethodSelector({
  amount,
  currency,
  onSelect,
}: {
  amount: number
  currency: CurrencyCode
  onSelect: (type: PaymentMethodType) => void
}) {
  const paymentMethods = useSettingsStore((state) => state.settings.paymentMethods)
  const installmentUnavailable = amount < INSTALLMENT_MIN_AMOUNT

  const available = OPTIONS.filter((option) => paymentMethods[option.enabledKey])

  if (available.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-[14px] font-medium">No payment methods enabled</p>
        <p className="text-muted-foreground mt-1 text-[13px]">
          Enable at least one method under Settings → Payment Methods.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {available.map((option) => {
        const disabled = option.type === 'INSTALLMENT' && installmentUnavailable
        return (
          <button
            key={option.type}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.type)}
            className={cn(
              'bg-card group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all outline-none',
              disabled
                ? 'cursor-not-allowed opacity-55'
                : 'hover:border-primary/60 hover:shadow-card focus-visible:border-primary focus-visible:ring-ring/25 focus-visible:ring-[3px]',
            )}
          >
            <MethodIcon type={option.type} />
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-medium">{option.title}</span>
              <span className="text-muted-foreground block text-[12.5px]">
                {disabled
                  ? `Available on orders over ${formatCurrency(INSTALLMENT_MIN_AMOUNT, currency, { decimals: false })}`
                  : option.description}
              </span>
            </span>
            {!disabled && (
              <ChevronRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors" />
            )}
          </button>
        )
      })}
    </div>
  )
}
