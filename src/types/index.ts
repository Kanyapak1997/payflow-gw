/**
 * Domain models for the PayFlow demo platform.
 *
 * These mirror the shape of a real card-acquiring gateway (payment intent →
 * transaction → events → webhooks) so the demo reads as a plausible product,
 * but nothing here ever leaves the browser.
 */

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'REQUIRES_ACTION'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export type CurrencyCode = 'THB' | 'USD' | 'SGD' | 'MYR'

export type PaymentMethodType = 'CARD' | 'PROMPTPAY' | 'WALLET' | 'INSTALLMENT'

export type CardBrand = 'visa' | 'mastercard' | 'jcb' | 'amex' | 'unionpay' | 'unknown'

export type WalletProvider = 'truemoney' | 'linepay' | 'shopeepay'

export type InstallmentBank = 'kbank' | 'scb' | 'krungsri' | 'ktc'

export interface PaymentMethod {
  type: PaymentMethodType
  /** Human label rendered in tables, e.g. "Visa •••• 4242" */
  label: string
  cardBrand?: CardBrand
  last4?: string
  wallet?: WalletProvider
  bank?: InstallmentBank
  installmentMonths?: number
}

export interface TransactionEvent {
  id: string
  transactionId: string
  /** Machine name, e.g. payment.authorized */
  type: string
  label: string
  description?: string
  timestamp: string
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'violet'
}

export interface Refund {
  id: string
  transactionId: string
  amount: number
  currency: CurrencyCode
  reason: string
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: string
}

export interface Transaction {
  id: string
  orderId: string
  paymentId: string
  customerId?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  description?: string
  amount: number
  refundedAmount: number
  currency: CurrencyCode
  paymentMethod: PaymentMethod
  status: PaymentStatus
  authorizationCode?: string
  responseCode: string
  responseMessage: string
  /** True when the transaction was produced by the interactive demo flow */
  isDemo?: boolean
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  /** Two-letter country code used for the flag/label in the customer panel */
  country: string
  totalSpend: number
  paymentsCount: number
  lastPaymentAt: string
  createdAt: string
  savedMethods: PaymentMethod[]
}

export type WebhookEventType =
  | 'payment.created'
  | 'payment.processing'
  | 'payment.success'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'payment.refunded'

export interface WebhookEvent {
  id: string
  type: WebhookEventType
  transactionId: string
  status: 'Delivered' | 'Failed' | 'Pending' | 'Retrying'
  httpStatus: number
  durationMs: number
  attempts: number
  endpoint: string
  createdAt: string
  payload: Record<string, unknown>
}

export interface ApiLog {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  status: number
  durationMs: number
  createdAt: string
  ipAddress: string
  requestHeaders: Record<string, string>
  requestBody: Record<string, unknown> | null
  responseHeaders: Record<string, string>
  responseBody: Record<string, unknown>
}

export type PaymentLinkStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED'

export interface PaymentLink {
  id: string
  name: string
  description?: string
  amount: number | null
  currency: CurrencyCode
  usageCount: number
  revenue: number
  status: PaymentLinkStatus
  expiresAt?: string
  createdAt: string
}

/** A payment intent created by the merchant, before the customer pays. */
export interface Payment {
  id: string
  orderId: string
  amount: number
  currency: CurrencyCode
  description: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  status: PaymentStatus
  /** Set once the customer completes checkout */
  transactionId?: string
  createdAt: string
}

export interface MerchantSettings {
  businessName: string
  merchantId: string
  defaultCurrency: CurrencyCode
  timezone: string
  supportEmail: string
  website: string
  checkoutDisplayName: string
  statementDescriptor: string
  logoInitials: string
  brandColor: string
  paymentMethods: {
    cards: boolean
    promptpay: boolean
    wallets: boolean
    installments: boolean
  }
  notifications: {
    paymentSuccess: boolean
    paymentFailed: boolean
    refunds: boolean
    weeklyDigest: boolean
  }
}

export interface ApiKeyPair {
  publishableKey: string
  secretKey: string
  createdAt: string
  lastUsedAt: string
}

export interface WebhookEndpoint {
  id: string
  url: string
  signingSecret: string
  enabled: boolean
  events: WebhookEventType[]
  createdAt: string
}

/** Result of a simulated checkout attempt, shared by every payment method. */
export interface CheckoutOutcome {
  status: Extract<PaymentStatus, 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED'>
  transactionId: string
  responseCode: string
  responseMessage: string
}
