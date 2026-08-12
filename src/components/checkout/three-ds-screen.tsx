import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Landmark, ShieldCheck } from 'lucide-react'
import type { CurrencyCode } from '@/types'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/misc'
import { SANDBOX } from '@/lib/payment'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6
const MAX_ATTEMPTS = 3

/**
 * Mock issuer ACS page. Visually separated from the merchant checkout the way a
 * real 3-D Secure step-up is, so the hand-off reads correctly.
 */
export function ThreeDSecureScreen({
  amount,
  currency,
  merchantName,
  cardLast4,
  onVerified,
  onCancel,
  onFailed,
}: {
  amount: number
  currency: CurrencyCode
  merchantName: string
  cardLast4: string
  onVerified: () => void
  onCancel: () => void
  onFailed: () => void
}) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(180)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((value) => value - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const otp = digits.join('')

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '')
    setError(null)
    if (clean.length > 1) {
      // Paste of a full code
      const next = clean.slice(0, OTP_LENGTH).split('')
      setDigits(Array.from({ length: OTP_LENGTH }, (_, i) => next[i] ?? ''))
      inputs.current[Math.min(next.length, OTP_LENGTH - 1)]?.focus()
      return
    }
    setDigits((prev) => {
      const next = [...prev]
      next[index] = clean
      return next
    })
    if (clean && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const verify = (event: React.FormEvent) => {
    event.preventDefault()
    if (otp.length < OTP_LENGTH) {
      setError('Enter the 6-digit code.')
      return
    }

    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      if (otp === SANDBOX.otp) {
        onVerified()
        return
      }
      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputs.current[0]?.focus()
      if (nextAttempts >= MAX_ATTEMPTS) {
        onFailed()
      } else {
        setError(
          `Incorrect one-time password. ${MAX_ATTEMPTS - nextAttempts} attempt${
            MAX_ATTEMPTS - nextAttempts === 1 ? '' : 's'
          } remaining.`,
        )
      }
    }, 550)
  }

  return (
    <div className="bg-card shadow-card overflow-hidden rounded-xl border">
      {/* Issuer chrome — deliberately not PayFlow branded */}
      <div className="flex items-center gap-3 border-b bg-slate-900 px-5 py-4 dark:bg-slate-800">
        <span className="flex size-9 items-center justify-center rounded-md bg-white/10">
          <Landmark className="size-4.5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-white">Secure Authentication</p>
          <p className="text-[12px] text-slate-300">Demo Bank · 3-D Secure 2.2</p>
        </div>
        <ShieldCheck className="size-5 shrink-0 text-emerald-400" />
      </div>

      <div className="p-5 sm:p-6">
        <dl className="space-y-2.5 text-[13px]">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Merchant</dt>
            <dd className="font-medium">{merchantName}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Card</dt>
            <dd className="font-mono">•••• {cardLast4}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="tabular font-semibold">{formatCurrency(amount, currency)}</dd>
          </div>
        </dl>

        <Separator className="my-5" />

        <form onSubmit={verify}>
          <p className="text-[13.5px] font-medium">Enter one-time password</p>
          <p className="text-muted-foreground mt-1 text-[12.5px]">
            We sent a 6-digit code to the mobile number ending 5678.
          </p>

          <div className="mt-4 flex gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputs.current[index] = element
                }}
                value={digit}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={`Digit ${index + 1}`}
                maxLength={OTP_LENGTH}
                className={cn(
                  'tabular border-input bg-background focus-visible:border-ring focus-visible:ring-ring/25 h-12 w-full rounded-md border text-center font-mono text-lg shadow-xs transition-[color,box-shadow,border-color] outline-none focus-visible:ring-[3px]',
                  error && 'border-destructive',
                )}
              />
            ))}
          </div>

          {error && (
            <p className="text-destructive mt-2.5 flex items-center gap-1.5 text-[12.5px]">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </p>
          )}

          <p className="text-muted-foreground mt-3 text-[12px]">
            {secondsLeft > 0 ? (
              <>
                Code expires in{' '}
                <span className="tabular font-medium">
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </span>
              </>
            ) : (
              'This code has expired. Request a new one to continue.'
            )}
          </p>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="sm:flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="sm:flex-1" loading={verifying}>
              Verify
            </Button>
          </div>
        </form>

        <div className="border-warning-border bg-warning-bg/60 mt-5 rounded-lg border border-dashed p-3">
          <p className="text-[12.5px]">
            For demo purposes, use OTP{' '}
            <span className="bg-background rounded border px-1.5 py-0.5 font-mono font-semibold">
              {SANDBOX.otp}
            </span>{' '}
            — any other code fails authentication.
          </p>
        </div>
      </div>
    </div>
  )
}
