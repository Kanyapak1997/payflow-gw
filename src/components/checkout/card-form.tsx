import { useMemo, useState } from 'react'
import { CreditCard, Info, Lock } from 'lucide-react'
import type { CurrencyCode } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/misc'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/common/form-field'
import { CardBrandMark } from '@/components/common/brand-marks'
import { DemoSimulationPanel } from './demo-simulation-panel'
import {
  SANDBOX,
  cvvLength,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  isExpiryValid,
  isLuhnValid,
} from '@/lib/payment'
import { formatCurrency } from '@/lib/format'

export interface CardFormValues {
  cardNumber: string
  holder: string
  expiry: string
  cvv: string
  saveCard: boolean
}

interface Errors {
  cardNumber?: string
  holder?: string
  expiry?: string
  cvv?: string
}

export function CardForm({
  amount,
  currency,
  defaultHolder,
  onSubmit,
}: {
  amount: number
  currency: CurrencyCode
  defaultHolder?: string
  onSubmit: (values: CardFormValues) => void
}) {
  const [cardNumber, setCardNumber] = useState('')
  const [holder, setHolder] = useState(defaultHolder?.toUpperCase() ?? '')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber])
  const maxCvv = cvvLength(brand)

  const validate = () => {
    const next: Errors = {}
    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length < 13) next.cardNumber = 'Enter the full card number'
    else if (!isLuhnValid(digits)) next.cardNumber = 'That card number is not valid'
    if (holder.trim().length < 2) next.holder = 'Enter the name printed on the card'
    if (!isExpiryValid(expiry)) next.expiry = 'Enter a valid future date'
    if (cvv.length < maxCvv) next.cvv = `${maxCvv} digits`
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    onSubmit({ cardNumber, holder, expiry, cvv, saveCard })
  }

  const fillTestCard = (number: string) => {
    setCardNumber(formatCardNumber(number))
    setHolder(defaultHolder?.toUpperCase() || 'JOHN DOE')
    setExpiry('12/29')
    setCvv('123')
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormField label="Card number" required error={errors.cardNumber}>
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              value={cardNumber}
              onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
              className="tabular h-11 pr-14 font-mono text-[15px] tracking-wide"
            />
            <span className="absolute top-1/2 right-2.5 -translate-y-1/2">
              {cardNumber ? (
                <CardBrandMark brand={brand} className="h-6 w-9" />
              ) : (
                <CreditCard className="text-muted-foreground size-4" />
              )}
            </span>
          </div>
        )}
      </FormField>

      <FormField label="Name on card" required error={errors.holder}>
        {(props) => (
          <Input
            {...props}
            value={holder}
            onChange={(event) => setHolder(event.target.value.toUpperCase())}
            placeholder="JOHN DOE"
            autoComplete="cc-name"
            className="h-11 tracking-wide uppercase"
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Expiry date" required error={errors.expiry}>
          {(props) => (
            <Input
              {...props}
              value={expiry}
              onChange={(event) => setExpiry(formatExpiry(event.target.value))}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              className="tabular h-11 font-mono"
            />
          )}
        </FormField>

        <FormField label="CVV" required error={errors.cvv}>
          {(props) => (
            <div className="relative">
              <Input
                {...props}
                value={cvv}
                onChange={(event) =>
                  setCvv(event.target.value.replace(/\D/g, '').slice(0, maxCvv))
                }
                placeholder={'•'.repeat(maxCvv)}
                inputMode="numeric"
                autoComplete="cc-csc"
                className="tabular h-11 pr-9 font-mono"
              />
              <Lock className="text-muted-foreground absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
            </div>
          )}
        </FormField>
      </div>

      <div className="flex items-start gap-2.5">
        <Checkbox
          id="save-card"
          checked={saveCard}
          onCheckedChange={(checked) => setSaveCard(checked === true)}
          className="mt-0.5"
        />
        <div>
          <Label htmlFor="save-card" className="font-normal">
            Save card securely for future payments
          </Label>
          <p className="text-muted-foreground mt-0.5 text-[12px]">
            Nothing is stored — this checkbox is part of the simulation.
          </p>
        </div>
      </div>

      <Button type="submit" size="xl" className="w-full">
        <Lock className="size-4" />
        Pay {formatCurrency(amount, currency)}
      </Button>

      <p className="text-muted-foreground flex items-start gap-2 text-[12px] leading-relaxed">
        <Info className="mt-px size-3.5 shrink-0" />
        Your card details are never sent anywhere. PayFlow's demo checkout runs entirely in your
        browser.
      </p>

      <DemoSimulationPanel
        description={
          <>
            Use the sandbox card <span className="font-mono font-medium">{SANDBOX.successCard}</span>{' '}
            with any future expiry and any CVV. Cards starting with{' '}
            <span className="font-mono font-medium">4000</span> always decline.
          </>
        }
        actions={[
          { label: 'Fill approved card', onClick: () => fillTestCard(SANDBOX.successCard), tone: 'default' },
          { label: 'Fill declining card', onClick: () => fillTestCard(SANDBOX.declineCard) },
        ]}
      />
    </form>
  )
}
