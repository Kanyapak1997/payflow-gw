import type { Transaction, WebhookEvent, WebhookEventType } from '@/types'
import { generateEventId } from '@/lib/utils'
import { defaultWebhookEndpoint } from '@/data/merchant'

/** The `data` object PayFlow sends to merchant endpoints. */
export function webhookData(transaction: Transaction) {
  const data: Record<string, unknown> = {
    transactionId: transaction.id,
    paymentId: transaction.paymentId,
    orderId: transaction.orderId,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    paymentMethod: {
      type: transaction.paymentMethod.type,
      ...(transaction.paymentMethod.cardBrand
        ? { brand: transaction.paymentMethod.cardBrand, last4: transaction.paymentMethod.last4 }
        : {}),
      ...(transaction.paymentMethod.wallet ? { wallet: transaction.paymentMethod.wallet } : {}),
      ...(transaction.paymentMethod.bank
        ? { bank: transaction.paymentMethod.bank, months: transaction.paymentMethod.installmentMonths }
        : {}),
    },
    customer: {
      name: transaction.customerName,
      email: transaction.customerEmail,
    },
  }

  if (transaction.refundedAmount > 0) {
    data.refundedAmount = transaction.refundedAmount
    data.remainingAmount = transaction.amount - transaction.refundedAmount
  }
  if (transaction.status === 'FAILED') {
    data.failureCode = transaction.responseCode
    data.failureMessage = transaction.responseMessage
  }

  return data
}

export function buildWebhookPayload(
  transaction: Transaction,
  type: WebhookEventType,
  createdAt: string,
) {
  return {
    id: `evt_${transaction.id.replace('TX-', '')}`,
    event: type,
    livemode: false,
    createdAt,
    data: webhookData(transaction),
  }
}

/** Creates a delivered webhook event for a transaction state change. */
export function makeWebhookEvent(
  transaction: Transaction,
  type: WebhookEventType,
  overrides: Partial<Pick<WebhookEvent, 'status' | 'httpStatus' | 'durationMs' | 'createdAt'>> = {},
): WebhookEvent {
  const createdAt = overrides.createdAt ?? new Date().toISOString()
  return {
    id: generateEventId(),
    type,
    transactionId: transaction.id,
    status: overrides.status ?? 'Delivered',
    httpStatus: overrides.httpStatus ?? 200,
    durationMs: overrides.durationMs ?? 90 + Math.floor(Math.random() * 180),
    attempts: 1,
    endpoint: defaultWebhookEndpoint.url,
    createdAt,
    payload: buildWebhookPayload(transaction, type, createdAt),
  }
}

/** The webhook event type that corresponds to a settled transaction status. */
export function webhookTypeForStatus(status: Transaction['status']): WebhookEventType {
  switch (status) {
    case 'SUCCESS':
      return 'payment.success'
    case 'FAILED':
      return 'payment.failed'
    case 'CANCELLED':
      return 'payment.cancelled'
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'payment.refunded'
    case 'PROCESSING':
      return 'payment.processing'
    default:
      return 'payment.created'
  }
}
