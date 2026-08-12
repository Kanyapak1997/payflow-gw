import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Smartphone } from 'lucide-react'
import type { CurrencyCode } from '@/types'
import { Button } from '@/components/ui/button'
import { PromptPayMark } from '@/components/common/brand-marks'
import { QrCodeGraphic } from './qr-code'
import { DemoSimulationPanel } from './demo-simulation-panel'
import { formatCountdown, formatCurrency } from '@/lib/format'

const EXPIRY_SECONDS = 299

export function PromptPayPanel({
  paymentId,
  amount,
  currency,
  onBack,
  onSuccess,
  onFailure,
  onTimeout,
}: {
  paymentId: string
  amount: number
  currency: CurrencyCode
  onBack: () => void
  onSuccess: () => void
  onFailure: () => void
  onTimeout: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS)
  const expired = secondsLeft <= 0

  useEffect(() => {
    if (expired) return
    const timer = setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(timer)
  }, [expired])

  return (
    <div className="space-y-4">
      <div className="bg-card shadow-card rounded-xl border p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <PromptPayMark />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">PromptPay</p>
            <p className="text-muted-foreground text-[12.5px]">
              Scan the QR with your mobile banking application.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="relative rounded-xl border bg-white p-4 shadow-sm">
            <div className="size-52">
              <QrCodeGraphic value={paymentId} expired={expired} />
            </div>
            {expired && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                <span className="rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white">
                  QR expired
                </span>
              </div>
            )}
          </div>

          <p className="tabular mt-5 text-2xl font-semibold tracking-tight">
            {formatCurrency(amount, currency)}
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-[12px]">Ref {paymentId}</p>

          <div className="mt-5 flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">Expires in</span>
            <span
              className={`tabular rounded-md border px-2 py-0.5 font-mono font-semibold ${
                secondsLeft < 60
                  ? 'border-danger-border bg-danger-bg text-danger'
                  : 'border-border bg-muted'
              }`}
            >
              {formatCountdown(secondsLeft)}
            </span>
          </div>

          <div className="text-muted-foreground mt-4 flex items-center gap-2 text-[13px]">
            {expired ? (
              <span className="text-danger">Payment window closed</span>
            ) : (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Waiting for payment…
              </>
            )}
          </div>
        </div>

        <ol className="text-muted-foreground mt-6 space-y-1.5 border-t pt-5 text-[12.5px]">
          <li className="flex gap-2">
            <Smartphone className="mt-px size-3.5 shrink-0" />
            Open your mobile banking app and choose Scan.
          </li>
          <li className="pl-[22px]">Scan this QR and confirm the amount.</li>
          <li className="pl-[22px]">This page updates automatically once payment is received.</li>
        </ol>
      </div>

      <DemoSimulationPanel
        description="No bank is involved — trigger the outcome you want to demonstrate."
        actions={[
          { label: 'Simulate Success', onClick: onSuccess, tone: 'default' },
          { label: 'Simulate Failure', onClick: onFailure },
          { label: 'Simulate Timeout', onClick: onTimeout },
        ]}
      />

      <Button variant="ghost" className="w-full" onClick={onBack}>
        <ArrowLeft />
        Choose another payment method
      </Button>
    </div>
  )
}
