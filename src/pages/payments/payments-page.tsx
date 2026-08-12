import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, ExternalLink, MoreHorizontal, Plus, Receipt, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { TransactionStatusBadge } from '@/components/common/status-badge'
import { EmptyState } from '@/components/common/misc'
import { usePaymentStore } from '@/stores/payment-store'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { Payment } from '@/types'

export function PaymentsPage() {
  const navigate = useNavigate()
  const payments = usePaymentStore((state) => state.payments)
  const [query, setQuery] = useState('')
  const loading = useSimulatedLoading()

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return payments
    return payments.filter((payment) =>
      [payment.id, payment.orderId, payment.customerName, payment.customerEmail, payment.description]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [payments, query])

  const columns: Column<Payment>[] = [
    {
      id: 'id',
      header: 'Payment ID',
      className: 'font-mono text-[13px] font-medium',
      cell: (payment) => payment.id,
    },
    {
      id: 'orderId',
      header: 'Order ID',
      className: 'font-mono text-[12.5px] text-muted-foreground',
      cell: (payment) => payment.orderId,
    },
    {
      id: 'description',
      header: 'Description',
      className: 'text-[13px]',
      cell: (payment) => payment.description || '—',
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: (payment) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{payment.customerName}</p>
          <p className="text-muted-foreground truncate text-[12px]">{payment.customerEmail}</p>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      className: 'tabular font-medium whitespace-nowrap',
      cell: (payment) => formatCurrency(payment.amount, payment.currency),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (payment) => <TransactionStatusBadge status={payment.status} size="sm" />,
    },
    {
      id: 'createdAt',
      header: 'Created',
      className: 'text-muted-foreground text-[12.5px] whitespace-nowrap',
      cell: (payment) => formatDateTime(payment.createdAt),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (payment) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${payment.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuItem onSelect={() => navigate(`/payments/${payment.id}`)}>
              <ExternalLink />
              View payment
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(`/pay/${payment.id}`)}>
              <CreditCard />
              Open checkout
            </DropdownMenuItem>
            {payment.transactionId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => navigate(`/transactions/${payment.transactionId}`)}
                >
                  <Receipt />
                  View transaction
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Payment intents you've created. Each one has a hosted checkout link your customer can pay."
        actions={
          <Button onClick={() => navigate('/payments/create')}>
            <Plus />
            Create Payment
          </Button>
        }
      />

      <Card>
        <CardContent className="px-0 pt-0 pb-0">
          <div className="flex flex-wrap items-center gap-2 p-4">
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search payments…"
                className="h-8 pl-8 text-[13px]"
              />
            </div>
            <span className="text-muted-foreground ml-auto text-[12.5px]">
              {rows.length} {rows.length === 1 ? 'payment' : 'payments'}
            </span>
          </div>

          <div className="border-t">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(payment) => payment.id}
              loading={loading}
              onRowClick={(payment) => navigate(`/payments/${payment.id}`)}
              empty={
                <EmptyState
                  icon={CreditCard}
                  title={query ? 'No payments match your search' : 'No payments yet'}
                  description={
                    query
                      ? 'Try a different payment ID, order ID or customer.'
                      : 'Create your first payment to generate a hosted checkout link and walk the full payment lifecycle.'
                  }
                  action={
                    query ? (
                      <Button variant="outline" onClick={() => setQuery('')}>
                        Clear search
                      </Button>
                    ) : (
                      <Button asChild>
                        <Link to="/payments/create">
                          <Plus />
                          Create Payment
                        </Link>
                      </Button>
                    )
                  }
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <p className="text-muted-foreground text-[12px]">
          Payments are stored in this browser only — clearing site data resets the demo.
        </p>
      )}
    </div>
  )
}
