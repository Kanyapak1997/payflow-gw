import { useState } from 'react'
import { ArrowLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import type { CurrencyCode, WalletProvider } from '@/types'
import { Button } from '@/components/ui/button'
import { WalletMark } from '@/components/common/brand-marks'
import { DemoSimulationPanel } from './demo-simulation-panel'
import { WALLET_LABEL } from '@/lib/payment'
import { formatCurrency } from '@/lib/format'
import { sleep } from '@/lib/utils'

const WALLETS: { id: WalletProvider; description: string }[] = [
  { id: 'truemoney', description: 'Pay with your TrueMoney balance' },
  { id: 'linepay', description: 'Approve in the LINE app' },
  { id: 'shopeepay', description: 'Pay with ShopeePay balance or linked card' },
]

export function WalletPanel({
  amount,
  currency,
  merchantName,
  onBack,
  onApprove,
  onReject,
}: {
  amount: number
  currency: CurrencyCode
  merchantName: string
  onBack: () => void
  onApprove: (wallet: WalletProvider) => void
  onReject: (wallet: WalletProvider) => void
}) {
  const [selected, setSelected] = useState<WalletProvider | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const choose = async (wallet: WalletProvider) => {
    setSelected(wallet)
    setRedirecting(true)
    await sleep(900)
    setRedirecting(false)
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <div className="bg-card shadow-card rounded-xl border p-5 sm:p-6">
          <p className="text-[15px] font-semibold">Choose your wallet</p>
          <p className="text-muted-foreground mt-1 text-[12.5px]">
            You'll be redirected to approve the payment.
          </p>

          <div className="mt-5 space-y-2.5">
            {WALLETS.map((wallet) => (
              <button
                key={wallet.id}
                type="button"
                onClick={() => choose(wallet.id)}
                className="hover:border-primary/60 focus-visible:border-primary focus-visible:ring-ring/25 flex w-full items-center gap-3.5 rounded-lg border p-3.5 text-left transition-all outline-none focus-visible:ring-[3px]"
              >
                <WalletMark wallet={wallet.id} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">{WALLET_LABEL[wallet.id]}</span>
                  <span className="text-muted-foreground block text-[12px]">
                    {wallet.description}
                  </span>
                </span>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <Button variant="ghost" className="w-full" onClick={onBack}>
          <ArrowLeft />
          Choose another payment method
        </Button>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="bg-card shadow-card flex flex-col items-center rounded-xl border px-6 py-16 text-center">
        <WalletMark wallet={selected} className="size-12 rounded-xl text-[15px]" />
        <p className="mt-5 flex items-center gap-2 text-[15px] font-medium">
          <Loader2 className="size-4 animate-spin" />
          Redirecting to {WALLET_LABEL[selected]}…
        </p>
        <p className="text-muted-foreground mt-1 text-[13px]">
          Keep this window open while we hand you over.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mock wallet application screen */}
      <div className="bg-card shadow-card overflow-hidden rounded-xl border">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <WalletMark wallet={selected} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">{WALLET_LABEL[selected]}</p>
            <p className="text-muted-foreground text-[12px]">Payment request</p>
          </div>
          <ExternalLink className="text-muted-foreground size-4 shrink-0" />
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-muted-foreground text-[13px]">{merchantName} is requesting</p>
          <p className="tabular mt-1.5 text-3xl font-semibold tracking-tight">
            {formatCurrency(amount, currency)}
          </p>

          <dl className="mt-5 space-y-2 border-t pt-4 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Wallet balance</dt>
              <dd className="tabular">{formatCurrency(48250, currency)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Balance after payment</dt>
              <dd className="tabular">{formatCurrency(Math.max(0, 48250 - amount), currency)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => onReject(selected)}
            >
              Reject Payment
            </Button>
            <Button className="sm:flex-1" onClick={() => onApprove(selected)}>
              Approve Payment
            </Button>
          </div>
        </div>
      </div>

      <DemoSimulationPanel description="Approve completes the payment; Reject returns a declined transaction." />

      <Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>
        <ArrowLeft />
        Choose a different wallet
      </Button>
    </div>
  )
}
