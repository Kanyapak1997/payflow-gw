import { useState } from 'react'
import { Building2, CreditCard, Palette, RotateCcw, Save, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CurrencyCode, MerchantSettings } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/misc'
import { PageHeader } from '@/components/common/page-header'
import { FormField } from '@/components/common/form-field'
import { SandboxBadge } from '@/components/common/misc'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { CardBrandMark, PromptPayMark, WalletMark } from '@/components/common/brand-marks'
import { useSettingsStore } from '@/stores/settings-store'
import { usePaymentStore } from '@/stores/payment-store'
import { useUiStore } from '@/stores/ui-store'
import { useTheme } from '@/hooks/use-theme'
import { TIMEZONES } from '@/data/merchant'
import { CURRENCIES } from '@/lib/format'

const PAYMENT_METHOD_ROWS: {
  key: keyof MerchantSettings['paymentMethods']
  title: string
  description: string
}[] = [
  {
    key: 'cards',
    title: 'Cards',
    description: 'Visa, Mastercard, JCB, American Express, UnionPay',
  },
  { key: 'promptpay', title: 'PromptPay', description: 'Thai QR bank transfer' },
  { key: 'wallets', title: 'Wallets', description: 'TrueMoney, LINE Pay, ShopeePay' },
  { key: 'installments', title: 'Installments', description: 'KBank, SCB, Krungsri, KTC' },
]

const NOTIFICATION_ROWS: {
  key: keyof MerchantSettings['notifications']
  title: string
  description: string
}[] = [
  { key: 'paymentSuccess', title: 'Successful payments', description: 'Email me on every capture' },
  { key: 'paymentFailed', title: 'Failed payments', description: 'Email me when a payment declines' },
  { key: 'refunds', title: 'Refunds', description: 'Email me when a refund completes' },
  { key: 'weeklyDigest', title: 'Weekly digest', description: 'A summary every Monday morning' },
]

