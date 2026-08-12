import { useState } from 'react'
import { AlertTriangle, Eye, EyeOff, KeyRound, RefreshCw, Terminal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import { PageHeader } from '@/components/common/page-header'
import { CopyButton } from '@/components/common/copy-button'
import { SandboxBadge } from '@/components/common/misc'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { useSettingsStore } from '@/stores/settings-store'
import { formatDateTime, maskSecret } from '@/lib/format'
import { SANDBOX } from '@/lib/payment'

export function ApiKeysPage() {
  const apiKeys = useSettingsStore((state) => state.apiKeys)
  const regenerateKey = useSettingsStore((state) => state.regenerateKey)
  const [revealed, setRevealed] = useState(false)
  const [pendingRegenerate, setPendingRegenerate] = useState<'publishable' | 'secret' | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Authenticate your server-side requests to the PayFlow API."
        badge={<SandboxBadge />}
      />

      <div className="border-warning-border bg-warning-bg flex items-start gap-3 rounded-lg border p-4">
        <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
        <div className="text-[13px]">
          <p className="font-medium">Sandbox Credentials</p>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">
            These keys are fictional and only exist in this browser. They authenticate nothing —
            regenerating them updates local state only.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publishable key</CardTitle>
          <CardDescription>
            Safe to embed in your web or mobile client. Used to tokenise card details in the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 flex items-center gap-2 rounded-md border p-2 pl-3">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px]">
              {apiKeys.publishableKey}
            </code>
            <Badge variant="secondary" size="sm">
              Public
            </Badge>
            <CopyButton value={apiKeys.publishableKey} label="Publishable key copied" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingRegenerate('publishable')}
            >
              <RefreshCw />
              Regenerate
            </Button>
            <span className="text-muted-foreground text-[12px]">
              Created {formatDateTime(apiKeys.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Secret key</CardTitle>
          <CardDescription>
            Server-side only. Treat it like a password — never expose it in client code or commit it
            to version control.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 flex items-center gap-2 rounded-md border p-2 pl-3">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px]">
              {revealed ? apiKeys.secretKey : maskSecret(apiKeys.secretKey)}
            </code>
            <Badge variant="danger" size="sm">
              Secret
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevealed((value) => !value)}
              aria-pressed={revealed}
            >
              {revealed ? <EyeOff /> : <Eye />}
              {revealed ? 'Hide' : 'Reveal'}
            </Button>
            <CopyButton value={apiKeys.secretKey} label="Secret key copied" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPendingRegenerate('secret')}>
              <RefreshCw />
              Regenerate
            </Button>
            <span className="text-muted-foreground text-[12px]">
              Last used {formatDateTime(apiKeys.lastUsedAt)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick start</CardTitle>
          <CardDescription>Create a payment with your sandbox credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <div className="bg-muted/40 flex items-center gap-2 border-b px-3 py-2">
              <Terminal className="text-muted-foreground size-3.5" />
              <span className="text-[12.5px] font-medium">cURL</span>
              <CopyButton
                className="ml-auto"
                label="Snippet copied"
                value={`curl https://api.payflow.demo/v1/payments \\
  -u ${apiKeys.secretKey}: \\
  -d orderId=INV-20260812-001 \\
  -d amount=2590 \\
  -d currency=THB \\
  -d "customer[email]=john@example.com"`}
              />
            </div>
            <pre className="scrollbar-thin bg-muted/20 overflow-x-auto p-3.5 font-mono text-[12.5px] leading-relaxed">
              <code>
                <span className="text-emerald-700 dark:text-emerald-300">curl</span>{' '}
                https://api.payflow.demo/v1/payments \{'\n'}
                {'  '}-u {revealed ? apiKeys.secretKey : maskSecret(apiKeys.secretKey, 14)}: \{'\n'}
                {'  '}-d orderId=INV-20260812-001 \{'\n'}
                {'  '}-d amount=2590 \{'\n'}
                {'  '}-d currency=THB \{'\n'}
                {'  '}-d "customer[email]=john@example.com"
              </code>
            </pre>
          </div>

          <Separator />

          <div>
            <p className="text-[13px] font-medium">Sandbox test data</p>
            <dl className="mt-2.5 grid gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-2">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Approved card</dt>
                <dd className="font-mono">{SANDBOX.successCard}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Declining card</dt>
                <dd className="font-mono">{SANDBOX.declineCard}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Expiry</dt>
                <dd>{SANDBOX.expiry}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">CVV</dt>
                <dd>{SANDBOX.cvv}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">3-D Secure OTP</dt>
                <dd className="font-mono">{SANDBOX.otp}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">API version</dt>
                <dd className="font-mono">2026-04-01</dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingRegenerate !== null}
        onOpenChange={(open) => !open && setPendingRegenerate(null)}
        title={`Regenerate ${pendingRegenerate === 'secret' ? 'secret' : 'publishable'} key?`}
        description={
          <>
            The current key stops working immediately and any integration using it will start
            returning <span className="font-mono">401 Unauthorized</span>. In this demo only local
            state changes.
          </>
        }
        confirmLabel="Regenerate key"
        destructive
        onConfirm={() => {
          if (pendingRegenerate) {
            regenerateKey(pendingRegenerate)
            setRevealed(false)
            toast.success(
              `${pendingRegenerate === 'secret' ? 'Secret' : 'Publishable'} key regenerated`,
              { description: 'Update your integration with the new value.' },
            )
            setPendingRegenerate(null)
          }
        }}
      >
        <div className="border-warning-border bg-warning-bg flex items-start gap-2.5 rounded-lg border p-3">
          <KeyRound className="text-warning mt-0.5 size-4 shrink-0" />
          <p className="text-[12.5px]">
            Make sure you can deploy the new key before regenerating in a real environment.
          </p>
        </div>
      </ConfirmDialog>
    </div>
  )
}
