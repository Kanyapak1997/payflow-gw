import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import type { CurrencyCode } from '@/types'

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  THB: '฿',
  USD: '$',
  SGD: 'S$',
  MYR: 'RM',
}

export const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'THB', label: 'THB — Thai Baht' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'MYR', label: 'MYR — Malaysian Ringgit' },
]

interface CurrencyOptions {
  /** Show decimals even for whole amounts. Defaults to true. */
  decimals?: boolean
  /** Render the ISO code after the amount, e.g. "฿1,290.00 THB" */
  withCode?: boolean
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'THB',
  options: CurrencyOptions = {},
) {
  const { decimals = true, withCode = false } = options
  const value = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(amount)
  return `${CURRENCY_SYMBOL[currency]}${value}${withCode ? ` ${currency}` : ''}`
}

/** Compact form for KPI tiles and axis labels: ฿1.2M */
export function formatCompactCurrency(amount: number, currency: CurrencyCode = 'THB') {
  const value = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
  return `${CURRENCY_SYMBOL[currency]}${value}`
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value)
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`
}

export function formatSignedPercent(value: number, digits = 1) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`
}

function toDate(value: string | Date) {
  return typeof value === 'string' ? parseISO(value) : value
}

/** 12 Aug 2026, 10:31 */
export function formatDateTime(value: string | Date) {
  return format(toDate(value), 'd MMM yyyy, HH:mm')
}

/** 12 Aug 2026 */
export function formatDate(value: string | Date) {
  return format(toDate(value), 'd MMM yyyy')
}

/** 12 Aug 10:31 */
export function formatShortDateTime(value: string | Date) {
  return format(toDate(value), 'd MMM HH:mm')
}

/** 10:31:02 */
export function formatTime(value: string | Date) {
  return format(toDate(value), 'HH:mm:ss')
}

/** 4 minutes ago */
export function formatRelative(value: string | Date) {
  return `${formatDistanceToNowStrict(toDate(value))} ago`
}

export function formatDuration(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
}

/** 04:59 — used by the PromptPay expiry countdown */
export function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function maskSecret(value: string, visible = 12) {
  if (value.length <= visible) return value
  return `${value.slice(0, visible)}${'•'.repeat(Math.min(20, value.length - visible))}`
}

export function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
