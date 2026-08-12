import { useNavigate } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import type { Transaction } from '@/types'
import { DataTable, type Column } from '@/components/common/data-table'
import { TransactionStatusBadge } from '@/components/common/status-badge'
import { PaymentMethodBadge } from '@/components/common/payment-method-badge'
import { EmptyState } from '@/components/common/misc'
import { formatCurrency, formatDateTime, formatShortDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TransactionTableProps {
  transactions: Transaction[]
  loading?: boolean
  /** "recent" is the trimmed dashboard view; "full" is the transactions page */
  variant?: 'recent' | 'full'
  emptyState?: React.ReactNode
}

export function TransactionTable({
  transactions,
  loading = false,
  variant = 'full',
  emptyState,
}: TransactionTableProps) {
  const navigate = useNavigate()

  const idColumn: Column<Transaction> = {
    id: 'id',
    header: variant === 'recent' ? 'Transaction' : 'Transaction ID',
    className: 'font-mono text-[13px] font-medium',
    cell: (transaction) => (
      <span className="flex items-center gap-2">
        <span className="text-foreground">{transaction.id}</span>
        {transaction.isDemo && (
          <span className="bg-primary-subtle text-primary rounded px-1 py-px text-[10px] font-semibold tracking-wide">
            NEW
          </span>
        )}
      </span>
    ),
  }

  const customerColumn: Column<Transaction> = {
    id: 'customer',
    header: 'Customer',
    cell: (transaction) => (
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium">{transaction.customerName}</p>
        <p className="text-muted-foreground truncate text-[12px]">{transaction.customerEmail}</p>
      </div>
    ),
  }

  const methodColumn: Column<Transaction> = {
    id: 'method',
    header: 'Payment Method',
    cell: (transaction) => <PaymentMethodBadge method={transaction.paymentMethod} compact />,
  }

  const statusColumn: Column<Transaction> = {
    id: 'status',
    header: 'Status',
    cell: (transaction) => <TransactionStatusBadge status={transaction.status} size="sm" />,
  }

  const columns: Column<Transaction>[] =
    variant === 'recent'
      ? [
          idColumn,
          customerColumn,
          methodColumn,
          {
            id: 'amount',
            header: 'Amount',
            align: 'right',
            className: 'tabular font-medium whitespace-nowrap',
            cell: (transaction) => formatCurrency(transaction.amount, transaction.currency),
          },
          statusColumn,
          {
            id: 'date',
            header: 'Date',
            className: 'text-muted-foreground text-[12.5px] whitespace-nowrap',
            cell: (transaction) => formatShortDateTime(transaction.createdAt),
          },
        ]
      : [
          idColumn,
          {
            id: 'orderId',
            header: 'Order ID',
            className: 'font-mono text-[12.5px] text-muted-foreground whitespace-nowrap',
            cell: (transaction) => transaction.orderId,
          },
          customerColumn,
          methodColumn,
          {
            id: 'amount',
            header: 'Amount',
            align: 'right',
            className: 'tabular font-medium whitespace-nowrap',
            cell: (transaction) => (
              <span
                className={cn(
                  transaction.status === 'REFUNDED' && 'text-muted-foreground line-through',
                )}
              >
                {formatCurrency(transaction.amount, transaction.currency)}
              </span>
            ),
          },
          {
            id: 'currency',
            header: 'Currency',
            className: 'text-muted-foreground text-[12.5px]',
            cell: (transaction) => transaction.currency,
          },
          statusColumn,
          {
            id: 'createdAt',
            header: 'Created At',
            className: 'text-muted-foreground text-[12.5px] whitespace-nowrap',
            cell: (transaction) => formatDateTime(transaction.createdAt),
          },
        ]

  return (
    <DataTable
      columns={columns}
      rows={transactions}
      rowKey={(transaction) => transaction.id}
      loading={loading}
      skeletonRows={variant === 'recent' ? 5 : 8}
      onRowClick={(transaction) => navigate(`/transactions/${transaction.id}`)}
      empty={
        emptyState ?? (
          <EmptyState
            icon={Receipt}
            title="No transactions found"
            description="Try adjusting your filters, or create a payment to generate one."
          />
        )
      }
    />
  )
}
