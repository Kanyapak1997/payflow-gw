import { addSeconds, parseISO } from 'date-fns'
import type { Transaction, TransactionEvent } from '@/types'
import { generateEventId } from '@/lib/utils'

type Tone = TransactionEvent['tone']

interface EventStep {
  /** Seconds after the transaction was created */
  offset: number
  type: string
  label: string
  description?: string
  tone: Tone
}

const CREATED: EventStep = {
  offset: 0,
  type: 'payment.created',
  label: 'Payment created',
  description: 'Payment intent registered with PayFlow.',
  tone: 'neutral',
}

const PROCESSING: EventStep = {
  offset: 2,
  type: 'payment.processing',
  label: 'Payment processing started',
  description: 'Request forwarded to the acquiring bank.',
  tone: 'info',
}

function stepsForCard(status: Transaction['status']): EventStep[] {
  const base: EventStep[] = [
    CREATED,
    PROCESSING,
    {
      offset: 4,
      type: 'payment.3ds_requested',
      label: '3D Secure authentication requested',
      description: 'Customer redirected to the issuing bank.',
      tone: 'info',
    },
  ]

  if (status === 'FAILED') {
    return [
      ...base,
      {
        offset: 8,
        type: 'payment.authenticated',
        label: 'Customer authenticated',
        description: '3D Secure challenge completed.',
        tone: 'info',
      },
      {
        offset: 9,
        type: 'payment.failed',
        label: 'Payment declined',
        description: 'Issuer responded with code 05 — do not honour.',
        tone: 'danger',
      },
    ]
  }

  if (status === 'CANCELLED') {
    return [
      ...base,
      {
        offset: 60,
        type: 'payment.cancelled',
        label: 'Payment cancelled',
        description: 'Customer cancelled the authentication step.',
        tone: 'neutral',
      },
    ]
  }

  return [
    ...base,
    {
      offset: 8,
      type: 'payment.authenticated',
      label: 'Customer authenticated',
      description: '3D Secure challenge completed successfully.',
      tone: 'info',
    },
    {
      offset: 10,
      type: 'payment.authorized',
      label: 'Payment authorized',
      description: 'Funds held on the customer card.',
      tone: 'success',
    },
    {
      offset: 11,
      type: 'payment.success',
      label: 'Payment successful',
      description: 'Transaction captured and settled to your balance.',
      tone: 'success',
    },
  ]
}

function stepsForPromptPay(status: Transaction['status']): EventStep[] {
  const base: EventStep[] = [
    CREATED,
    {
      offset: 1,
      type: 'payment.qr_generated',
      label: 'PromptPay QR generated',
      description: 'QR valid for 5 minutes.',
      tone: 'info',
    },
  ]

  if (status === 'PENDING') return base
  if (status === 'FAILED') {
    return [
      ...base,
      {
        offset: 300,
        type: 'payment.failed',
        label: 'QR expired',
        description: 'No payment was received before the QR expired.',
        tone: 'danger',
      },
    ]
  }
  if (status === 'CANCELLED') {
    return [
      ...base,
      { offset: 45, type: 'payment.cancelled', label: 'Payment cancelled', tone: 'neutral' },
    ]
  }

  return [
    ...base,
    {
      offset: 38,
      type: 'payment.processing',
      label: 'Bank transfer received',
      description: 'Funds received from the customer bank.',
      tone: 'info',
    },
    {
      offset: 45,
      type: 'payment.success',
      label: 'Payment successful',
      description: 'PromptPay transfer confirmed.',
      tone: 'success',
    },
  ]
}

