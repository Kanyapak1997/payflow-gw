import { Suspense, lazy, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Banknote, Plus, RotateCcw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/common/page-header'
import { MetricCard } from '@/components/common/misc'
import { DemoCallout } from '@/components/dashboard/demo-callout'
import { RangeSelector } from '@/components/dashboard/range-selector'
import { MethodBreakdown } from '@/components/dashboard/method-breakdown'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { Skeleton } from '@/components/ui/misc'
import { usePaymentStore } from '@/stores/payment-store'
import { useSimulatedLoading } from '@/hooks/use-simulated-loading'
import { KPI_DELTAS, computeMetrics, methodShares, type RangeKey } from '@/lib/analytics'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { merchantUser } from '@/data/merchant'

// Recharts is the heaviest dependency in the app; keep it out of the entry
// chunk and stream it in behind a skeleton.
const VolumeChart = lazy(() => import('@/components/dashboard/volume-chart'))

export function DashboardPage() {
  const navigate = useNavigate()
  const transactions = usePaymentStore((state) => state.transactions)
  const [range, setRange] = useState<RangeKey>('30d')
  const loading = useSimulatedLoading()

  const metrics = useMemo(() => computeMetrics(transactions), [transactions])
  const shares = useMemo(
    () => methodShares(transactions, metrics.volume),
    [transactions, metrics.volume],
  )
  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
    [transactions],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${merchantUser.firstName}`}
        description="Here's what's happening with your payments today."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/transactions">View all transactions</Link>
            </Button>
            <Button onClick={() => navigate('/payments/create')}>
              <Plus />
              Create Payment
            </Button>
          </>
        }
      />

      <DemoCallout />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Payment Volume"
          value={formatCurrency(metrics.volume, 'THB', { decimals: false })}
          delta={KPI_DELTAS.volume}
          icon={Banknote}
          loading={loading}
        />
        <MetricCard
          label="Successful Payments"
          value={formatNumber(metrics.successfulPayments)}
          delta={KPI_DELTAS.successfulPayments}
          icon={BadgeCheck}
          loading={loading}
        />
        <MetricCard
          label="Success Rate"
          value={formatPercent(metrics.successRate)}
          delta={KPI_DELTAS.successRate}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          label="Refund Volume"
          value={formatCurrency(metrics.refundVolume, 'THB', { decimals: false })}
          delta={KPI_DELTAS.refundVolume}
          deltaLabel="compared with last month"
          icon={RotateCcw}
          invertDelta
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Payment volume</CardTitle>
                <CardDescription>
                  Successfully captured payments, settled in THB.
                </CardDescription>
              </div>
              <RangeSelector value={range} onChange={setRange} />
            </div>
          </CardHeader>
          <CardContent className="pl-1">
            <Suspense fallback={<Skeleton className="mr-4 h-[300px] w-full" />}>
              <VolumeChart range={range} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment methods</CardTitle>
            <CardDescription>Share of captured volume by method.</CardDescription>
          </CardHeader>
          <CardContent>
            <MethodBreakdown shares={shares} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>The latest payments processed through PayFlow.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/transactions">
                View all
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="border-t">
            <TransactionTable transactions={recent} loading={loading} variant="recent" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
