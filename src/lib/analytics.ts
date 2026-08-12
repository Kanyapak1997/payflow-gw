import { format, subDays } from 'date-fns'
import type { PaymentMethodType, Transaction } from '@/types'
import { transactions as seedTransactions } from '@/data/transactions'

/**
 * Headline figures the dashboard opens with. Live demo payments are added on
 * top of these, so completing a checkout visibly moves the numbers.
 */
const HEADLINE = {
  volume: 1245890,
  successfulPayments: 1284,
  successRate: 94.8,
  refundVolume: 24500,
}

export const KPI_DELTAS = {
  volume: 12.4,
  successfulPayments: 8.2,
  successRate: 1.3,
  refundVolume: -3.1,
}

const SETTLED: Transaction['status'][] = ['SUCCESS', 'REFUNDED', 'PARTIALLY_REFUNDED']
/** Statuses that count as a completed attempt when computing success rate. */
const ATTEMPTED: Transaction['status'][] = [...SETTLED, 'FAILED', 'CANCELLED']

interface RawTotals {
  volume: number
  successful: number
  attempted: number
  refunds: number
}

function totalsOf(list: Transaction[]): RawTotals {
  return list.reduce<RawTotals>(
    (acc, tx) => {
      if (SETTLED.includes(tx.status)) {
        acc.volume += tx.amount
        acc.successful += 1
      }
      if (ATTEMPTED.includes(tx.status)) acc.attempted += 1
      acc.refunds += tx.refundedAmount
      return acc
    },
    { volume: 0, successful: 0, attempted: 0, refunds: 0 },
  )
}

const seedTotals = totalsOf(seedTransactions)
const baselineAttempted = Math.round(HEADLINE.successfulPayments / (HEADLINE.successRate / 100))

/** Portion of the headline figures not represented by the visible seed rows. */
const BASELINE: RawTotals = {
  volume: HEADLINE.volume - seedTotals.volume,
  successful: HEADLINE.successfulPayments - seedTotals.successful,
  attempted: baselineAttempted - seedTotals.attempted,
  refunds: HEADLINE.refundVolume - seedTotals.refunds,
}

export interface DashboardMetrics {
  volume: number
  successfulPayments: number
  successRate: number
  refundVolume: number
}

export function computeMetrics(list: Transaction[]): DashboardMetrics {
  const current = totalsOf(list)
  const attempted = BASELINE.attempted + current.attempted
  return {
    volume: BASELINE.volume + current.volume,
    successfulPayments: BASELINE.successful + current.successful,
    successRate: attempted === 0 ? 0 : ((BASELINE.successful + current.successful) / attempted) * 100,
    refundVolume: BASELINE.refunds + current.refunds,
  }
}

/* -------------------------------------------------------------------------- */
/*  Volume time series                                                         */
/* -------------------------------------------------------------------------- */

/** Deterministic PRNG so the chart is stable across renders and reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type RangeKey = '7d' | '30d' | '90d'

export const RANGE_OPTIONS: { value: RangeKey; label: string; days: number }[] = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: '90d', label: '90 days', days: 90 },
]

export interface VolumePoint {
  date: string
  label: string
  volume: number
  refunds: number
  transactions: number
}

/** Anchored to the demo "today" so the data always looks current. */
export const DEMO_TODAY = new Date('2026-08-12T23:59:59+07:00')

const seriesCache = new Map<RangeKey, VolumePoint[]>()

export function volumeSeries(range: RangeKey): VolumePoint[] {
  const cached = seriesCache.get(range)
  if (cached) return cached

  const days = RANGE_OPTIONS.find((option) => option.value === range)?.days ?? 30
  const random = mulberry32(20260812)
  const points: VolumePoint[] = []

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = subDays(DEMO_TODAY, i)
    const weekday = date.getDay()
    // Weekends run lighter; a gentle upward trend across the window.
    const weekendFactor = weekday === 0 || weekday === 6 ? 0.72 : 1
    const trend = 1 + ((days - i) / days) * 0.28
    const noise = 0.82 + random() * 0.4
    const volume = Math.round(34000 * weekendFactor * trend * noise)
    points.push({
      date: date.toISOString(),
      label: format(date, days > 30 ? 'd MMM' : 'd MMM'),
      volume,
      refunds: Math.round(volume * (0.005 + random() * 0.03)),
      transactions: Math.max(1, Math.round(volume / (1600 + random() * 900))),
    })
  }

  seriesCache.set(range, points)
  return points
}

/* -------------------------------------------------------------------------- */
/*  Payment method mix                                                         */
/* -------------------------------------------------------------------------- */

export interface MethodShare {
  type: PaymentMethodType
  label: string
  share: number
  volume: number
}

const METHOD_BASELINE: Record<PaymentMethodType, number> = {
  CARD: 42,
  PROMPTPAY: 31,
  WALLET: 18,
  INSTALLMENT: 9,
}

const METHOD_LABEL: Record<PaymentMethodType, string> = {
  CARD: 'Credit / Debit Card',
  PROMPTPAY: 'PromptPay',
  WALLET: 'Digital Wallet',
  INSTALLMENT: 'Installment',
}

export function methodShares(list: Transaction[], totalVolume: number): MethodShare[] {
  // The baseline is the headline mix. Only payments created during this demo
  // session shift it, so the dashboard opens on the documented numbers and
  // still visibly reacts when you complete a checkout.
  const liveWeights: Record<PaymentMethodType, number> = {
    CARD: 0,
    PROMPTPAY: 0,
    WALLET: 0,
    INSTALLMENT: 0,
  }
  let liveTotal = 0
  for (const tx of list) {
    if (!tx.isDemo || !SETTLED.includes(tx.status)) continue
    liveWeights[tx.paymentMethod.type] += 1
    liveTotal += 1
  }

  const baselineWeight = 40
  return (Object.keys(METHOD_BASELINE) as PaymentMethodType[])
    .map((type) => {
      const live = liveTotal === 0 ? 0 : (liveWeights[type] / liveTotal) * 100
      const share =
        (METHOD_BASELINE[type] * baselineWeight + live * liveTotal) / (baselineWeight + liveTotal)
      return {
        type,
        label: METHOD_LABEL[type],
        share,
        volume: Math.round((share / 100) * totalVolume),
      }
    })
    .sort((a, b) => b.share - a.share)
}