function stepsForWallet(status: Transaction['status']): EventStep[] {
  const base: EventStep[] = [
    CREATED,
    {
      offset: 2,
      type: 'payment.redirected',
      label: 'Customer redirected to wallet',
      tone: 'info',
    },
  ]

  if (status === 'FAILED') {
    return [
      ...base,
      {
        offset: 14,
        type: 'payment.failed',
        label: 'Payment rejected',
        description: 'Customer rejected the request in the wallet app.',
        tone: 'danger',
      },
    ]
  }
  if (status === 'CANCELLED') {
    return [
      ...base,
      { offset: 60, type: 'payment.cancelled', label: 'Payment cancelled', tone: 'neutral' },
    ]
  }
  if (status === 'PENDING') return base

  return [
    ...base,
    {
      offset: 12,
      type: 'payment.authorized',
      label: 'Wallet payment approved',
      description: 'Customer approved the charge in the wallet app.',
      tone: 'success',
    },
    { offset: 16, type: 'payment.success', label: 'Payment successful', tone: 'success' },
  ]
}

function stepsForInstallment(status: Transaction['status']): EventStep[] {
  const base: EventStep[] = [
    CREATED,
    {
      offset: 3,
      type: 'payment.installment_selected',
      label: 'Installment plan selected',
      tone: 'info',
    },
    PROCESSING,
  ]

  if (status === 'FAILED') {
    return [
      ...base,
      {
        offset: 22,
        type: 'payment.failed',
        label: 'Installment declined',
        description: 'Issuing bank declined the installment application.',
        tone: 'danger',
      },
    ]
  }
  if (status === 'CANCELLED') {
    return [
      ...base,
      { offset: 40, type: 'payment.cancelled', label: 'Payment cancelled', tone: 'neutral' },
    ]
  }
  if (status === 'PENDING') return base

  return [
    ...base,
    {
      offset: 26,
      type: 'payment.authorized',
      label: 'Installment approved',
      description: 'Bank approved the installment plan.',
      tone: 'success',
    },
    { offset: 32, type: 'payment.success', label: 'Payment successful', tone: 'success' },
  ]
}

function refundSteps(transaction: Transaction): EventStep[] {
  if (transaction.refundedAmount <= 0) return []
  const full = transaction.refundedAmount >= transaction.amount
  const start = Math.max(
    120,
    (parseISO(transaction.updatedAt).getTime() - parseISO(transaction.createdAt).getTime()) / 1000 -
      6,
  )
  return [
    { offset: start, type: 'refund.requested', label: 'Refund requested', tone: 'warning' },
    { offset: start + 2, type: 'refund.processing', label: 'Refund processing', tone: 'info' },
    {
      offset: start + 6,
      type: full ? 'payment.refunded' : 'payment.partially_refunded',
      label: full ? 'Refund completed' : 'Partial refund completed',
      description: 'Funds returned to the original payment method.',
      tone: 'violet',
    },
  ]
}

/** Builds the canonical event history a transaction of this shape would have. */
export function buildTimeline(transaction: Transaction): TransactionEvent[] {
  const settledStatus =
    transaction.status === 'REFUNDED' || transaction.status === 'PARTIALLY_REFUNDED'
      ? 'SUCCESS'
      : transaction.status

  let steps: EventStep[]
  switch (transaction.paymentMethod.type) {
    case 'PROMPTPAY':
      steps = stepsForPromptPay(settledStatus)
      break
    case 'WALLET':
      steps = stepsForWallet(settledStatus)
      break
    case 'INSTALLMENT':
      steps = stepsForInstallment(settledStatus)
      break
    default:
      steps = stepsForCard(settledStatus)
  }

  const createdAt = parseISO(transaction.createdAt)
  return [...steps, ...refundSteps(transaction)].map((step) => ({
    id: generateEventId(),
    transactionId: transaction.id,
    type: step.type,
    label: step.label,
    description: step.description,
    tone: step.tone,
    timestamp: addSeconds(createdAt, step.offset).toISOString(),
  }))
}

/** Convenience factory for events appended at runtime by the demo flows. */
export function makeEvent(
  transactionId: string,
  type: string,
  label: string,
  tone: Tone,
  description?: string,
  timestamp = new Date().toISOString(),
): TransactionEvent {
  return { id: generateEventId(), transactionId, type, label, tone, description, timestamp }
}
