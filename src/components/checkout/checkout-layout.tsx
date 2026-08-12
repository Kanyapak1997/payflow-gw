import type { ReactNode } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import type { Payment } from '@/types'
import { PayFlowLogo } from '@/components/common/brand-marks'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { useSettingsStore } from '@/stores/settings-store'

/**
 * Customer-facing chrome for the hosted checkout. Intentionally distinct from
 * the merchant dashboard: single column of attention, larger type, no nav.
 */
export function CheckoutLayout({
  payment,
  children,
}: {
  payment: Payment
  children: ReactNode
}) {
  const settings = useSettingsStore((state) => state.settings)

  return (
    <div className="bg-canvas flex min-h-svh flex-col">
      <div className="border-warning-border bg-warning-bg text-warning border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-1.5 text-center text-[12px]">
          <ShieldCheck className="size-3.5 shrink-0" />
          <span>
            <span className="font-medium">Sandbox checkout.</span> This is a simulation — never
            enter real card details.
          </span>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row lg:gap-10 lg:py-14">
        {/* Order summary */}
        <aside className="lg:w-[320px] lg:shrink-0">
          <div className="lg:sticky lg:top-14">
            <div className="flex items-center gap-3">
              <span className="bg-foreground text-background flex size-10 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold">
                {settings.logoInitials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold tracking-tight">
                  {settings.checkoutDisplayName}
                </p>
                <p className="text-muted-foreground text-[12px]">Secure payment</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-muted-foreground text-[13px]">
                {payment.description || 'Payment'}
              </p>
              <p className="tabular mt-1 text-[32px] leading-none font-semibold tracking-tight">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
              <p className="text-muted-foreground mt-2 font-mono text-[12px]">
                Order #{payment.orderId}
              </p>
            </div>

            <dl className="mt-6 space-y-2.5 border-t pt-5 text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular">{formatCurrency(payment.amount, payment.currency)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Processing fee</dt>
                <dd className="tabular text-muted-foreground">Included</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-2.5 font-semibold">
                <dt>Total</dt>
                <dd className="tabular">
                  {formatCurrency(payment.amount, payment.currency, { withCode: true })}
                </dd>
              </div>
            </dl>

            <div className="text-muted-foreground mt-6 space-y-2 text-[12px]">
              <p className="flex items-center gap-2">
                <Lock className="size-3.5 shrink-0" />
                Encrypted checkout
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 shrink-0" />
                Secure payment — PCI DSS Level 1 (simulated)
              </p>
            </div>
          </div>
        </aside>

        {/* Payment panel */}
        <section className="min-w-0 flex-1">{children}</section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-5 text-[12px] sm:flex-row">
          <span className="inline-flex items-center gap-1.5">
            Powered by
            <PayFlowLogo showWordmark className="scale-90" />
            <Badge variant="warning" size="sm" className="ml-1">
              Sandbox
            </Badge>
          </span>
          <span>No real charges will be made.</span>
        </div>
      </footer>
    </div>
  )
}