export function SettingsPage() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const togglePaymentMethod = useSettingsStore((state) => state.togglePaymentMethod)
  const toggleNotification = useSettingsStore((state) => state.toggleNotification)
  const resetSettings = useSettingsStore((state) => state.resetSettings)
  const resetDemoData = usePaymentStore((state) => state.resetDemoData)
  const restoreDemoTour = useUiStore((state) => state.restoreDemoTour)
  const { theme, setTheme } = useTheme()

  const [resetOpen, setResetOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure how PayFlow represents your business at checkout."
        badge={<SandboxBadge />}
        actions={
          <Button onClick={() => toast.success('Settings saved', { description: 'Changes apply immediately in this demo.' })}>
            <Save />
            Save changes
          </Button>
        }
      />

      <Tabs defaultValue="business">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="business">
            <Building2 className="size-4" />
            Business profile
          </TabsTrigger>
          <TabsTrigger value="checkout">
            <Palette className="size-4" />
            Checkout
          </TabsTrigger>
          <TabsTrigger value="methods">
            <CreditCard className="size-4" />
            Payment methods
          </TabsTrigger>
          <TabsTrigger value="demo">
            <Sparkles className="size-4" />
            Demo
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------ Business ------------------------- */}
        <TabsContent value="business" className="mt-5 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Business profile</CardTitle>
              <CardDescription>
                Shown on receipts and used to reconcile settlements.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Business name">
                {(props) => (
                  <Input
                    {...props}
                    value={settings.businessName}
                    onChange={(event) => updateSettings({ businessName: event.target.value })}
                  />
                )}
              </FormField>

              <FormField label="Merchant ID" hint="Assigned by PayFlow — read only.">
                {(props) => (
                  <Input {...props} value={settings.merchantId} readOnly className="font-mono" />
                )}
              </FormField>

              <FormField label="Default currency">
                {(props) => (
                  <Select
                    value={settings.defaultCurrency}
                    onValueChange={(value) =>
                      updateSettings({ defaultCurrency: value as CurrencyCode })
                    }
                  >
                    <SelectTrigger id={props.id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <FormField label="Timezone">
                {(props) => (
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSettings({ timezone: value })}
                  >
                    <SelectTrigger id={props.id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              <FormField label="Support email">
                {(props) => (
                  <Input
                    {...props}
                    type="email"
                    value={settings.supportEmail}
                    onChange={(event) => updateSettings({ supportEmail: event.target.value })}
                  />
                )}
              </FormField>

              <FormField label="Website">
                {(props) => (
                  <Input
                    {...props}
                    value={settings.website}
                    onChange={(event) => updateSettings({ website: event.target.value })}
                  />
                )}
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Where PayFlow should reach you.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {NOTIFICATION_ROWS.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium">{row.title}</p>
                    <p className="text-muted-foreground text-[12.5px]">{row.description}</p>
                  </div>
                  <Switch
                    checked={settings.notifications[row.key]}
                    onCheckedChange={(enabled) => toggleNotification(row.key, enabled)}
                    aria-label={row.title}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------ Checkout ------------------------- */}
        <TabsContent value="checkout" className="mt-5 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Checkout settings</CardTitle>
              <CardDescription>
                What your customers see on the hosted checkout and on their statement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Checkout display name"
                  hint="Appears at the top of the hosted checkout."
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={settings.checkoutDisplayName}
                      onChange={(event) =>
                        updateSettings({ checkoutDisplayName: event.target.value })
                      }
                    />
                  )}
                </FormField>

                <FormField
                  label="Statement descriptor"
                  hint="Up to 22 characters, shown on the cardholder's statement."
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={settings.statementDescriptor}
                      maxLength={22}
                      onChange={(event) =>
                        updateSettings({ statementDescriptor: event.target.value.toUpperCase() })
                      }
                      className="font-mono uppercase"
                    />
                  )}
                </FormField>
              </div>

              <Separator />

              <div>
                <p className="text-[13px] font-medium">Merchant logo</p>
                <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                  The demo uses initials instead of an uploaded image.
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <span className="bg-foreground text-background flex size-14 items-center justify-center rounded-xl text-[16px] font-semibold">
                    {settings.logoInitials}
                  </span>
                  <div className="w-32">
                    <Input
                      value={settings.logoInitials}
                      maxLength={3}
                      onChange={(event) =>
                        updateSettings({ logoInitials: event.target.value.toUpperCase() })
                      }
                      aria-label="Logo initials"
                      className="text-center font-semibold uppercase"
                    />
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Upload image
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-[13px] font-medium">Dashboard appearance</p>
                <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                  Applies to your merchant dashboard, not the customer checkout.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['light', 'dark', 'system'] as const).map((option) => (
                    <Button
                      key={option}
                      variant={theme === option ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme(option)}
                      className="capitalize"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------- Payment methods --------------------- */}
        <TabsContent value="methods" className="mt-5 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Payment methods</CardTitle>
              <CardDescription>
                Enabled methods appear on your hosted checkout immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {PAYMENT_METHOD_ROWS.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    {row.key === 'cards' && (
                      <span className="flex items-center -space-x-2">
                        <CardBrandMark brand="visa" />
                        <CardBrandMark brand="mastercard" className="shadow-sm" />
                      </span>
                    )}
                    {row.key === 'promptpay' && <PromptPayMark />}
                    {row.key === 'wallets' && (
                      <span className="flex items-center -space-x-2">
                        <WalletMark wallet="truemoney" />
                        <WalletMark wallet="linepay" className="shadow-sm" />
                      </span>
                    )}
                    {row.key === 'installments' && (
                      <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md text-[11px] font-bold">
                        0%
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium">{row.title}</p>
                      <p className="text-muted-foreground text-[12.5px]">{row.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.paymentMethods[row.key]}
                    onCheckedChange={(enabled) => {
                      togglePaymentMethod(row.key, enabled)
                      toast.success(`${row.title} ${enabled ? 'enabled' : 'disabled'}`)
                    }}
                    aria-label={row.title}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------- Demo ---------------------------- */}
        <TabsContent value="demo" className="mt-5 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Demo controls</CardTitle>
              <CardDescription>
                PayFlow keeps its state in your browser. Reset it whenever you want a clean run.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium">Show the guided tour again</p>
                  <p className="text-muted-foreground text-[12.5px]">
                    Restores the "Start Demo" callout on the dashboard.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    restoreDemoTour()
                    toast.success('Guided tour restored')
                  }}
                >
                  <Sparkles />
                  Restore
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium">Reset merchant settings</p>
                  <p className="text-muted-foreground text-[12.5px]">
                    Restores the default business profile and checkout configuration.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetSettings()
                    toast.success('Settings restored to defaults')
                  }}
                >
                  <RotateCcw />
                  Reset settings
                </Button>
              </div>

              <div className="border-danger-border bg-danger-bg/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium">Reset all demo data</p>
                  <p className="text-muted-foreground text-[12.5px]">
                    Deletes payments, transactions, webhooks and API logs you generated, and
                    restores the seeded dataset.
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setResetOpen(true)}>
                  <Trash2 />
                  Reset data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About this demo</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-[13px] leading-relaxed">
              <p>
                PayFlow is a frontend-only payment gateway simulation built as a portfolio and
                client-demonstration project. There is no backend, no database and no payment
                provider behind it — every transaction, webhook and API log you see was generated in
                this browser.
              </p>
              <p>
                Never enter real card or personal data. The sandbox card{' '}
                <span className="text-foreground font-mono">4242 4242 4242 4242</span> and OTP{' '}
                <span className="text-foreground font-mono">123456</span> are all you need.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all demo data?"
        description="Every payment, transaction, refund, webhook and API log created during this session will be deleted and the seeded dataset restored. This cannot be undone."
        confirmLabel="Reset data"
        destructive
        onConfirm={() => {
          resetDemoData()
          setResetOpen(false)
          toast.success('Demo data reset', { description: 'The seeded dataset has been restored.' })
        }}
      />
    </div>
  )
}
