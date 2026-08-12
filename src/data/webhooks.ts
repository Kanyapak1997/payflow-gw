import type { WebhookEvent, WebhookEventType } from '@/types'
import { addSeconds, parseISO } from 'date-fns'
import { buildWebhookPayload } from '@/lib/webhook'
import { defaultWebhookEndpoint } from './merchant'
import { transactions } from './transactions'

const transactionById = new Map(transactions.map((t) => [t.id, t]))

interface WebhookSeed {
  id: string
  transactionId: string
  type: WebhookEventType
  status?: WebhookEvent['status']
  httpStatus?: number
  durationMs?: number
  attempts?: number
  /** Seconds after the transaction was created */
  offset?: number
}

const seeds: WebhookSeed[] = [
  { id: 'evt_9k2mQpLd41', transactionId: 'TX-10291', type: 'payment.success', offset: 11, durationMs: 142 },
  { id: 'evt_9k2mQpLd40', transactionId: 'TX-10291', type: 'payment.created', offset: 0, durationMs: 118 },
  { id: 'evt_7t4bXcRw22', transactionId: 'TX-10290', type: 'payment.created', offset: 0, durationMs: 96 },
  {
    id: 'evt_5w8nZaTv19',
    transactionId: 'TX-10289',
    type: 'payment.failed',
    offset: 7,
    durationMs: 208,
  },
  { id: 'evt_3q6hYbMs77', transactionId: 'TX-10288', type: 'payment.success', offset: 17, durationMs: 133 },
  {
    id: 'evt_1e9rKdNp58',
    transactionId: 'TX-10287',
    type: 'payment.refunded',
    offset: 10910,
    durationMs: 176,
  },
  { id: 'evt_8y3vLfPq04', transactionId: 'TX-10287', type: 'payment.success', offset: 30, durationMs: 121 },
  { id: 'evt_2u5cWgHj63', transactionId: 'TX-10286', type: 'payment.success', offset: 32, durationMs: 154 },
  { id: 'evt_6i7dQnBz85', transactionId: 'TX-10285', type: 'payment.success', offset: 14, durationMs: 109 },
  { id: 'evt_4o1sFvCk36', transactionId: 'TX-10284', type: 'payment.success', offset: 47, durationMs: 187 },
  {
    id: 'evt_0p2aGxDl72',
    transactionId: 'TX-10283',
    type: 'payment.refunded',
    offset: 9039,
    durationMs: 163,
  },
  {
    id: 'evt_9z4jHyEm18',
    transactionId: 'TX-10281',
    type: 'payment.cancelled',
    offset: 67,
    durationMs: 88,
  },
  {
    id: 'evt_5m6kJzFn29',
    transactionId: 'TX-10280',
    type: 'payment.success',
    offset: 15,
    status: 'Failed',
    httpStatus: 503,
    attempts: 3,
    durationMs: 5012,
  },
  { id: 'evt_3n8lKaGo90', transactionId: 'TX-10279', type: 'payment.success', offset: 22, durationMs: 174 },
  {
    id: 'evt_7b0pMcIq51',
    transactionId: 'TX-10275',
    type: 'payment.failed',
    offset: 300,
    durationMs: 129,
  },
  { id: 'evt_1c2qNdJr62', transactionId: 'TX-10277', type: 'payment.success', offset: 45, durationMs: 147 },
  {
    id: 'evt_8d4rOeKs73',
    transactionId: 'TX-10268',
    type: 'payment.refunded',
    offset: 66284,
    durationMs: 191,
  },
  { id: 'evt_6f6sPfLt84', transactionId: 'TX-10276', type: 'payment.success', offset: 15, durationMs: 112 },
]

function build(seed: WebhookSeed): WebhookEvent {
  const transaction = transactionById.get(seed.transactionId)
  if (!transaction) throw new Error(`Unknown transaction ${seed.transactionId}`)
  const createdAt = addSeconds(parseISO(transaction.createdAt), seed.offset ?? 0).toISOString()

  return {
    id: seed.id,
    type: seed.type,
    transactionId: transaction.id,
    status: seed.status ?? 'Delivered',
    httpStatus: seed.httpStatus ?? 200,
    durationMs: seed.durationMs ?? 130,
    attempts: seed.attempts ?? 1,
    endpoint: defaultWebhookEndpoint.url,
    createdAt,
    payload: buildWebhookPayload(transaction, seed.type, createdAt),
  }
}

export const webhookEvents: WebhookEvent[] = seeds
  .map(build)
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
