import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Receipt, Search, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TransactionStatusBadge } from '@/components/common/status-badge'
import { EmptyState } from '@/components/common/misc'
import { usePaymentStore } from '@/stores/payment-store'
import { customers } from '@/data/customers'
import { formatCurrency, initialsOf } from '@/lib/format'

/** Command-palette style lookup across transactions and customers. */
export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const transactions = usePaymentStore((state) => state.transactions)

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const term = query.trim().toLowerCase()

  const matchedTransactions = useMemo(() => {
    if (!term) return transactions.slice(0, 5)
    return transactions
      .filter((transaction) =>
        [transaction.id, transaction.orderId, transaction.customerName, transaction.customerEmail]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 6)
  }, [term, transactions])

  const matchedCustomers = useMemo(() => {
    if (!term) return []
    return customers
      .filter((customer) => `${customer.name} ${customer.email}`.toLowerCase().includes(term))
      .slice(0, 4)
  }, [term])

  const go = (path: string) => {
    onOpenChange(false)
    navigate(path)
  }

  const empty = matchedTransactions.length === 0 && matchedCustomers.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="top-[15%] max-w-xl translate-y-0 gap-0 p-0">
        <DialogTitle className="sr-only">Search PayFlow</DialogTitle>
        <DialogDescription className="sr-only">
          Search across transactions and customers
        </DialogDescription>

        <div className="flex items-center gap-2.5 border-b px-4">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by transaction, order ID, customer…"
            className="h-12 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="scrollbar-thin max-h-[24rem] overflow-y-auto p-2">
          {empty && (
            <EmptyState compact title="No results" description={`Nothing matches “${query}”.`} />
          )}

          {matchedTransactions.length > 0 && (
            <div className="mb-1">
              <p className="text-muted-foreground px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase">
                {term ? 'Transactions' : 'Recent transactions'}
              </p>
              {matchedTransactions.map((transaction) => (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => go(`/transactions/${transaction.id}`)}
                  className="hover:bg-accent focus-visible:bg-accent flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none"
                >
                  <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                    <Receipt className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-medium">{transaction.id}</span>
                      <TransactionStatusBadge status={transaction.status} size="sm" showIcon={false} />
                    </span>
                    <span className="text-muted-foreground block truncate text-[12px]">
                      {transaction.customerName} · {transaction.orderId}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-[13px] font-medium">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {matchedCustomers.length > 0 && (
            <div>
              <p className="text-muted-foreground px-2 py-1.5 text-[11px] font-semibold tracking-wide uppercase">
                Customers
              </p>
              {matchedCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => go(`/customers?customer=${customer.id}`)}
                  className="hover:bg-accent focus-visible:bg-accent flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none"
                >
                  <span className="bg-primary-subtle text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                    {initialsOf(customer.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{customer.name}</span>
                    <span className="text-muted-foreground block truncate text-[12px]">
                      {customer.email}
                    </span>
                  </span>
                  <Users className="text-muted-foreground size-4 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
