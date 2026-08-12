import type {
  CardBrand,
  InstallmentBank,
  PaymentMethod,
  PaymentMethodType,
  PaymentStatus,
  WalletProvider,
} from '@/types'

/* -------------------------------------------------------------------------- */
/*  Status metadata                                                            */
/* -------------------------------------------------------------------------- */

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral'

interface StatusMeta {
  label: string
  tone: StatusTone
  /** Longer copy used on summary cards and result screens */
  description: string
}

export const STATUS_META: Record<PaymentStatus, StatusMeta> = {
  CREATED: {
    label: 'Created',
    tone: 'neutral',
    description: 'Payment created, awaiting customer action.',
  },
  PENDING: {
    label: 'Pending',
    tone: 'warning',
    description: 'Waiting for the customer to complete payment.',
  },
  PROCESSING: {
    label: 'Processing',
    tone: 'info',
    description: 'Payment is being processed by the acquirer.',
  },
  REQUIRES_ACTION: {
    label: 'Requires action',
    tone: 'info',
    description: 'Additional authentication is required.',
  },
  SUCCESS: { label: 'Success', tone: 'success', description: 'Successful' },
  FAILED: { label: 'Failed', tone: 'danger', description: 'Payment was declined.' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', description: 'Cancelled before completion.' },
  REFUNDED: { label: 'Refunded', tone: 'violet', description: 'Fully refunded to the customer.' },
  PARTIALLY_REFUNDED: {
    label: 'Partially refunded',
    tone: 'violet',
    description: 'Part of this payment has been refunded.',
  },
}

export const ALL_STATUSES = Object.keys(STATUS_META) as PaymentStatus[]

/** Statuses a merchant would realistically filter a transaction list by. */
export const FILTERABLE_STATUSES: PaymentStatus[] = [
  'SUCCESS',
  'PENDING',
  'PROCESSING',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
]

export function isRefundable(status: PaymentStatus) {
  return status === 'SUCCESS' || status === 'PARTIALLY_REFUNDED'
}

/* -------------------------------------------------------------------------- */
/*  Payment methods                                                            */
/* -------------------------------------------------------------------------- */

export const PAYMENT_METHOD_LABEL: Record<PaymentMethodType, string> = {
  CARD: 'Credit / Debit Card',
  PROMPTPAY: 'PromptPay',
  WALLET: 'Digital Wallet',
  INSTALLMENT: 'Installment',
}

export const CARD_BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  jcb: 'JCB',
  amex: 'American Express',
  unionpay: 'UnionPay',
  unknown: 'Card',
}

export const WALLET_LABEL: Record<WalletProvider, string> = {
  truemoney: 'TrueMoney Wallet',
  linepay: 'LINE Pay',
  shopeepay: 'ShopeePay',
}

export const BANK_LABEL: Record<InstallmentBank, string> = {
  kbank: 'KBank',
  scb: 'SCB',
  krungsri: 'Krungsri',
  ktc: 'KTC',
}

export function cardMethod(brand: CardBrand, last4: string): PaymentMethod {
  return {
    type: 'CARD',
    cardBrand: brand,
    last4,
    label: `${CARD_BRAND_LABEL[brand]} •••• ${last4}`,
  }
}

export function promptPayMethod(): PaymentMethod {
  return { type: 'PROMPTPAY', label: 'PromptPay' }
}

export function walletMethod(wallet: WalletProvider): PaymentMethod {
  return { type: 'WALLET', wallet, label: WALLET_LABEL[wallet] }
}

export function installmentMethod(bank: InstallmentBank, months: number): PaymentMethod {
  return {
    type: 'INSTALLMENT',
    bank,
    installmentMonths: months,
    label: `${BANK_LABEL[bank]} ${months}-month installment`,
  }
}

/* -------------------------------------------------------------------------- */
/*  Card input helpers                                                         */
/* -------------------------------------------------------------------------- */

/** Detects a brand from the leading digits — enough for a convincing demo. */
export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D/g, '')
  if (!digits) return 'unknown'
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^35/.test(digits)) return 'jcb'
  if (/^62/.test(digits)) return 'unionpay'
  return 'unknown'
}

export function cardNumberLength(brand: CardBrand) {
  return brand === 'amex' ? 15 : 16
}

export function cvvLength(brand: CardBrand) {
  return brand === 'amex' ? 4 : 3
}

/** Groups digits the way the brand prints them on the card face. */
export function formatCardNumber(value: string, brand = detectCardBrand(value)) {
  const digits = value.replace(/\D/g, '').slice(0, cardNumberLength(brand))
  const groups = brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4]
  const parts: string[] = []
  let cursor = 0
  for (const size of groups) {
    if (cursor >= digits.length) break
    parts.push(digits.slice(cursor, cursor + size))
    cursor += size
  }
  return parts.join(' ')
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function isExpiryValid(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  const expiry = new Date(year, month, 1)
  return expiry > now
}

/** Luhn check — the demo accepts any Luhn-valid number, not just the test card. */
export function isLuhnValid(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 13) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i])
    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    double = !double
  }
  return sum % 10 === 0
}

/* -------------------------------------------------------------------------- */
/*  Sandbox test data                                                          */
/* -------------------------------------------------------------------------- */

export const SANDBOX = {
  successCard: '4242 4242 4242 4242',
  declineCard: '4000 0000 0000 0002',
  otp: '123456',
  expiry: 'Any future date',
  cvv: 'Any 3 digits',
} as const

/**
 * Cards beginning with 4000 are reserved as the "always declines" range so the
 * failure path can be demonstrated on demand. Everything else is approved.
 */
export function shouldCardDecline(cardNumber: string) {
  return cardNumber.replace(/\D/g, '').startsWith('4000')
}

/* -------------------------------------------------------------------------- */
/*  Response codes                                                             */
/* -------------------------------------------------------------------------- */

export const RESPONSE_CODES = {
  approved: { code: '00', message: 'Approved' },
  declinedByIssuer: { code: '05', message: 'Payment was declined by issuer.' },
  insufficientFunds: { code: '51', message: 'Insufficient funds.' },
  authFailed: { code: '4T', message: '3D Secure authentication failed.' },
  cancelled: { code: '17', message: 'Cancelled by customer.' },
  expired: { code: '54', message: 'Payment window expired.' },
  pending: { code: '09', message: 'Awaiting customer payment.' },
  walletRejected: { code: '05', message: 'Payment rejected in wallet application.' },
} as const

/* -------------------------------------------------------------------------- */
/*  Installments                                                               */
/* -------------------------------------------------------------------------- */

export interface InstallmentPlan {
  months: number
  /** Annual interest rate applied by the issuing bank, 0 for interest-free. */
  interestRate: number
}

export const INSTALLMENT_PLANS: InstallmentPlan[] = [
  { months: 3, interestRate: 0 },
  { months: 6, interestRate: 0 },
  { months: 10, interestRate: 0.8 },
]

export function installmentQuote(amount: number, plan: InstallmentPlan) {
  const total = amount * (1 + (plan.interestRate / 100) * (plan.months / 12))
  return {
    monthly: total / plan.months,
    total,
    interestRate: plan.interestRate,
  }
}

export const INSTALLMENT_MIN_AMOUNT = 3000
