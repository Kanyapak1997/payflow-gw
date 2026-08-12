import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileQuestion,
  Plus,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/misc'
import { PageHeader } from '@/components/common/page-header'
import { CopyButton } from '@/components/common/copy-button'
import { DetailList, DetailRow, EmptyState, SandboxBadge } from '@/components/common/misc'
import { TransactionStatusBadge } from '@/components/common/status-badge'
import { JsonSection } from '@/components/common/json-viewer'
import { usePaymentStore } from '@/stores/payment-store'
import { formatCurrency, formatDateTime } from '@/lib/format'

export function PaymentCreatedPage() {
  const { paymentId = '' } = useParams()
  const navigate = useNavigate()
  const payment = usePaymentStore((state) =>
    state.payments.find((item) => item.id === paymentId),
  )

  if (!payment) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[{ label: 'Payments', to: '/payments' }, { label: paymentId }]}
          title="Payment not found"
        />
        <Card>
          <EmptyState
            icon={FileQuestion}
            title="We couldn't find that payment"
            description={`No payment matches ${paymentId} in this browser session. Payments created in the demo live in local storage only.`}
            action={
              <Button onClick={() => navigate('/payments/create')}>
                <Plus />
                Create a payment
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  const checkoutUrl = `https://payflow.demo/pay/${payment.id}`
  const paid = Boolean(payment.transactionId)

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Payments', to: '/payments' }, { label: payment.id }]}
        title="Payment created successfully"
        description="Share the payment link with your customer, or open the hosted checkout yourself to simulate the payment."
        badge={<SandboxBadge />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start gap-3.5">
                <span className="bg-success-bg text-success border-success-border flex size-10 shrink-0 items-center justify-center rounded-full border">
                  <CheckCircle2 className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">
                    {payment.description || 'Payment'}
                  </p>
                  <p className="text-muted-foreground font-mono text-[12.5px]">
                    {payment.orderId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular text-2xl leading-none font-semibold tracking-tight">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-[12px]">{payment.currency}</p>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="space-y-2">
                <p className="text-[13px] font-medium">Payment link</p>
                <div className="bg-muted/50 flex items-center gap-2 rounded-md border p-2 pl-3">
                  <code className="min-w-0 flex-1 truncate font-mono text-[12.5px]">
                    {checkoutUrl}
                  </code>
                  <CopyButton value={checkoutUrl} label="Payment link copied" withText="Copy" variant="outline" />
                </div>
                <p className="text-muted-foreground text-[12px]">
                  In the demo this link opens the hosted checkout inside this app.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => navigate(`/pay/${payment.id}`)}>
                  <CreditCard />
                  Open Checkout
                </Button>
                {paid ? (
                  <Button variant="outline" asChild>
                    <Link to={`/transactions/${payment.transactionId}`}>
                      <Receipt />
                      View Transaction
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    <Receipt />
                    View Transaction
                  </Button>
                )}
                <Button variant="ghost" onClick={() => navigate('/payments/create')}>
                  <Plus />
                  Create Another Payment
                </Button>
              </div>

              {!paid && (
                <p className="text-muted-foreground mt-3 text-[12px]">
                  The transaction appears once the customer completes checkout.
                </p>
              )}
            </CardContent>
          </Card>

          <JsonSection
            title="API Response"
            description="POST /v1/payments"
            defaultOpen
            value={{
              paymentId: payment.id,
              orderId: payment.orderId,
              status: payment.status,
              amount: payment.amount,
              currency: payment.currency,
              description: payment.description,
              checkoutUrl,
              customer: {
                name: payment.customerName,
                email: payment.customerEmail,
                ...(payment.customerPhone ? { phone: payment.customerPhone } : {}),
              },
              livemode: false,
              createdAt: payment.createdAt,
            }}
          />
        </div>

        <Card className="lg:sticky lg:top-24 lg:self-start">
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium">Payment details</p>
              <TransactionStatusBadge status={payment.status} size="sm" />
            </div>
            <DetailList>
              <DetailRow label="Payment ID" mono>
                <span className="flex items-center gap-1">
                  {payment.id}
                  <CopyButton value={payment.id} label="Payment ID copied" />
                </span>
              </DetailRow>
              <DetailRow label="Order ID" mono>
                {payment.orderId}
              </DetailRow>
              <DetailRow label="Amount">
                {formatCurrency(payment.amount, payment.currency, { withCode: true })}
              </DetailRow>
              <DetailRow label="Customer">
                <span className="block">{payment.customerName}</span>
                <span className="text-muted-foreground block">{payment.customerEmail}</span>
              </DetailRow>
              {payment.customerPhone && (
                <DetailRow label="Phone">{payment.customerPhone}</DetailRow>
              )}
              <DetailRow label="Created">{formatDateTime(payment.createdAt)}</DetailRow>
            </DetailList>

            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link to="/payments">
                All payments
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="mt-1 w-full" asChild>
              <a href={`/pay/${payment.id}`} target="_blank" rel="noreferrer">
                <ExternalLink />
                Open checkout in a new tab
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
