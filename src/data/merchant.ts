import type { ApiKeyPair, MerchantSettings, WebhookEndpoint, WebhookEventType } from '@/types'

export const merchantUser = {
  name: 'Alex Morgan',
  firstName: 'Alex',
  email: 'alex@demostore.com',
  role: 'Owner',
  initials: 'AM',
}

export const defaultMerchantSettings: MerchantSettings = {
  businessName: 'Demo Store Co., Ltd.',
  merchantId: 'MERCHANT-DEMO-001',
  defaultCurrency: 'THB',
  timezone: 'Asia/Bangkok',
  supportEmail: 'support@demostore.com',
  website: 'https://demostore.com',
  checkoutDisplayName: 'Demo Store',
  statementDescriptor: 'DEMOSTORE',
  logoInitials: 'DS',
  brandColor: '#4f46e5',
  paymentMethods: {
    cards: true,
    promptpay: true,
    wallets: true,
    installments: true,
  },
  notifications: {
    paymentSuccess: true,
    paymentFailed: true,
    refunds: true,
    weeklyDigest: false,
  },
}

export const defaultApiKeys: ApiKeyPair = {
  publishableKey: 'pk_test_51PAYFLOW823910',
  secretKey: 'sk_test_51PAYFLOWq7Kd2mXs9RtLb4Vn',
  createdAt: '2026-01-08T09:12:00+07:00',
  lastUsedAt: '2026-08-12T10:31:02+07:00',
}

export const ALL_WEBHOOK_EVENTS: WebhookEventType[] = [
  'payment.created',
  'payment.processing',
  'payment.success',
  'payment.failed',
  'payment.cancelled',
  'payment.refunded',
]

export const defaultWebhookEndpoint: WebhookEndpoint = {
  id: 'we_2fK9dQ',
  url: 'https://api.demostore.com/webhooks/payflow',
  signingSecret: 'whsec_8fJ2kLp0QzR4tVn7XwYb3Ac5',
  enabled: true,
  events: ALL_WEBHOOK_EVENTS,
  createdAt: '2026-01-08T09:14:00+07:00',
}

export const TIMEZONES = [
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Jakarta',
  'Asia/Tokyo',
  'UTC',
]
