import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ApiLog,
  CurrencyCode,
  Payment,
  PaymentLink,
  PaymentMethod,
  PaymentStatus,
  Refund,
  Transaction,
  TransactionEvent,
  WebhookEvent,
} from '@/types'
import { transactions as seedTransactions } from '@/data/transactions'
import { webhookEvents as seedWebhooks } from '@/data/webhooks'
import { apiLogs as seedApiLogs } from '@/data/apiLogs'
import { paymentLinks as seedPaymentLinks } from '@/data/paymentLinks'
import { defaultApiKeys, defaultWebhookEndpoint } from '@/data/merchant'
import { buildTimeline, makeEvent } from '@/lib/timeline'
import { makeWebhookEvent, webhookTypeForStatus } from '@/lib/webhook'
import {
  generateLinkId,
  generateLogId,
  generatePaymentId,
  generateRefundId,
  generateTransactionId,
} from '@/lib/utils'

const STORE_VERSION = 1

function seedEvents(): TransactionEvent[] {
  return seedTransactions.flatMap((transaction) => buildTimeline(transaction))
}

/* -------------------------------------------------------------------------- */
/*  API log helpers                                                            */
/* -------------------------------------------------------------------------- */

const BASE_REQUEST_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${defaultApiKeys.secretKey.slice(0, 14)}••••••••`,
  'PayFlow-Version': '2026-04-01',
  'User-Agent': 'PayFlow-Node/3.2.1',
}

function makeApiLog(params: {
  method: ApiLog['method']
  endpoint: string
  status: number
  requestBody: Record<string, unknown> | null
  responseBody: Record<string, unknown>
}): ApiLog {
  const id = generateLogId()
  const durationMs = 70 + Math.floor(Math.random() * 190)
  return {
    id,
    method: params.method,
    endpoint: params.endpoint,
    status: params.status,
    durationMs,
    createdAt: new Date().toISOString(),
    ipAddress: '203.150.12.44',
    requestHeaders: { ...BASE_REQUEST_HEADERS, 'Idempotency-Key': `idem_${id.slice(4)}` },
    requestBody: params.requestBody,
    responseHeaders: {
      'Content-Type': 'application/json',
      'PayFlow-Request-Id': id,
      'PayFlow-Version': '2026-04-01',
      'X-Response-Time': `${durationMs}ms`,
    },
    responseBody: params.responseBody,
  }
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                      */
/* -------------------------------------------------------------------------- */

export interface CreatePaymentInput {
  orderId: string
  amount: number
  currency: CurrencyCode
  description: string
  customerName: string
  customerEmail: string
  customerPhone?: string
}

export interface SettleCheckoutInput {
  paymentId: string
  method: PaymentMethod
  status: Extract<PaymentStatus, 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING'>
  responseCode: string
  responseMessage: string
}

export interface CreatePaymentLinkInput {
  name: string
  description?: string
  amount: number | null
  currency: CurrencyCode
  expiresAt?: string
}

interface PaymentState {
  transactions: Transaction[]
  events: TransactionEvent[]
  webhooks: WebhookEvent[]
  apiLogs: ApiLog[]
  payments: Payment[]
  paymentLinks: PaymentLink[]
  refunds: Refund[]

  createPayment: (input: CreatePaymentInput) => Payment
  getPayment: (paymentId: string) => Payment | undefined
  getTransaction: (transactionId: string) => Transaction | undefined
  settleCheckout: (input: SettleCheckoutInput) => Transaction
  refundTransaction: (transactionId: string, amount: number, reason: string) => Transaction | undefined
  resendWebhook: (webhookId: string) => void
  createPaymentLink: (input: CreatePaymentLinkInput) => PaymentLink
  setPaymentLinkStatus: (linkId: string, status: PaymentLink['status']) => void
  deletePaymentLink: (linkId: string) => void
  resetDemoData: () => void
}

const initialState = () => ({
  transactions: seedTransactions,
  events: seedEvents(),
  webhooks: seedWebhooks,
  apiLogs: seedApiLogs,
  payments: [] as Payment[],
  paymentLinks: seedPaymentLinks,
  refunds: [] as Refund[],
})

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      createPayment: (input) => {
        const payment: Payment = {
          id: generatePaymentId(),
          orderId: input.orderId,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          status: 'CREATED',
          createdAt: new Date().toISOString(),
        }

        const log = makeApiLog({
          method: 'POST',
          endpoint: '/v1/payments',
          status: 201,
          requestBody: {
            orderId: payment.orderId,
            amount: payment.amount,
            currency: payment.currency,
            description: payment.description,
            customer: {
              name: payment.customerName,
              email: payment.customerEmail,
              ...(payment.customerPhone ? { phone: payment.customerPhone } : {}),
            },
          },
          responseBody: {
            paymentId: payment.id,
            orderId: payment.orderId,
            status: 'CREATED',
            amount: payment.amount,
            currency: payment.currency,
            checkoutUrl: `https://payflow.demo/pay/${payment.id}`,
          },
        })

        set((state) => ({
          payments: [payment, ...state.payments],
          apiLogs: [log, ...state.apiLogs],
        }))

        return payment
      },

      getPayment: (paymentId) => get().payments.find((payment) => payment.id === paymentId),

      getTransaction: (transactionId) =>
        get().transactions.find((transaction) => transaction.id === transactionId),

      settleCheckout: ({ paymentId, method, status, responseCode, responseMessage }) => {
        const payment = get().payments.find((item) => item.id === paymentId)
        const now = new Date().toISOString()
        const settled = status === 'SUCCESS'

        const transaction: Transaction = {
          id: generateTransactionId(),
          orderId: payment?.orderId ?? 'INV-DEMO-000',
          paymentId,
          customerName: payment?.customerName ?? 'Demo Customer',
          customerEmail: payment?.customerEmail ?? 'customer@example.com',
          customerPhone: payment?.customerPhone,
          description: payment?.description,
          amount: payment?.amount ?? 0,
          refundedAmount: 0,
          currency: payment?.currency ?? 'THB',
          paymentMethod: method,
          status,
          authorizationCode: settled
            ? String(100000 + Math.floor(Math.random() * 899999))
            : undefined,
          responseCode,
          responseMessage,
          isDemo: true,
          createdAt: payment?.createdAt ?? now,
          updatedAt: now,
        }

        const events = buildTimeline(transaction)
        const webhookType = webhookTypeForStatus(status)
        const webhook = makeWebhookEvent(transaction, webhookType, { createdAt: now })
        const createdWebhook = makeWebhookEvent(transaction, 'payment.created', {
          createdAt: transaction.createdAt,
        })

        const log = makeApiLog({
          method: 'POST',
          endpoint: `/v1/payments/${paymentId}/confirm`,
          status: status === 'FAILED' ? 402 : 200,
          requestBody: {
            paymentId,
            paymentMethod: {
              type: method.type,
              ...(method.cardBrand ? { brand: method.cardBrand, last4: method.last4 } : {}),
              ...(method.wallet ? { wallet: method.wallet } : {}),
              ...(method.bank ? { bank: method.bank, months: method.installmentMonths } : {}),
            },
          },
          responseBody:
            status === 'FAILED'
              ? {
                  error: {
                    type: 'card_error',
                    code: 'card_declined',
                    declineCode: responseCode,
                    message: responseMessage,
                    transactionId: transaction.id,
                  },
                }
              : {
                  transactionId: transaction.id,
                  paymentId,
                  status,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  ...(transaction.authorizationCode
                    ? { authorizationCode: transaction.authorizationCode }
                    : {}),
                },
        })

        set((state) => ({
          transactions: [transaction, ...state.transactions],
          events: [...state.events, ...events],
          webhooks: [webhook, createdWebhook, ...state.webhooks],
          apiLogs: [log, ...state.apiLogs],
          payments: state.payments.map((item) =>
            item.id === paymentId ? { ...item, status, transactionId: transaction.id } : item,
          ),
        }))

        return transaction
      },

      refundTransaction: (transactionId, amount, reason) => {
        const existing = get().transactions.find((item) => item.id === transactionId)
        if (!existing) return undefined

        const refundedAmount = Math.min(existing.amount, existing.refundedAmount + amount)
        const full = refundedAmount >= existing.amount
        const now = new Date().toISOString()

        const updated: Transaction = {
          ...existing,
          refundedAmount,
          status: full ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          updatedAt: now,
        }

        const refund: Refund = {
          id: generateRefundId(),
          transactionId,
          amount,
          currency: existing.currency,
          reason,
          status: 'COMPLETED',
          createdAt: now,
        }

        const events: TransactionEvent[] = [
          makeEvent(
            transactionId,
            'refund.requested',
            'Refund requested',
            'warning',
            reason,
            new Date(Date.now() - 4000).toISOString(),
          ),
          makeEvent(
            transactionId,
            'refund.processing',
            'Refund processing',
            'info',
            'Refund submitted to the acquirer.',
            new Date(Date.now() - 2000).toISOString(),
          ),
          makeEvent(
            transactionId,
            full ? 'payment.refunded' : 'payment.partially_refunded',
            full ? 'Refund completed' : 'Partial refund completed',
            'violet',
            'Funds returned to the original payment method.',
            now,
          ),
        ]

        const webhook = makeWebhookEvent(updated, 'payment.refunded', { createdAt: now })
        const log = makeApiLog({
          method: 'POST',
          endpoint: '/v1/refunds',
          status: 200,
          requestBody: { transactionId, amount, reason },
          responseBody: {
            refundId: refund.id,
            transactionId,
            amount,
            currency: existing.currency,
            status: 'COMPLETED',
            transactionStatus: updated.status,
          },
        })

        set((state) => ({
          transactions: state.transactions.map((item) =>
            item.id === transactionId ? updated : item,
          ),
          events: [...state.events, ...events],
          refunds: [refund, ...state.refunds],
          webhooks: [webhook, ...state.webhooks],
          apiLogs: [log, ...state.apiLogs],
        }))

        return updated
      },

      resendWebhook: (webhookId) => {
        set((state) => ({
          webhooks: state.webhooks.map((event) =>
            event.id === webhookId
              ? {
                  ...event,
                  status: 'Delivered',
                  httpStatus: 200,
                  attempts: event.attempts + 1,
                  durationMs: 90 + Math.floor(Math.random() * 140),
                  createdAt: new Date().toISOString(),
                }
              : event,
          ),
          apiLogs: [
            makeApiLog({
              method: 'POST',
              endpoint: `/v1/webhooks/${defaultWebhookEndpoint.id}/events/${webhookId}/resend`,
              status: 200,
              requestBody: { eventId: webhookId },
              responseBody: { delivered: true, httpStatus: 200 },
            }),
            ...state.apiLogs,
          ],
        }))
      },

      createPaymentLink: (input) => {
        const link: PaymentLink = {
          id: generateLinkId(),
          name: input.name,
          description: input.description,
          amount: input.amount,
          currency: input.currency,
          usageCount: 0,
          revenue: 0,
          status: 'ACTIVE',
          expiresAt: input.expiresAt,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          paymentLinks: [link, ...state.paymentLinks],
          apiLogs: [
            makeApiLog({
              method: 'POST',
              endpoint: '/v1/payment-links',
              status: 201,
              requestBody: {
                name: link.name,
                amount: link.amount,
                currency: link.currency,
                ...(link.description ? { description: link.description } : {}),
              },
              responseBody: {
                linkId: link.id,
                url: `https://payflow.demo/link/${link.id}`,
                status: link.status,
                amount: link.amount,
                currency: link.currency,
              },
            }),
            ...state.apiLogs,
          ],
        }))

        return link
      },

      setPaymentLinkStatus: (linkId, status) =>
        set((state) => ({
          paymentLinks: state.paymentLinks.map((link) =>
            link.id === linkId ? { ...link, status } : link,
          ),
        })),

      deletePaymentLink: (linkId) =>
        set((state) => ({
          paymentLinks: state.paymentLinks.filter((link) => link.id !== linkId),
        })),

      resetDemoData: () => set({ ...initialState() }),
    }),
    {
      name: 'payflow.data',
      version: STORE_VERSION,
      // Seed data changed between versions — start the demo over rather than
      // trying to reconcile an old snapshot.
      migrate: () => initialState() as unknown as PaymentState,
      partialize: (state) => ({
        transactions: state.transactions,
        events: state.events,
        webhooks: state.webhooks,
        apiLogs: state.apiLogs,
        payments: state.payments,
        paymentLinks: state.paymentLinks,
        refunds: state.refunds,
      }),
    },
  ),
)

/**
 * Derivation helpers. They take the raw arrays rather than the store state so
 * callers can memoise them — a selector that builds a new array on every read
 * would defeat zustand's reference-equality check.
 */
export function filterTransactionEvents(events: TransactionEvent[], transactionId: string) {
  return events
    .filter((event) => event.transactionId === transactionId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function filterTransactionWebhooks(webhooks: WebhookEvent[], transactionId: string) {
  return webhooks
    .filter((event) => event.transactionId === transactionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
