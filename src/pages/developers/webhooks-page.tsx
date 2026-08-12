import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, Send, Webhook, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { WebhookEvent, WebhookEventType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/misc'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { JsonViewer } from '@/components/common/json-viewer'
import { CopyButton } from '@/components/common/copy-button'
import { DetailList, DetailRow, EmptyState, SandboxBadge } from '@/components/common/misc'
import { usePaymentStore } from '@/stores/payment-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { ALL_WEBHOOK_EVENTS } from '@/data/merchant'
import { formatDateTime, formatDuration, formatShortDateTime, maskSecret } from '@/lib/format'
import { sleep } from '@/lib/utils'

const EVENT_DESCRIPTION: Record<WebhookEventType, string> = {
  'payment.created': 'A payment intent was created.',
  'payment.processing': 'The payment is being processed by the acquirer.',
  'payment.success': 'The payment was captured successfully.',
  'payment.failed': 'The payment was declined or failed.',
  'payment.cancelled': 'The customer abandoned or cancelled the payment.',
  'payment.refunded': 'A full or partial refund was completed.',
}

export function WebhooksPage() {
  const webhooks = usePaymentStore((state) => state.webhooks)
  const resendWebhook = usePaymentStore((state) => state.resendWebhook)
  const endpoint = useSettingsStore((state) => state.webhookEndpoint)
  const updateEndpoint = useSettingsStore((state) => state.updateWebhookEndpoint)
  const toggleEvent = useSettingsStore((state) => state.toggleWebhookEvent)
  const loading = useSimulatedLoading()

  const [selected, setSelected] = useState<WebhookEvent | null>(null)
  const [resending, setResending] = useState(false)
  const [secretRevealed, setSecretRevealed] = useState(false)

  const sorted = useMemo(
    () => [...webhooks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40),
    [webhooks],
  )

  const deliveryRate = useMemo(() => {
    if (webhooks.length === 0) return 100
    const delivered = webhooks.filter((event) => event.status === 'Delivered').length
    return (delivered / webhooks.length) * 100
  }, [webhooks])

  const handleResend = async (event: WebhookEvent) => {
    setResending(true)
    const pending = toast.loading('Sending…', { description: event.type })
    await sleep(1000)
    resendWebhook(event.id)
    setResending(false)
    toast.success('Delivered — HTTP 200', { id: pending, description: event.type })
    setSelected({
      ...event,
      status: 'Delivered',
      httpStatus: 200,
      attempts: event.attempts + 1,
      createdAt: new Date().toISOString(),
    })
  }

  const columns: Column<WebhookEvent>[] = [
    {
      id: 'event',
      header: 'Event',
      cell: (event) => (
        <div className="flex items-center gap-2.5">
          <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
            <Webhook className="size-3.5" />
          </span>
          <span className="font-mono text-[12.5px] font-medium">{event.type}</span>
        </div>
      ),
    },
    {
      id: 'transaction',
      header: 'Transaction',
      className: 'font-mono text-[12.5px]',
      cell: (event) => (
        <Link
          to={`/transactions/${event.transactionId}`}
          onClick={(clickEvent) => clickEvent.stopPropagation()}
          className="hover:text-primary hover:underline"
        >
          {event.transactionId}
        </Link>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (event) => (
        <Badge
          variant={
            event.status === 'Delivered' ? 'success' : event.status === 'Failed' ? 'danger' : 'warning'
          }
          size="sm"
        >
          {event.status === 'Delivered' ? (
            <CheckCircle2 />
          ) : event.status === 'Failed' ? (
            <XCircle />
          ) : (
            <Loader2 className="animate-spin" />
          )}
          {event.status}
        </Badge>
      ),
    },
    {
      id: 'http',
      header: 'HTTP Status',
      className: 'font-mono text-[12.5px]',
      cell: (event) => (
        <span className={event.httpStatus >= 400 ? 'text-danger' : 'text-success'}>
          {event.httpStatus}
        </span>
      ),
    },
    {
      id: 'duration',
      header: 'Duration',
      align: 'right',
      className: 'tabular text-muted-foreground text-[12.5px]',
      cell: (event) => formatDuration(event.durationMs),
    },
    {
      id: 'timestamp',
      header: 'Timestamp',
      className: 'text-muted-foreground text-[12.5px] whitespace-nowrap',
      cell: (event) => formatShortDateTime(event.createdAt),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhooks"
        description="PayFlow posts an event to your endpoint every time a payment changes state."
        badge={<SandboxBadge />}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Endpoint</CardTitle>
                <CardDescription>Where PayFlow delivers your events.</CardDescription>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-muted-foreground text-[12.5px]">
                  {endpoint.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <Switch
                  checked={endpoint.enabled}
                  onCheckedChange={(enabled) => {
                    updateEndpoint({ enabled })
                    toast.success(`Endpoint ${enabled ? 'enabled' : 'disabled'}`)
                  }}
                  aria-label="Toggle webhook endpoint"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="webhook-url" className="text-[13px] font-medium">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  value={endpoint.url}
                  onChange={(event) => updateEndpoint({ url: event.target.value })}
                  className="font-mono text-[12.5px]"
                />
                <CopyButton value={endpoint.url} label="Webhook URL copied" variant="outline" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium">Signing secret</label>
              <div className="bg-muted/50 flex items-center gap-2 rounded-md border p-2 pl-3">
                <code className="min-w-0 flex-1 truncate font-mono text-[12.5px]">
                  {secretRevealed ? endpoint.signingSecret : maskSecret(endpoint.signingSecret, 10)}
                </code>
                <Button variant="ghost" size="sm" onClick={() => setSecretRevealed((v) => !v)}>
                  {secretRevealed ? 'Hide' : 'Reveal'}
                </Button>
                <CopyButton value={endpoint.signingSecret} label="Signing secret copied" />
              </div>
              <p className="text-muted-foreground text-[12px]">
                Verify the <span className="font-mono">PayFlow-Signature</span> header against this
                secret to confirm an event came from PayFlow.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscribed events</CardTitle>
            <CardDescription>
              {endpoint.events.length} of {ALL_WEBHOOK_EVENTS.length} events enabled ·{' '}
              {deliveryRate.toFixed(0)}% delivered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {ALL_WEBHOOK_EVENTS.map((event) => (
              <div key={event} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[12.5px] font-medium">{event}</p>
                  <p className="text-muted-foreground text-[11.5px]">
                    {EVENT_DESCRIPTION[event]}
                  </p>
                </div>
                <Switch
                  checked={endpoint.events.includes(event)}
                  onCheckedChange={(enabled) => toggleEvent(event, enabled)}
                  aria-label={`Toggle ${event}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent deliveries</CardTitle>
          <CardDescription>
            Click any event to inspect its payload and replay the delivery.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="border-t">
            <DataTable
              columns={columns}
              rows={sorted}
              rowKey={(event) => event.id}
              loading={loading}
              onRowClick={(event) => setSelected(event)}
              empty={
                <EmptyState
                  icon={Webhook}
                  title="No webhook deliveries yet"
                  description="Complete a payment to generate your first event."
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-2xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{selected.type}</SheetTitle>
                <SheetDescription>
                  {selected.id} · {formatDateTime(selected.createdAt)}
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={selected.status === 'Delivered' ? 'success' : 'danger'}
                    size="lg"
                  >
                    {selected.status}
                  </Badge>
                  <Badge variant="secondary" size="lg" className="font-mono">
                    HTTP {selected.httpStatus}
                  </Badge>
                  <Badge variant="secondary" size="lg" className="tabular">
                    {formatDuration(selected.durationMs)}
                  </Badge>
                  <Badge variant="secondary" size="lg">
                    Attempt {selected.attempts}
                  </Badge>
                </div>

                <DetailList>
                  <DetailRow label="Endpoint" mono>
                    {selected.endpoint}
                  </DetailRow>
                  <DetailRow label="Transaction" mono>
                    <Link
                      to={`/transactions/${selected.transactionId}`}
                      onClick={() => setSelected(null)}
                      className="hover:text-primary hover:underline"
                    >
                      {selected.transactionId}
                    </Link>
                  </DetailRow>
                  <DetailRow label="Event ID" mono>
                    {selected.id}
                  </DetailRow>
                  <DetailRow label="Delivered at" mono>
                    {formatDateTime(selected.createdAt)}
                  </DetailRow>
                </DetailList>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-medium">Request payload</p>
                    <CopyButton
                      value={JSON.stringify(selected.payload, null, 2)}
                      label="Payload copied"
                      withText="Copy JSON"
                      variant="outline"
                    />
                  </div>
                  <JsonViewer value={selected.payload} maxHeight="26rem" />
                </div>

                <div>
                  <p className="mb-2 text-[13px] font-medium">Response</p>
                  <JsonViewer
                    value={
                      selected.httpStatus >= 400
                        ? { error: 'Endpoint unavailable', retryScheduled: true }
                        : { received: true }
                    }
                    maxHeight="8rem"
                  />
                </div>
              </SheetBody>

              <SheetFooter>
                <Button
                  className="flex-1"
                  loading={resending}
                  onClick={() => void handleResend(selected)}
                >
                  {!resending && <Send />}
                  {resending ? 'Sending…' : 'Resend Webhook'}
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
