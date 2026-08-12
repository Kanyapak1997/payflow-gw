import type { ApiLog } from '@/types'
import { defaultApiKeys } from './merchant'

const REQUEST_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${defaultApiKeys.secretKey.slice(0, 14)}••••••••`,
  'PayFlow-Version': '2026-04-01',
  'Idempotency-Key': 'idem_9fK2mQ7pLd41',
  'User-Agent': 'PayFlow-Node/3.2.1',
}

function responseHeaders(requestId: string, durationMs: number): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'PayFlow-Request-Id': requestId,
    'PayFlow-Version': '2026-04-01',
    'X-Ratelimit-Limit': '100',
    'X-Ratelimit-Remaining': '97',
    'X-Response-Time': `${durationMs}ms`,
  }
}

interface LogSeed {
  id: string
  method: ApiLog['method']
  endpoint: string
  status: number
  durationMs: number
  createdAt: string
  requestBody?: Record<string, unknown> | null
  responseBody: Record<string, unknown>
  ipAddress?: string
}

const seeds: LogSeed[] = [
  {
    id: 'req_9fK2mQ7pLd41',
    method: 'POST',
    endpoint: '/v1/payments',
    status: 200,
    durationMs: 214,
    createdAt: '2026-08-12T10:31:02+07:00',
    requestBody: {
      orderId: 'INV-20260812-001',
      amount: 2590,
      currency: 'THB',
      description: 'Premium Headphones',
      customer: { name: 'John Doe', email: 'john@example.com' },
      paymentMethods: ['card', 'promptpay', 'wallet', 'installment'],
    },
    responseBody: {
      paymentId: 'PAY-829104',
      orderId: 'INV-20260812-001',
      status: 'CREATED',
      amount: 2590,
      currency: 'THB',
      checkoutUrl: 'https://payflow.demo/pay/PAY-829104',
      expiresAt: '2026-08-12T11:31:02+07:00',
    },
  },
  {
    id: 'req_7t4bXcRw2290',
    method: 'GET',
    endpoint: '/v1/payments/TX-10291',
    status: 200,
    durationMs: 84,
    createdAt: '2026-08-12T10:32:14+07:00',
    requestBody: null,
    responseBody: {
      transactionId: 'TX-10291',
      paymentId: 'PAY-829104',
      status: 'SUCCESS',
      amount: 2590,
      currency: 'THB',
      paymentMethod: { type: 'CARD', brand: 'visa', last4: '4242' },
      authorizationCode: '482910',
    },
  },
  {
    id: 'req_1e9rKdNp5877',
    method: 'POST',
    endpoint: '/v1/refunds',
    status: 200,
    durationMs: 183,
    createdAt: '2026-08-12T11:04:21+07:00',
    requestBody: {
      transactionId: 'TX-10287',
      amount: 2900,
      reason: 'Customer requested refund',
    },
    responseBody: {
      refundId: 're_4Kd82nQpLz',
      transactionId: 'TX-10287',
      amount: 2900,
      currency: 'THB',
      status: 'COMPLETED',
      transactionStatus: 'PARTIALLY_REFUNDED',
    },
  },
  {
    id: 'req_5w8nZaTv1903',
    method: 'POST',
    endpoint: '/v1/payments',
    status: 402,
    durationMs: 241,
    createdAt: '2026-08-12T09:12:44+07:00',
    requestBody: {
      orderId: 'INV-20260812-003',
      amount: 3900,
      currency: 'THB',
      customer: { name: 'Alex Wong', email: 'alex.wong@example.com' },
    },
    responseBody: {
      error: {
        type: 'card_error',
        code: 'card_declined',
        declineCode: '05',
        message: 'Payment was declined by issuer.',
        transactionId: 'TX-10289',
      },
    },
  },
  {
    id: 'req_3q6hYbMs7712',
    method: 'GET',
    endpoint: '/v1/transactions?limit=25&status=SUCCESS',
    status: 200,
    durationMs: 132,
    createdAt: '2026-08-12T08:55:10+07:00',
    requestBody: null,
    responseBody: {
      object: 'list',
      hasMore: true,
      count: 25,
      data: ['TX-10291', 'TX-10288', 'TX-10287', '…'],
    },
  },
  {
    id: 'req_8y3vLfPq0455',
    method: 'POST',
    endpoint: '/v1/payment-links',
    status: 201,
    durationMs: 168,
    createdAt: '2026-08-12T08:14:33+07:00',
    requestBody: {
      name: 'Premium Plan',
      amount: 1990,
      currency: 'THB',
      description: 'Monthly premium subscription',
    },
    responseBody: {
      linkId: 'plink_20192',
      url: 'https://payflow.demo/link/plink_20192',
      status: 'ACTIVE',
      amount: 1990,
      currency: 'THB',
    },
  },
  {
    id: 'req_2u5cWgHj6320',
    method: 'GET',
    endpoint: '/v1/customers/cus_8Q1LMd',
    status: 200,
    durationMs: 71,
    createdAt: '2026-08-12T07:48:26+07:00',
    requestBody: null,
    responseBody: {
      id: 'cus_8Q1LMd',
      name: 'John Doe',
      email: 'john@example.com',
      totalSpend: 32500,
      paymentsCount: 12,
    },
  },
  {
    id: 'req_6i7dQnBz8541',
    method: 'POST',
    endpoint: '/v1/payments',
    status: 200,
    durationMs: 196,
    createdAt: '2026-08-12T07:31:12+07:00',
    requestBody: {
      orderId: 'INV-20260812-006',
      amount: 6890,
      currency: 'THB',
      installment: { bank: 'kbank', months: 6 },
    },
    responseBody: {
      paymentId: 'PAY-829099',
      status: 'CREATED',
      amount: 6890,
      currency: 'THB',
      checkoutUrl: 'https://payflow.demo/pay/PAY-829099',
    },
  },
  {
    id: 'req_4o1sFvCk3688',
    method: 'POST',
    endpoint: '/v1/webhooks/we_2fK9dQ/test',
    status: 200,
    durationMs: 312,
    createdAt: '2026-08-11T20:02:07+07:00',
    requestBody: { event: 'payment.success' },
    responseBody: { delivered: true, httpStatus: 200, durationMs: 142 },
  },
  {
    id: 'req_0p2aGxDl7219',
    method: 'GET',
    endpoint: '/v1/balance',
    status: 200,
    durationMs: 58,
    createdAt: '2026-08-11T18:40:52+07:00',
    requestBody: null,
    responseBody: {
      available: [{ amount: 984320, currency: 'THB' }],
      pending: [{ amount: 128450, currency: 'THB' }],
    },
  },
  {
    id: 'req_9z4jHyEm1873',
    method: 'PUT',
    endpoint: '/v1/payment-links/plink_20193',
    status: 200,
    durationMs: 121,
    createdAt: '2026-08-11T16:22:41+07:00',
    requestBody: { status: 'DISABLED' },
    responseBody: { linkId: 'plink_20193', status: 'DISABLED' },
  },
  {
    id: 'req_5m6kJzFn2934',
    method: 'GET',
    endpoint: '/v1/transactions/TX-99999',
    status: 404,
    durationMs: 44,
    createdAt: '2026-08-11T14:09:18+07:00',
    requestBody: null,
    responseBody: {
      error: {
        type: 'invalid_request_error',
        code: 'resource_missing',
        message: "No such transaction: 'TX-99999'",
      },
    },
  },
  {
    id: 'req_3n8lKaGo9065',
    method: 'DELETE',
    endpoint: '/v1/customers/cus_legacy_04',
    status: 200,
    durationMs: 97,
    createdAt: '2026-08-10T11:55:03+07:00',
    requestBody: null,
    responseBody: { id: 'cus_legacy_04', deleted: true },
  },
]

export const apiLogs: ApiLog[] = seeds
  .map((seed) => ({
    id: seed.id,
    method: seed.method,
    endpoint: seed.endpoint,
    status: seed.status,
    durationMs: seed.durationMs,
    createdAt: seed.createdAt,
    ipAddress: seed.ipAddress ?? '203.150.12.44',
    requestHeaders:
      seed.method === 'GET' || seed.method === 'DELETE'
        ? { ...REQUEST_HEADERS, 'Content-Type': 'application/json', 'Idempotency-Key': '—' }
        : REQUEST_HEADERS,
    requestBody: seed.requestBody ?? null,
    responseHeaders: responseHeaders(seed.id, seed.durationMs),
    responseBody: seed.responseBody,
  }))
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
