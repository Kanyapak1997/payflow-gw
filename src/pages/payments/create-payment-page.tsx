import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { CurrencyCode } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/misc'
import { PageHeader } from '@/components/common/page-header'
import { FormField } from '@/components/common/form-field'
import { SandboxBadge } from '@/components/common/misc'
import { usePaymentStore } from '@/stores/payment-store'
import { useSettingsStore } from '@/stores/settings-store'
import { CURRENCIES, CURRENCY_SYMBOL, formatCurrency } from '@/lib/format'
import { generateOrderId } from '@/lib/utils'

const schema = z.object({
  orderId: z
    .string()
    .trim()
    .min(3, 'Order ID must be at least 3 characters')
    .max(48, 'Order ID must be 48 characters or fewer'),
  amount: z
    .number({ message: 'Enter an amount' })
    .positive('Amount must be greater than zero')
    .max(10_000_000, 'Amount exceeds the sandbox limit'),
  currency: z.enum(['THB', 'USD', 'SGD', 'MYR']),
  description: z.string().trim().min(2, 'Add a short description').max(120, 'Keep it under 120 characters'),
  customerName: z.string().trim().min(2, 'Enter the customer name'),
  customerEmail: z.email('Enter a valid email address'),
  customerPhone: z
    .string()
    .trim()
    .max(24, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

const DEMO_VALUES: FormValues = {
  orderId: 'INV-20260812-001',
  amount: 2590,
  currency: 'THB',
  description: 'Premium Headphones',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+66 81 234 5678',
}

export function CreatePaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDemo = searchParams.get('demo') === '1'
  const createPayment = usePaymentStore((state) => state.createPayment)
  const defaultCurrency = useSettingsStore((state) => state.settings.defaultCurrency)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isDemo
      ? DEMO_VALUES
      : {
          orderId: generateOrderId(),
          amount: undefined as unknown as number,
          currency: defaultCurrency,
          description: '',
          customerName: '',
          customerEmail: '',
          customerPhone: '',
        },
  })

  useEffect(() => {
    if (isDemo) reset(DEMO_VALUES)
  }, [isDemo, reset])

  const amount = watch('amount')
  const currency = watch('currency')

  const onSubmit = async (values: FormValues) => {
    const payment = createPayment({
      orderId: values.orderId,
      amount: values.amount,
      currency: values.currency,
      description: values.description,
      customerName: values.customerName,
      customerEmail: values.customerEmail,
      customerPhone: values.customerPhone || undefined,
    })
    toast.success('Payment created', { description: `${payment.id} · ${values.orderId}` })
    navigate(`/payments/${payment.id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Payments', to: '/payments' },
          { label: 'Create payment' },
        ]}
        title="Create payment"
        description="Generate a payment and a hosted checkout link for your customer."
        badge={<SandboxBadge />}
      />

      {isDemo && (
        <div className="border-primary/25 bg-primary-subtle/70 flex items-start gap-3 rounded-lg border p-4">
          <Sparkles className="text-primary mt-0.5 size-4 shrink-0" />
          <p className="text-[13px]">
            <span className="font-medium">Guided demo.</span> The form is pre-filled with the demo
            order. Create the payment, then open the hosted checkout to pay it with the sandbox
            card.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Order details</CardTitle>
              <CardDescription>
                These values are echoed back to you on the transaction and every webhook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Order ID" required error={errors.orderId?.message}>
                  {(props) => (
                    <div className="flex gap-2">
                      <Input
                        {...props}
                        {...register('orderId')}
                        placeholder="INV-20260812-001"
                        className="font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Generate a new order ID"
                        onClick={() =>
                          setValue('orderId', generateOrderId(), { shouldValidate: true })
                        }
                      >
                        <RefreshCw />
                      </Button>
                    </div>
                  )}
                </FormField>

                <FormField
                  label="Description"
                  required
                  error={errors.description?.message}
                >
                  {(props) => (
                    <Input {...props} {...register('description')} placeholder="Premium Headphones" />
                  )}
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <FormField label="Amount" required error={errors.amount?.message}>
                  {(props) => (
                    <div className="relative">
                      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                        {CURRENCY_SYMBOL[currency]}
                      </span>
                      <Input
                        {...props}
                        {...register('amount', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="2590.00"
                        className="tabular pl-8"
                      />
                    </div>
                  )}
                </FormField>

                <FormField label="Currency" required error={errors.currency?.message}>
                  {(props) => (
                    <Controller
                      control={control}
                      name="currency"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value as CurrencyCode)}
                        >
                          <SelectTrigger id={props.id} aria-invalid={props['aria-invalid']}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>
                Used to pre-fill the checkout and to send the receipt. Fictional data only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Customer name" required error={errors.customerName?.message}>
                  {(props) => <Input {...props} {...register('customerName')} placeholder="John Doe" />}
                </FormField>
                <FormField label="Customer email" required error={errors.customerEmail?.message}>
                  {(props) => (
                    <Input
                      {...props}
                      {...register('customerEmail')}
                      type="email"
                      placeholder="john@example.com"
                    />
                  )}
                </FormField>
              </div>

              <FormField
                label="Customer phone"
                error={errors.customerPhone?.message}
                hint="Optional. Used for PromptPay and wallet notifications."
              >
                {(props) => (
                  <Input {...props} {...register('customerPhone')} placeholder="+66 81 234 5678" />
                )}
              </FormField>

              <FormField label="Internal note" hint="Not shown to the customer.">
                {(props) => (
                  <Textarea
                    {...props}
                    placeholder="Anything your team should know about this payment…"
                    rows={3}
                  />
                )}
              </FormField>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-muted-foreground text-[13px]">Amount</span>
                <span className="tabular text-xl font-semibold tracking-tight">
                  {Number.isFinite(amount) && amount > 0
                    ? formatCurrency(amount, currency)
                    : `${CURRENCY_SYMBOL[currency]}0.00`}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground text-[13px]">Currency</span>
                <span className="text-[13px] font-medium">{currency}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground text-[13px]">Environment</span>
                <SandboxBadge withTooltip={false} />
              </div>

              <Button type="submit" size="lg" className="mt-2 w-full" loading={isSubmitting}>
                Create Payment
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/payments')}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>

          <div className="text-muted-foreground space-y-2.5 rounded-lg border p-4 text-[12.5px]">
            <p className="text-foreground flex items-center gap-2 font-medium">
              <ShieldCheck className="text-success size-4" />
              Nothing real is charged
            </p>
            <p className="leading-relaxed">
              PayFlow is a frontend-only demonstration. Creating a payment generates mock API
              activity and a checkout link that lives entirely in this browser.
            </p>
            <p className="flex items-start gap-2 leading-relaxed">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Never enter real card or personal data.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
