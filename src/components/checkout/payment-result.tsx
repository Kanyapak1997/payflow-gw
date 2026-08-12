import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CheckCircle2, Clock, Printer, Receipt, RotateCcw, XCircle } from 'lucide-react'
import type { Payment } from '@/types'
import type { CheckoutResult } from '@/stores/checkout-store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/misc'
import { PaymentMethodBadge } from '@/components/common/payment-method-badge'
import { CopyButton } from '@/components/common/copy-button'
import { PayFlowLogo } from '@/components/common/brand-marks'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { useSettingsStore } from '@/stores/settings-store'
import { cn } from '@/lib/utils'

const PRESENTATION = {
  SUCCESS: {
    icon: CheckCircle2,
    title: 'Payment Successful',
    tone: 'bg-success-bg text-success border-success-border',
    body: 'A receipt has been sent to your email address.',
  },
  PENDING: {
    icon: Clock,
    title: 'Payment Pending',
    tone: 'bg-warning-bg text-warning border-warning-border',
    body: "We haven't received your transfer yet. This page will update once the bank confirms it.",
  },
  FAILED: {
    icon: XCircle,
    title: 'Payment Failed',
    tone: 'bg-danger-bg text-danger border-danger-border',
    body: "We couldn't process your payment.",
  },
  CANCELLED: {
    icon: Ban,
    title: 'Payment Cancelled',
    tone: 'bg-neutral-bg text-neutral border-neutral-border',
    body: 'No charge has been made.',
  },
} as const

export function PaymentResult({
  payment,
  result,
  onRetry,
  onChooseAnother,
}: {
  payment: Payment
  result: CheckoutResult
  onRetry: () => void
  onChooseAnother: () => void
}) {
  const [receiptOpen, setReceiptOpen] = useState(false)
  const settings = useSettingsStore((state) => state.settings)
  const presentation = PRESENTATION[result.status]
  const Icon = presentation.icon

  return (
    <div className="bg-card shadow-card rounded-xl border p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span
          className={cn(
            'flex size-14 items-center justify-center rounded-full border',
            presentation.tone,
          )}
        >
          <Icon className="size-7" />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">{presentation.title}</h2>
        <p className="tabular mt-2 text-3xl font-semibold tracking-tight">
          {formatCurrency(payment.amount, payment.currency)}
        </p>
        <p className="text-muted-foreground mt-2 max-w-sm text-[13px]">{presentation.body}</p>

        {result.status === 'FAILED' && (
          <div className="border-danger-border bg-danger-bg text-danger mt-4 w-full rounded-lg border px-3.5 py-2.5 text-left text-[12.5px]">
            <p className="font-medium">Response {result.responseCode}</p>
            <p className="mt-0.5">{result.responseMessage}</p>
          </div>
        )}
      </div>

      <dl className="mt-7 space-y-3 border-t pt-6 text-[13px]">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Transaction</dt>
          <dd className="flex items-center gap-1 font-mono font-medium">
            {result.transactionId}
            <CopyButton value={result.transactionId} label="Transaction ID copied" />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Order</dt>
          <dd className="font-mono">{payment.orderId}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Payment method</dt>
          <dd>
            <PaymentMethodBadge method={result.method} compact />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Merchant</dt>
          <dd>{settings.checkoutDisplayName}</dd>
        </div>
      </dl>

      <div className="mt-7 space-y-2">
        {result.status === 'SUCCESS' && (
          <>
            <Button size="lg" className="w-full" onClick={() => setReceiptOpen(true)}>
              <Receipt />
              View Receipt
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="sm:flex-1" asChild>
                <Link to="/dashboard">Return to Merchant</Link>
              </Button>
              <Button variant="outline" className="sm:flex-1" asChild>
                <Link to={`/transactions/${result.transactionId}`}>View Transaction</Link>
              </Button>
            </div>
          </>
        )}

        {result.status === 'FAILED' && (
          <>
            <Button size="lg" className="w-full" onClick={onRetry}>
              <RotateCcw />
              Try Again
            </Button>
            <Button variant="outline" className="w-full" onClick={onChooseAnother}>
              Choose Another Payment Method
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link to={`/transactions/${result.transactionId}`}>View transaction in dashboard</Link>
            </Button>
          </>
        )}

        {result.status === 'CANCELLED' && (
          <>
            <Button size="lg" className="w-full" onClick={onChooseAnother}>
              Return to Checkout
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link to={`/transactions/${result.transactionId}`}>View transaction in dashboard</Link>
            </Button>
          </>
        )}

        {result.status === 'PENDING' && (
          <>
            <Button size="lg" className="w-full" onClick={onChooseAnother}>
              Pay another way
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to={`/transactions/${result.transactionId}`}>View Transaction</Link>
            </Button>
          </>
        )}
      </div>

      <p className="text-muted-foreground mt-6 text-center text-[11.5px]">
        Sandbox payment — no money moved. Reference {payment.id}.
      </p>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              {settings.checkoutDisplayName} · {formatDateTime(new Date())}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold">{settings.businessName}</p>
                <p className="text-muted-foreground text-[12px]">{settings.supportEmail}</p>
              </div>
              <PayFlowLogo showWordmark={false} />
            </div>

            <Separator className="my-4" />

            <dl className="space-y-2 text-[12.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Description</dt>
                <dd>{payment.description}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Order</dt>
                <dd className="font-mono">{payment.orderId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Transaction</dt>
                <dd className="font-mono">{result.transactionId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Method</dt>
                <dd>{result.method.label}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Statement descriptor</dt>
                <dd className="font-mono">{settings.statementDescriptor}</dd>
              </div>
            </dl>

            <Separator className="my-4" />

            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] font-medium">Total paid</span>
              <span className="tabular text-lg font-semibold">
                {formatCurrency(payment.amount, payment.currency, { withCode: true })}
              </span>
            </div>

            <p className="text-muted-foreground mt-4 text-center text-[11px]">
              This is a simulated receipt issued by PayFlow Sandbox.
            </p>
          </div>

          <Button variant="outline" onClick={() => window.print()}>
            <Printer />
            Print receipt
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
