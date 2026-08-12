import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import type { CurrencyCode, InstallmentBank } from '@/types'
import { Button } from '@/components/ui/button'
import { BankMark } from '@/components/common/brand-marks'
import { DemoSimulationPanel } from './demo-simulation-panel'
import { BANK_LABEL, INSTALLMENT_PLANS, installmentQuote } from '@/lib/payment'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

const BANKS: InstallmentBank[] = ['kbank', 'scb', 'krungsri', 'ktc']

export function InstallmentPanel({
  amount,
  currency,
  onBack,
  onContinue,
  onDecline,
}: {
  amount: number
  currency: CurrencyCode
  onBack: () => void
  onContinue: (bank: InstallmentBank, months: number) => void
  onDecline: (bank: InstallmentBank, months: number) => void
}) {
  const [bank, setBank] = useState<InstallmentBank>('kbank')
  const [months, setMonths] = useState(INSTALLMENT_PLANS[0].months)

  const plan = INSTALLMENT_PLANS.find((item) => item.months === months) ?? INSTALLMENT_PLANS[0]
  const quote = installmentQuote(amount, plan)

  return (
    <div className="space-y-4">
      <div className="bg-card shadow-card rounded-xl border p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold">Pay in installments</p>
            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
              Split your purchase into monthly payments.
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-[12px]">Purchase amount</p>
            <p className="tabular text-lg font-semibold tracking-tight">
              {formatCurrency(amount, currency)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[13px] font-medium">Choose your bank</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {BANKS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBank(option)}
                aria-pressed={bank === option}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-3 transition-all outline-none',
                  bank === option
                    ? 'border-primary bg-primary-subtle/60 ring-primary/20 ring-2'
                    : 'hover:border-primary/50',
                )}
              >
                <BankMark bank={option} />
                <span className="text-[12.5px] font-medium">{BANK_LABEL[option]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[13px] font-medium">Choose your plan</p>
          <div className="mt-2.5 space-y-2.5">
            {INSTALLMENT_PLANS.map((option) => {
              const optionQuote = installmentQuote(amount, option)
              const active = months === option.months
              return (
                <button
                  key={option.months}
                  type="button"
                  onClick={() => setMonths(option.months)}
                  aria-pressed={active}
                  className={cn(
                    'flex w-full items-center gap-3.5 rounded-lg border p-3.5 text-left transition-all outline-none',
                    active ? 'border-primary bg-primary-subtle/50' : 'hover:border-primary/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full border',
                      active ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                    )}
                  >
                    {active && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium">{option.months} months</span>
                    <span className="text-muted-foreground block text-[12px]">
                      {option.interestRate === 0
                        ? 'Interest-free'
                        : `${formatPercent(option.interestRate, 1)} p.a. interest`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="tabular block text-[15px] font-semibold">
                      {formatCurrency(optionQuote.monthly, currency)}
                    </span>
                    <span className="text-muted-foreground block text-[11.5px]">per month</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <dl className="mt-6 space-y-2 border-t pt-5 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Interest rate</dt>
            <dd className="tabular">
              {plan.interestRate === 0 ? '0% (interest-free)' : `${formatPercent(plan.interestRate, 1)} p.a.`}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Monthly payment</dt>
            <dd className="tabular">{formatCurrency(quote.monthly, currency)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t pt-2 font-semibold">
            <dt>Total amount</dt>
            <dd className="tabular">{formatCurrency(quote.total, currency)}</dd>
          </div>
        </dl>

        <Button size="xl" className="mt-5 w-full" onClick={() => onContinue(bank, months)}>
          Continue with Installment
        </Button>

        <p className="text-muted-foreground mt-3 text-center text-[12px]">
          Your bank will confirm the plan before the payment is captured.
        </p>
      </div>

      <DemoSimulationPanel
        description="The bank's decision is simulated — approve it, or force a decline to show the failure path."
        actions={[{ label: 'Simulate bank decline', onClick: () => onDecline(bank, months) }]}
      />

      <Button variant="ghost" className="w-full" onClick={onBack}>
        <ArrowLeft />
        Choose another payment method
      </Button>
    </div>
  )
}
