import { useMemo, useState } from 'react'
import { Ban, Copy, Link2, MoreHorizontal, Plus, Play, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CurrencyCode, PaymentLink } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/common/page-header'
import { DataTable, type Column } from '@/components/common/data-table'
import { FormField } from '@/components/common/form-field'
import { EmptyState } from '@/components/common/misc'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { usePaymentStore } from '@/stores/payment-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { CURRENCIES, formatCurrency, formatDate } from '@/lib/format'
import { copyToClipboard, pluralize } from '@/lib/utils'

const STATUS_VARIANT: Record<PaymentLink['status'], 'success' | 'neutral' | 'warning'> = {
  ACTIVE: 'success',
  EXPIRED: 'warning',
  DISABLED: 'neutral',
}

function linkUrl(id: string) {
  return `https://payflow.demo/link/${id}`
}

export function PaymentLinksPage() {
  const paymentLinks = usePaymentStore((state) => state.paymentLinks)
  const createPaymentLink = usePaymentStore((state) => state.createPaymentLink)
  const setPaymentLinkStatus = usePaymentStore((state) => state.setPaymentLinkStatus)
  const deletePaymentLink = usePaymentStore((state) => state.deletePaymentLink)
  const defaultCurrency = useSettingsStore((state) => state.settings.defaultCurrency)
  const loading = useSimulatedLoading()

  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PaymentLink | null>(null)

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return paymentLinks
    return paymentLinks.filter((link) =>
      `${link.name} ${link.id} ${link.description ?? ''}`.toLowerCase().includes(term),
    )
  }, [paymentLinks, query])

  const totalRevenue = useMemo(
    () =>
      paymentLinks
        .filter((link) => link.currency === 'THB')
        .reduce((sum, link) => sum + link.revenue, 0),
    [paymentLinks],
  )

  const copyLink = async (link: PaymentLink) => {
    const ok = await copyToClipboard(linkUrl(link.id))
    toast[ok ? 'success' : 'error'](ok ? 'Payment link copied' : 'Could not access the clipboard')
  }

  const columns: Column<PaymentLink>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (link) => (
        <div className="flex items-center gap-3">
          <span className="bg-primary-subtle text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
            <Link2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{link.name}</p>
            {link.description && (
              <p className="text-muted-foreground truncate text-[12px]">{link.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'id',
      header: 'Link ID',
      className: 'font-mono text-[12.5px] text-muted-foreground',
      cell: (link) => link.id,
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      className: 'tabular font-medium whitespace-nowrap',
      cell: (link) =>
        link.amount === null ? (
          <span className="text-muted-foreground font-normal">Customer chooses</span>
        ) : (
          formatCurrency(link.amount, link.currency)
        ),
    },
    {
      id: 'usage',
      header: 'Usage',
      className: 'text-[13px] whitespace-nowrap',
      cell: (link) => (
        <div>
          <p>{pluralize(link.usageCount, 'payment')}</p>
          <p className="text-muted-foreground tabular text-[12px]">
            {formatCurrency(link.revenue, link.currency, { decimals: false })} collected
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (link) => (
        <Badge variant={STATUS_VARIANT[link.status]} size="sm">
          {link.status}
        </Badge>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      className: 'text-muted-foreground text-[12.5px] whitespace-nowrap',
      cell: (link) => formatDate(link.createdAt),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (link) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${link.name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => void copyLink(link)}>
              <Copy />
              Copy link
            </DropdownMenuItem>
            {link.status === 'ACTIVE' ? (
              <DropdownMenuItem
                onSelect={() => {
                  setPaymentLinkStatus(link.id, 'DISABLED')
                  toast.success(`${link.name} disabled`)
                }}
              >
                <Ban />
                Disable link
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  setPaymentLinkStatus(link.id, 'ACTIVE')
                  toast.success(`${link.name} activated`)
                }}
              >
                <Play />
                Activate link
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(link)}>
              <Trash2 />
              Delete link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Links"
        description="Reusable checkout links you can share by email, chat or QR — no integration required."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Create Payment Link
          </Button>
        }
      />

      <Card>
        <CardContent className="px-0 pt-0 pb-0">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative w-full max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search links…"
                className="h-8 pl-8 text-[13px]"
              />
            </div>
            <span className="text-muted-foreground ml-auto text-[12.5px]">
              {rows.length} {rows.length === 1 ? 'link' : 'links'} ·{' '}
              <span className="tabular text-foreground font-medium">
                {formatCurrency(totalRevenue, 'THB', { decimals: false })}
              </span>{' '}
              collected
            </span>
          </div>

          <div className="border-t">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(link) => link.id}
              loading={loading}
              empty={
                <EmptyState
                  icon={Link2}
                  title={query ? 'No links match your search' : 'No payment links yet'}
                  description={
                    query
                      ? 'Try a different name or link ID.'
                      : 'Create a link to start accepting payments without writing any code.'
                  }
                  action={
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus />
                      Create Payment Link
                    </Button>
                  }
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      <CreateLinkDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCurrency={defaultCurrency}
        onCreate={(values) => {
          const link = createPaymentLink(values)
          toast.success('Payment link created', { description: linkUrl(link.id) })
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete payment link?"
        description={
          <>
            <span className="font-medium">{pendingDelete?.name}</span> will stop working
            immediately. Customers who already have the link will see an error.
          </>
        }
        confirmLabel="Delete link"
        destructive
        onConfirm={() => {
          if (pendingDelete) {
            deletePaymentLink(pendingDelete.id)
            toast.success(`${pendingDelete.name} deleted`)
            setPendingDelete(null)
          }
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Never expires', days: null },
  { value: '7', label: 'In 7 days', days: 7 },
  { value: '30', label: 'In 30 days', days: 30 },
  { value: '90', label: 'In 90 days', days: 90 },
]

function CreateLinkDialog({
  open,
  onOpenChange,
  defaultCurrency,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCurrency: CurrencyCode
  onCreate: (values: {
    name: string
    description?: string
    amount: number | null
    currency: CurrencyCode
    expiresAt?: string
  }) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency)
  const [expiry, setExpiry] = useState('never')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setDescription('')
    setAmount('')
    setCurrency(defaultCurrency)
    setExpiry('never')
    setError(null)
  }

  const submit = () => {
    if (name.trim().length < 2) {
      setError('Give the link a name your customers will recognise.')
      return
    }
    const parsed = amount.trim() === '' ? null : Number(amount)
    if (parsed !== null && (!Number.isFinite(parsed) || parsed <= 0)) {
      setError('Enter a valid amount, or leave it blank to let the customer choose.')
      return
    }

    const days = EXPIRY_OPTIONS.find((option) => option.value === expiry)?.days ?? null
    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      amount: parsed,
      currency,
      expiresAt:
        days === null
          ? undefined
          : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create payment link</DialogTitle>
          <DialogDescription>
            Share a hosted checkout without writing any integration code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Name" required error={error ?? undefined}>
            {(props) => (
              <Input
                {...props}
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError(null)
                }}
                placeholder="Premium Plan"
              />
            )}
          </FormField>

          <div className="grid grid-cols-[1fr_140px] gap-3">
            <FormField label="Amount" hint="Leave blank for a customer-chosen amount.">
              {(props) => (
                <Input
                  {...props}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1990.00"
                  className="tabular"
                />
              )}
            </FormField>

            <FormField label="Currency">
              {(props) => (
                <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
                  <SelectTrigger id={props.id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>

          <FormField label="Description">
            {(props) => (
              <Textarea
                {...props}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="Monthly premium subscription"
              />
            )}
          </FormField>

          <FormField label="Expiration">
            {(props) => (
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id={props.id}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Create Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
