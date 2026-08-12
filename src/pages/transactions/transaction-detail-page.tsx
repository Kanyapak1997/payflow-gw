import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  FileQuestion,
  Mail,
  MoreHorizontal,
  RotateCcw,
  Send,
  Webhook,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/common/page-header'
import { CopyButton } from '@/components/common/copy-button'
import { DetailList, DetailRow, EmptyState } from '@/components/common/misc'
import { TransactionStatusBadge } from '@/components/common/status-badge'
import { PaymentMethodBadge } from '@/components/common/payment-method-badge'
import { PaymentTimeline } from '@/components/common/payment-timeline'
import { JsonSection } from '@/components/common/json-viewer'
import { RefundDialog } from '@/components/transactions/refund-dialog'
import {
  filterTransactionEvents,
  filterTransactionWebhooks,
  usePaymentStore,
} from '@/stores/payment-store'
import { CARD_BRAND_LABEL, isRefundable } from '@/lib/payment'
import { webhookData } from '@/lib/webhook'
import { formatCurrency, formatDateTime, formatRelative } from '@/lib/format'
import { copyToClipboard } from '@/lib/utils'

export function TransactionDetailPage() {
  const { transactionId = '' } = useParams()
  const navigate = useNavigate()
  const [refundOpen, setRefundOpen] = useState(false)

  const transaction = usePaymentStore((state) =>
    state.transactions.find((item) => item.id === transactionId),
  )
  const allEvents = usePaymentStore((state) => state.events)
  const allWebhooks = usePaymentStore((state) => state.webhooks)
  const allRefunds = usePaymentStore((state) => state.refunds)
  const resendWebhook = usePaymentStore((state) => state.resendWebhook)

  const events = useMemo(
    () => filterTransactionEvents(allEvents, transactionId),
    [allEvents, transactionId],
  )
  const webhooks = useMemo(
    () => filterTransactionWebhooks(allWebhooks, transactionId),
    [allWebhooks, transactionId],
  )
  const refunds = useMemo(
    () => allRefunds.filter((refund) => refund.transactionId === transactionId),
    [allRefunds, transactionId],
  )

  const apiRequest = useMemo(() => {
    if (!transaction) return null
    return {
      orderId: transaction.orderId,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      customer: {
        name: transaction.customerName,
        email: transaction.customerEmail,
        ...(transaction.customerPhone ? { phone: transaction.customerPhone } : {}),
      },
      paymentMethod: {
        type: transaction.paymentMethod.type,
        ...(transaction.paymentMethod.cardBrand
          ? {
              brand: transaction.paymentMethod.cardBrand,
              last4: transaction.paymentMethod.last4,
            }
          : {}),
      },
    }
  }, [transaction])

  const apiResponse = useMemo(() => {
    if (!transaction) return null
    return {
      transactionId: transaction.id,
      paymentId: transaction.paymentId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      ...(transaction.authorizationCode
        ? { authorizationCode: transaction.authorizationCode }
        : {}),
      responseCode: transaction.responseCode,
      responseMessage: transaction.responseMessage,
      ...(transaction.refundedAmount > 0 ? { refundedAmount: transaction.refundedAmount } : {}),
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      livemode: false,
    }
  }, [transaction])

  if (!transaction || !apiRequest || !apiResponse) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[{ label: 'Transactions', to: '/transactions' }, { label: transactionId }]}
          title="Transaction not found"
        />
        <Card>
          <EmptyState
            icon={FileQuestion}
            title="We couldn't find that transaction"
            description={`No transaction matches ${transactionId}.`}
            action={
              <Button asChild>
                <Link to="/transactions">
                  <ArrowLeft />
                  Back to transactions
                </Link>
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  const latestWebhook = webhooks[0]
  const netAmount = transaction.amount - transaction.refundedAmount

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Transactions', to: '/transactions' },
          { label: transaction.id },
        ]}
        title={<span className="font-mono">{transaction.id}</span>}
        badge={<TransactionStatusBadge status={transaction.status} size="lg" />}
        description={`${transaction.description ?? 'Payment'} · ${transaction.orderId}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={async () => {
                const ok = await copyToClipboard(transaction.id)
                toast[ok ? 'success' : 'error'](
                  ok ? 'Transaction ID copied' : 'Could not access the clipboard',
                )
              }}
            >
              <Copy />
              Copy Transaction ID
            </Button>

            {isRefundable(transaction.status) && netAmount > 0 && (
              <Button onClick={() => setRefundOpen(true)}>
                <RotateCcw />
                Refund
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onSelect={() =>
                    toast.success('Receipt sent', {
                      description: `A copy was emailed to ${transaction.customerEmail} (simulated).`,
                    })
                  }
                >
                  <Mail />
                  Email receipt to customer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    if (latestWebhook) {
                      resendWebhook(latestWebhook.id)
                      toast.success('Webhook resent — HTTP 200')
                    } else {
                      toast.error('No webhook events for this transaction')
                    }
                  }}
                >
                  <Send />
                  Resend latest webhook
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/developers/api-logs')}>
                  <ExternalLink />
                  View related API logs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    toast.success('Export queued', {
                      description: 'A PDF summary would be generated in production.',
                    })
                  }
                >
                  <Download />
                  Download summary
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {/* Summary */}
          <Card>
            <CardContent className="pt-5">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-muted-foreground text-[12px]">Amount</p>
                  <p className="tabular mt-1 text-2xl leading-none font-semibold tracking-tight">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  {transaction.refundedAmount > 0 && (
                    <p className="text-violet tabular mt-1.5 text-[12px]">
                      −{formatCurrency(transaction.refundedAmount, transaction.currency)} refunded
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-[12px]">Status</p>
                  <p className="mt-1.5 text-[15px] font-medium">
                    {transaction.status === 'SUCCESS'
                      ? 'Successful'
                      : transaction.status
                          .split('_')
                          .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
                          .join(' ')}
                  </p>
                  <p className="text-muted-foreground mt-1 text-[12px]">
                    {transaction.responseCode} · {transaction.responseMessage}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[12px]">Payment method</p>
                  <div className="mt-1.5">
                    <PaymentMethodBadge method={transaction.paymentMethod} />
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-[12px]">Created</p>
                  <p className="mt-1.5 text-[13.5px] font-medium">
                    {formatDateTime(transaction.createdAt)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-[12px]">
                    {formatRelative(transaction.createdAt)}
                  </p>
                </div>
              </div>

              {transaction.refundedAmount > 0 && (
                <>
                  <Separator className="my-5" />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-muted-foreground text-[12px]">Net captured</p>
                      <p className="tabular text-lg font-semibold">
                        {formatCurrency(netAmount, transaction.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-[12px]">
                        {refunds.length > 0
                          ? `${refunds.length} refund${refunds.length === 1 ? '' : 's'} on this payment`
                          : 'Refunded'}
                      </p>
                      <p className="text-violet tabular text-lg font-semibold">
                        {formatCurrency(transaction.refundedAmount, transaction.currency)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>
                Every state change PayFlow recorded for this payment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentTimeline events={events} />
            </CardContent>
          </Card>

          {/* Developer payloads */}
          <Card>
            <CardHeader>
              <CardTitle>Developer</CardTitle>
              <CardDescription>
                The exact payloads exchanged for this transaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <JsonSection
                title="API Request"
                description="POST /v1/payments"
                value={apiRequest}
                badge={
                  <Badge variant="secondary" size="sm" className="font-mono">
                    POST
                  </Badge>
                }
              />
              <JsonSection
                title="API Response"
                description={`HTTP ${transaction.status === 'FAILED' ? '402' : '200'}`}
                value={apiResponse}
                defaultOpen
                badge={
                  <Badge
                    variant={transaction.status === 'FAILED' ? 'danger' : 'success'}
                    size="sm"
                    className="font-mono"
                  >
                    {transaction.status === 'FAILED' ? '402' : '200'}
                  </Badge>
                }
              />
              <JsonSection
                title="Webhook Payload"
                description={latestWebhook?.type ?? 'payment.created'}
                value={
                  latestWebhook?.payload ?? {
                    event: 'payment.created',
                    createdAt: transaction.createdAt,
                    data: webhookData(transaction),
                  }
                }
                badge={
                  <Badge variant="info" size="sm" className="font-mono">
                    {latestWebhook?.type ?? 'payment.created'}
                  </Badge>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Technical information</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList>
                <DetailRow label="Merchant Order ID" mono>
                  <span className="flex items-center gap-1">
                    {transaction.orderId}
                    <CopyButton value={transaction.orderId} label="Order ID copied" />
                  </span>
                </DetailRow>
                <DetailRow label="Payment ID" mono>
                  <span className="flex items-center gap-1">
                    {transaction.paymentId}
                    <CopyButton value={transaction.paymentId} label="Payment ID copied" />
                  </span>
                </DetailRow>
                <DetailRow label="Transaction ID" mono>
                  <span className="flex items-center gap-1">
                    {transaction.id}
                    <CopyButton value={transaction.id} label="Transaction ID copied" />
                  </span>
                </DetailRow>
                <DetailRow label="Currency">{transaction.currency}</DetailRow>
                <DetailRow label="Payment Method">
                  {transaction.paymentMethod.label}
                </DetailRow>
                <DetailRow label="Card Brand">
                  {transaction.paymentMethod.cardBrand
                    ? CARD_BRAND_LABEL[transaction.paymentMethod.cardBrand]
                    : '—'}
                </DetailRow>
                <DetailRow label="Last 4 digits" mono>
                  {transaction.paymentMethod.last4 ?? '—'}
                </DetailRow>
                <DetailRow label="Authorization Code" mono>
                  {transaction.authorizationCode ?? '—'}
                </DetailRow>
                <DetailRow label="Response Code" mono>
                  {transaction.responseCode} — {transaction.responseMessage}
                </DetailRow>
                <DetailRow label="Created At" mono>
                  {formatDateTime(transaction.createdAt)}
                </DetailRow>
                <DetailRow label="Updated At" mono>
                  {formatDateTime(transaction.updatedAt)}
                </DetailRow>
                <DetailRow label="Mode">
                  <Badge variant="warning" size="sm">
                    Sandbox
                  </Badge>
                </DetailRow>
              </DetailList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList>
                <DetailRow label="Name">{transaction.customerName}</DetailRow>
                <DetailRow label="Email">{transaction.customerEmail}</DetailRow>
                {transaction.customerPhone && (
                  <DetailRow label="Phone">{transaction.customerPhone}</DetailRow>
                )}
                {transaction.customerId && (
                  <DetailRow label="Customer ID" mono>
                    {transaction.customerId}
                  </DetailRow>
                )}
              </DetailList>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link to={`/customers?customer=${transaction.customerId ?? ''}`}>
                  View customer
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Webhook events</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/developers/webhooks">All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <p className="text-muted-foreground py-2 text-[13px]">
                  No webhook deliveries yet.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {webhooks.slice(0, 4).map((event) => (
                    <li key={event.id} className="flex items-center gap-2.5">
                      <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
                        <Webhook className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[12.5px] font-medium">{event.type}</p>
                        <p className="text-muted-foreground text-[11.5px]">
                          {formatDateTime(event.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={event.status === 'Delivered' ? 'success' : 'danger'}
                        size="sm"
                        className="font-mono"
                      >
                        {event.httpStatus}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RefundDialog transaction={transaction} open={refundOpen} onOpenChange={setRefundOpen} />
    </div>
  )
}
