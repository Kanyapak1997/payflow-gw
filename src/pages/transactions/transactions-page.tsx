import { useMemo, useState } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Download, Plus, Receipt, Search, SlidersHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import type { PaymentMethodType, PaymentStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/misc'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { usePaymentStore } from '@/stores/payment-store'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { FILTERABLE_STATUSES, PAYMENT_METHOD_LABEL, STATUS_META } from '@/lib/payment'
import { DEMO_TODAY } from '@/lib/analytics'
import { formatCurrency } from '@/lib/format'

type DateRangeKey = 'all' | 'today' | '7d' | '30d' | '90d'

const DATE_RANGES: { value: DateRangeKey; label: string; days: number | null }[] = [
  { value: 'all', label: 'All time', days: null },
  { value: 'today', label: 'Today', days: 0 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
]

const PAGE_SIZE = 12

export function TransactionsPage() {
  const navigate = useNavigate()
  const transactions = usePaymentStore((state) => state.transactions)
  const loading = useSimulatedLoading()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<PaymentStatus | 'all'>('all')
  const [method, setMethod] = useState<PaymentMethodType | 'all'>('all')
  const [dateRange, setDateRange] = useState<DateRangeKey>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const days = DATE_RANGES.find((range) => range.value === dateRange)?.days ?? null

    return [...transactions]
      .filter((transaction) => {
        if (status !== 'all' && transaction.status !== status) return false
        if (method !== 'all' && transaction.paymentMethod.type !== method) return false
        if (days !== null) {
          const age = differenceInCalendarDays(DEMO_TODAY, parseISO(transaction.createdAt))
          if (age > days) return false
        }
        if (term) {
          const haystack = [
            transaction.id,
            transaction.orderId,
            transaction.paymentId,
            transaction.customerName,
            transaction.customerEmail,
            transaction.paymentMethod.label,
            transaction.description ?? '',
          ]
            .join(' ')
            .toLowerCase()
          if (!haystack.includes(term)) return false
        }
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [transactions, query, status, method, dateRange])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const filtersActive =
    query !== '' || status !== 'all' || method !== 'all' || dateRange !== 'all'

  const resetFilters = () => {
    setQuery('')
    setStatus('all')
    setMethod('all')
    setDateRange('all')
    setPage(1)
  }

  const capturedTotal = useMemo(
    () =>
      filtered
        .filter((transaction) => transaction.currency === 'THB')
        .filter((transaction) =>
          ['SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(transaction.status),
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [filtered],
  )

  const exportCsv = () => {
    const header = [
      'Transaction ID',
      'Order ID',
      'Payment ID',
      'Customer',
      'Email',
      'Payment Method',
      'Amount',
      'Currency',
      'Status',
      'Created At',
    ]
    const rows = filtered.map((transaction) => [
      transaction.id,
      transaction.orderId,
      transaction.paymentId,
      transaction.customerName,
      transaction.customerEmail,
      transaction.paymentMethod.label,
      transaction.amount.toFixed(2),
      transaction.currency,
      transaction.status,
      transaction.createdAt,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payflow-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export ready', {
      description: `${filtered.length} transactions exported as CSV.`,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View and manage payments processed through PayFlow."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download />
              Export
            </Button>
            <Button onClick={() => navigate('/payments/create')}>
              <Plus />
              Create Payment
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="px-0 pt-0 pb-0">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Search ID, order, customer…"
                  className="h-8 pl-8 text-[13px]"
                />
              </div>

              <Select
                value={dateRange}
                onValueChange={(value) => {
                  setDateRange(value as DateRangeKey)
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-[150px] text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as PaymentStatus | 'all')
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-[168px] text-[13px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {FILTERABLE_STATUSES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {STATUS_META[option].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={method}
                onValueChange={(value) => {
                  setMethod(value as PaymentMethodType | 'all')
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-[178px] text-[13px]">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment methods</SelectItem>
                  {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethodType[]).map((option) => (
                    <SelectItem key={option} value={option}>
                      {PAYMENT_METHOD_LABEL[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filtersActive && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X />
                  Clear
                </Button>
              )}
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5" />
                {filtered.length} of {transactions.length} transactions
              </span>
              <span>
                Captured in THB:{' '}
                <span className="tabular text-foreground font-medium">
                  {formatCurrency(capturedTotal, 'THB', { decimals: false })}
                </span>
              </span>
            </div>
          </div>

          <div className="border-t">
            <TransactionTable
              transactions={paginated}
              loading={loading}
              emptyState={
                <EmptyState
                  icon={Receipt}
                  title={filtersActive ? 'No transactions match your filters' : 'No transactions yet'}
                  description={
                    filtersActive
                      ? 'Try widening the date range or clearing the status filter.'
                      : 'Create a payment and complete the hosted checkout to see it here.'
                  }
                  action={
                    filtersActive ? (
                      <Button variant="outline" onClick={resetFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button onClick={() => navigate('/payments/create')}>
                        <Plus />
                        Create Payment
                      </Button>
                    )
                  }
                />
              }
            />
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
              <p className="text-muted-foreground text-[12.5px]">
                Showing{' '}
                <span className="tabular font-medium">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                </span>{' '}
                of <span className="tabular font-medium">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Previous
                </Button>
                <Badge variant="secondary" className="tabular">
                  {currentPage} / {totalPages}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
