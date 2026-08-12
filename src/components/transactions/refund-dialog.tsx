import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import type { Transaction } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/misc'
import { FormField } from '@/components/common/form-field'
import { usePaymentStore } from '@/stores/payment-store'
import { CURRENCY_SYMBOL, formatCurrency } from '@/lib/format'
import { sleep } from '@/lib/utils'

const REASONS = [
  'Customer requested refund',
  'Duplicate payment',
  'Item out of stock',
  'Order cancelled',
  'Fraudulent transaction',
  'Other',
]

export function RefundDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const refundTransaction = usePaymentStore((state) => state.refundTransaction)
  const refundable = transaction.amount - transaction.refundedAmount

  const [amount, setAmount] = useState(String(refundable))
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (open) {
      setAmount(String(refundable))
      setReason(REASONS[0])
      setNote('')
      setError(null)
      setProcessing(false)
    }
  }, [open, refundable])

  const parsed = Number(amount)
  const isFullRefund = useMemo(
    () => Number.isFinite(parsed) && Math.abs(parsed - refundable) < 0.005,
    [parsed, refundable],
  )

  const submit = async () => {
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a refund amount greater than zero.')
      return
    }
    if (parsed > refundable + 0.005) {
      setError(`You can refund at most ${formatCurrency(refundable, transaction.currency)}.`)
      return
    }

    setError(null)
    setProcessing(true)
    // Mirrors the acquirer round-trip a real refund would make.
    await sleep(1200)

    const updated = refundTransaction(
      transaction.id,
      parsed,
      note.trim() ? `${reason} — ${note.trim()}` : reason,
    )
    setProcessing(false)
    onOpenChange(false)

    toast.success('Refund completed successfully.', {
      description: `${formatCurrency(parsed, transaction.currency)} returned · ${
        updated?.status === 'REFUNDED' ? 'REFUNDED' : 'PARTIALLY REFUNDED'
      }`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !processing && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refund payment</DialogTitle>
          <DialogDescription>
            Funds are returned to the original payment method. Refunds cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 space-y-2 rounded-lg border p-3.5 text-[13px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Original payment</span>
              <span className="tabular font-medium">
                {formatCurrency(transaction.amount, transaction.currency)}
              </span>
            </div>
            {transaction.refundedAmount > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Already refunded</span>
                <span className="tabular text-violet font-medium">
                  −{formatCurrency(transaction.refundedAmount, transaction.currency)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Available to refund</span>
              <span className="tabular font-semibold">
                {formatCurrency(refundable, transaction.currency)}
              </span>
            </div>
          </div>

          <FormField label="Refund amount" required>
            {(props) => (
              <div className="space-y-2">
                <div className="relative">
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    {CURRENCY_SYMBOL[transaction.currency]}
                  </span>
                  <Input
                    {...props}
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value)
                      setError(null)
                    }}
                    type="number"
                    step="0.01"
                    min="0"
                    max={refundable}
                    inputMode="decimal"
                    className="tabular pl-8"
                    disabled={processing}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={processing}
                    onClick={() => setAmount(String(refundable))}
                  >
                    Full amount
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={processing}
                    onClick={() => setAmount(String(Math.round(refundable / 2)))}
                  >
                    Half
                  </Button>
                </div>
              </div>
            )}
          </FormField>

          <FormField label="Refund reason" required>
            {(props) => (
              <Select value={reason} onValueChange={setReason} disabled={processing}>
                <SelectTrigger id={props.id}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormField label="Internal note" hint="Stored on the refund, not shown to the customer.">
            {(props) => (
              <Textarea
                {...props}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Optional context for your team…"
                disabled={processing}
              />
            )}
          </FormField>

          {error && (
            <p className="text-destructive flex items-center gap-1.5 text-[12.5px]">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <p className="text-muted-foreground text-[12px]">
            This transaction will become{' '}
            <span className="text-foreground font-medium">
              {isFullRefund ? 'REFUNDED' : 'PARTIALLY REFUNDED'}
            </span>{' '}
            and a <span className="font-mono">payment.refunded</span> webhook will be sent.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={submit} loading={processing}>
            {!processing && <RotateCcw />}
            {processing ? 'Processing refund…' : 'Process Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
