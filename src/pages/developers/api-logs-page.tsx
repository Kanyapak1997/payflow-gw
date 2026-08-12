import { useMemo, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import type { ApiLog } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { JsonViewer } from '@/components/common/json-viewer'
import { CopyButton } from '@/components/common/copy-button'
import { EmptyState, SandboxBadge } from '@/components/common/misc'
import { usePaymentStore } from '@/stores/payment-store'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { formatDateTime, formatDuration, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const METHOD_VARIANT: Record<ApiLog['method'], 'info' | 'success' | 'warning' | 'danger'> = {
  GET: 'info',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'danger',
}

function statusTone(status: number) {
  if (status >= 500) return 'text-danger'
  if (status >= 400) return 'text-warning'
  return 'text-success'
}

function HeaderTable({ headers }: { headers: Record<string, string> }) {
  return (
    <dl className="divide-y rounded-md border font-mono text-[12px]">
      {Object.entries(headers).map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3 px-3 py-2">
          <dt className="text-muted-foreground truncate">{key}</dt>
          <dd className="break-all">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ApiLogsPage() {
  const apiLogs = usePaymentStore((state) => state.apiLogs)
  const loading = useSimulatedLoading()

  const [query, setQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<ApiLog['method'] | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all')
  const [selected, setSelected] = useState<ApiLog | null>(null)

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return [...apiLogs]
      .filter((log) => {
        if (methodFilter !== 'all' && log.method !== methodFilter) return false
        if (statusFilter === 'success' && log.status >= 400) return false
        if (statusFilter === 'error' && log.status < 400) return false
        if (term && !`${log.endpoint} ${log.id} ${log.method}`.toLowerCase().includes(term))
          return false
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)
  }, [apiLogs, query, methodFilter, statusFilter])

  const averageDuration = useMemo(() => {
    if (rows.length === 0) return 0
    return rows.reduce((sum, log) => sum + log.durationMs, 0) / rows.length
  }, [rows])

  const columns: Column<ApiLog>[] = [
    {
      id: 'method',
      header: 'Method',
      cell: (log) => (
        <Badge variant={METHOD_VARIANT[log.method]} size="sm" className="font-mono">
          {log.method}
        </Badge>
      ),
    },
    {
      id: 'endpoint',
      header: 'Endpoint',
      className: 'font-mono text-[12.5px]',
      cell: (log) => <span className="block max-w-[26rem] truncate">{log.endpoint}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      className: 'font-mono text-[12.5px] font-medium',
      cell: (log) => <span className={statusTone(log.status)}>{log.status}</span>,
    },
    {
      id: 'duration',
      header: 'Duration',
      align: 'right',
      className: 'tabular text-[12.5px]',
      cell: (log) => (
        <span className={cn(log.durationMs > 250 ? 'text-warning' : 'text-muted-foreground')}>
          {formatDuration(log.durationMs)}
        </span>
      ),
    },
    {
      id: 'id',
      header: 'Request ID',
      className: 'font-mono text-[12px] text-muted-foreground',
      cell: (log) => log.id,
    },
    {
      id: 'timestamp',
      header: 'Timestamp',
      className: 'text-muted-foreground text-[12.5px] whitespace-nowrap',
      cell: (log) => formatTime(log.createdAt),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Logs"
        description="Every request made against your sandbox credentials, with full request and response bodies."
        badge={<SandboxBadge />}
      />

      <Card>
        <CardContent className="px-0 pt-0 pb-0">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter by endpoint or request ID…"
                  className="h-8 pl-8 font-mono text-[12.5px]"
                />
              </div>

              <Select
                value={methodFilter}
                onValueChange={(value) => setMethodFilter(value as ApiLog['method'] | 'all')}
              >
                <SelectTrigger size="sm" className="w-[130px] text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as 'all' | 'success' | 'error')}
              >
                <SelectTrigger size="sm" className="w-[150px] text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="success">2xx / 3xx</SelectItem>
                  <SelectItem value="error">4xx / 5xx</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
              <span>{rows.length} requests</span>
              <span>
                Average latency{' '}
                <span className="tabular text-foreground font-medium">
                  {formatDuration(Math.round(averageDuration))}
                </span>
              </span>
              <span>
                Errors{' '}
                <span className="tabular text-foreground font-medium">
                  {rows.filter((log) => log.status >= 400).length}
                </span>
              </span>
            </div>
          </div>

          <div className="border-t">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(log) => log.id}
              loading={loading}
              onRowClick={(log) => setSelected(log)}
              empty={
                <EmptyState
                  icon={BookOpen}
                  title="No API requests match your filters"
                  description="Clear the filters, or create a payment to generate new API activity."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery('')
                        setMethodFilter('all')
                        setStatusFilter('all')
                      }}
                    >
                      Clear filters
                    </Button>
                  }
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
                <SheetTitle className="flex items-center gap-2">
                  <Badge variant={METHOD_VARIANT[selected.method]} className="font-mono">
                    {selected.method}
                  </Badge>
                  <span className="min-w-0 truncate font-mono text-[14px]">
                    {selected.endpoint}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  {selected.id} · {formatDateTime(selected.createdAt)}
                </SheetDescription>
              </SheetHeader>

              <SheetBody className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11.5px]">HTTP status</p>
                    <p
                      className={cn(
                        'tabular mt-1 font-mono text-[17px] font-semibold',
                        statusTone(selected.status),
                      )}
                    >
                      {selected.status}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11.5px]">Duration</p>
                    <p className="tabular mt-1 text-[17px] font-semibold">
                      {formatDuration(selected.durationMs)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11.5px]">Source IP</p>
                    <p className="mt-1 font-mono text-[13px] font-medium">{selected.ipAddress}</p>
                  </div>
                </div>

                <section>
                  <p className="mb-2 text-[13px] font-semibold">Request headers</p>
                  <HeaderTable headers={selected.requestHeaders} />
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold">Request body</p>
                    {selected.requestBody && (
                      <CopyButton
                        value={JSON.stringify(selected.requestBody, null, 2)}
                        label="Request body copied"
                      />
                    )}
                  </div>
                  {selected.requestBody ? (
                    <JsonViewer value={selected.requestBody} maxHeight="18rem" />
                  ) : (
                    <p className="text-muted-foreground rounded-md border px-3 py-4 text-center text-[12.5px]">
                      No request body
                    </p>
                  )}
                </section>

                <section>
                  <p className="mb-2 text-[13px] font-semibold">Response headers</p>
                  <HeaderTable headers={selected.responseHeaders} />
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold">Response body</p>
                    <CopyButton
                      value={JSON.stringify(selected.responseBody, null, 2)}
                      label="Response body copied"
                    />
                  </div>
                  <JsonViewer value={selected.responseBody} maxHeight="20rem" />
                </section>
              </SheetBody>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
