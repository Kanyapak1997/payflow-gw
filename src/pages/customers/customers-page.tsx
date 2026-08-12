import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, Phone, Search, Users } from 'lucide-react'
import type { Customer } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/misc'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { EmptyState } from '@/components/common/misc'
import { PaymentMethodBadge } from '@/components/common/payment-method-badge'
import { TransactionStatusBadge } from '@/components/common/status-badge'
import { CopyButton } from '@/components/common/copy-button'
import { customers } from '@/data/customers'
import { usePaymentStore } from '@/stores/payment-store'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { formatCurrency, formatDate, formatDateTime, initialsOf } from '@/lib/format'
import { pluralize } from '@/lib/utils'

export function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const transactions = usePaymentStore((state) => state.transactions)
  const loading = useSimulatedLoading()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)

  // Deep link support: /customers?customer=cus_8Q1LMd opens the panel directly.
  useEffect(() => {
    const id = searchParams.get('customer')
    if (!id) return
    const match = customers.find((customer) => customer.id === id)
    if (match) setSelected(match)
  }, [searchParams])

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return customers
    return customers.filter((customer) =>
      `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(term),
    )
  }, [query])

  const customerTransactions = useMemo(() => {
    if (!selected) return []
    return transactions
      .filter(
        (transaction) =>
          transaction.customerId === selected.id ||
          transaction.customerEmail === selected.email,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [selected, transactions])

  const closePanel = () => {
    setSelected(null)
    if (searchParams.has('customer')) {
      searchParams.delete('customer')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const columns: Column<Customer>[] = [
    {
      id: 'customer',
      header: 'Customer',
      cell: (customer) => (
        <div className="flex items-center gap-3">
          <span className="bg-primary-subtle text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
            {initialsOf(customer.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{customer.name}</p>
            <p className="text-muted-foreground truncate font-mono text-[11.5px]">{customer.id}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      className: 'text-[13px]',
      cell: (customer) => customer.email,
    },
    {
      id: 'country',
      header: 'Country',
      cell: (customer) => (
        <Badge variant="secondary" size="sm">
          {customer.country}
        </Badge>
      ),
    },
    {
      id: 'spend',
      header: 'Total Spend',
      align: 'right',
      className: 'tabular font-medium whitespace-nowrap',
      cell: (customer) => formatCurrency(customer.totalSpend, 'THB', { decimals: false }),
    },
    {
      id: 'payments',
      header: 'Payments',
      align: 'right',
      className: 'tabular text-[13px]',
      cell: (customer) => customer.paymentsCount,
    },
    {
      id: 'last',
      header: 'Last Payment',
      className: 'text-muted-foreground text-[12.5px] whitespace-nowrap',
      cell: (customer) => formatDate(customer.lastPaymentAt),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Everyone who has paid you through PayFlow, with their saved methods and history."
      />

      <Card>
        <CardContent className="px-0 pt-0 pb-0">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customers…"
                className="h-8 pl-8 text-[13px]"
              />
            </div>
            <span className="text-muted-foreground ml-auto text-[12.5px]">
              {rows.length} {rows.length === 1 ? 'customer' : 'customers'}
            </span>
          </div>

          <div className="border-t">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(customer) => customer.id}
              loading={loading}
              onRowClick={(customer) => setSelected(customer)}
              empty={
                <EmptyState
                  icon={Users}
                  title="No customers match your search"
                  description="Try a different name or email address."
                  action={
                    <Button variant="outline" onClick={() => setQuery('')}>
                      Clear search
                    </Button>
                  }
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && closePanel()}>
        <SheetContent className="sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <span className="bg-primary-subtle text-primary flex size-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold">
                    {initialsOf(selected.name)}
                  </span>
                  <div className="min-w-0">
                    <SheetTitle>{selected.name}</SheetTitle>
                    <SheetDescription>
                      Customer since {formatDate(selected.createdAt)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <SheetBody className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11.5px]">Total spend</p>
                    <p className="tabular mt-1 text-[17px] font-semibold tracking-tight">
                      {formatCurrency(selected.totalSpend, 'THB', { decimals: false })}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11.5px]">Payments</p>
                    <p className="tabular mt-1 text-[17px] font-semibold tracking-tight">
                      {selected.paymentsCount}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-[11.5px]">Last payment</p>
                    <p className="mt-1 text-[13px] font-medium">
                      {formatDate(selected.lastPaymentAt)}
                    </p>
                  </div>
                </div>

                <section>
                  <h3 className="text-[13px] font-semibold">Customer information</h3>
                  <dl className="mt-2.5 divide-y rounded-lg border">
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <dt className="text-muted-foreground flex items-center gap-2 text-[12.5px]">
                        <Mail className="size-3.5" />
                        Email
                      </dt>
                      <dd className="flex items-center gap-1 text-[13px]">
                        {selected.email}
                        <CopyButton value={selected.email} label="Email copied" />
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <dt className="text-muted-foreground flex items-center gap-2 text-[12.5px]">
                        <Phone className="size-3.5" />
                        Phone
                      </dt>
                      <dd className="text-[13px]">{selected.phone}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <dt className="text-muted-foreground text-[12.5px]">Customer ID</dt>
                      <dd className="flex items-center gap-1 font-mono text-[12.5px]">
                        {selected.id}
                        <CopyButton value={selected.id} label="Customer ID copied" />
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                      <dt className="text-muted-foreground text-[12.5px]">Country</dt>
                      <dd className="text-[13px]">{selected.country}</dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <h3 className="text-[13px] font-semibold">Saved payment methods</h3>
                  <ul className="mt-2.5 space-y-2">
                    {selected.savedMethods.map((method, index) => (
                      <li
                        key={`${method.type}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5"
                      >
                        <PaymentMethodBadge method={method} />
                        {index === 0 && (
                          <Badge variant="secondary" size="sm">
                            Default
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted-foreground mt-2 text-[11.5px]">
                    Tokenised references only — PayFlow's demo never stores card data.
                  </p>
                </section>

                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[13px] font-semibold">Payment history</h3>
                    <span className="text-muted-foreground text-[12px]">
                      {pluralize(customerTransactions.length, 'transaction')}
                    </span>
                  </div>

                  {customerTransactions.length === 0 ? (
                    <p className="text-muted-foreground mt-2.5 rounded-lg border px-3.5 py-6 text-center text-[13px]">
                      No transactions in the current dataset.
                    </p>
                  ) : (
                    <ul className="mt-2.5 divide-y rounded-lg border">
                      {customerTransactions.map((transaction) => (
                        <li key={transaction.id}>
                          <Link
                            to={`/transactions/${transaction.id}`}
                            onClick={closePanel}
                            className="hover:bg-muted/60 flex items-center gap-3 px-3.5 py-3 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-[12.5px] font-medium">
                                {transaction.id}
                              </p>
                              <p className="text-muted-foreground truncate text-[11.5px]">
                                {transaction.description} · {formatDateTime(transaction.createdAt)}
                              </p>
                            </div>
                            <TransactionStatusBadge status={transaction.status} size="sm" showIcon={false} />
                            <span className="tabular shrink-0 text-[13px] font-medium">
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <Separator />

                <p className="text-muted-foreground text-[11.5px]">
                  All customer records in PayFlow are fictional and generated for demonstration
                  purposes.
                </p>
              </SheetBody>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
