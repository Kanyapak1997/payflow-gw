import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApiKeyPair, MerchantSettings, WebhookEndpoint, WebhookEventType } from '@/types'
import { defaultApiKeys, defaultMerchantSettings, defaultWebhookEndpoint } from '@/data/merchant'

function randomKeySuffix(length: number) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

interface SettingsState {
  settings: MerchantSettings
  apiKeys: ApiKeyPair
  webhookEndpoint: WebhookEndpoint

  updateSettings: (patch: Partial<MerchantSettings>) => void
  togglePaymentMethod: (method: keyof MerchantSettings['paymentMethods'], enabled: boolean) => void
  toggleNotification: (key: keyof MerchantSettings['notifications'], enabled: boolean) => void
  regenerateKey: (which: 'publishable' | 'secret') => void
  updateWebhookEndpoint: (patch: Partial<WebhookEndpoint>) => void
  toggleWebhookEvent: (event: WebhookEventType, enabled: boolean) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultMerchantSettings,
      apiKeys: defaultApiKeys,
      webhookEndpoint: defaultWebhookEndpoint,

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      togglePaymentMethod: (method, enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            paymentMethods: { ...state.settings.paymentMethods, [method]: enabled },
          },
        })),

      toggleNotification: (key, enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: { ...state.settings.notifications, [key]: enabled },
          },
        })),

      regenerateKey: (which) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            createdAt: new Date().toISOString(),
            ...(which === 'publishable'
              ? { publishableKey: `pk_test_51PAYFLOW${randomKeySuffix(6).toUpperCase()}` }
              : { secretKey: `sk_test_51PAYFLOW${randomKeySuffix(16)}` }),
          },
        })),

      updateWebhookEndpoint: (patch) =>
        set((state) => ({ webhookEndpoint: { ...state.webhookEndpoint, ...patch } })),

      toggleWebhookEvent: (event, enabled) =>
        set((state) => ({
          webhookEndpoint: {
            ...state.webhookEndpoint,
            events: enabled
              ? [...new Set([...state.webhookEndpoint.events, event])]
              : state.webhookEndpoint.events.filter((item) => item !== event),
          },
        })),

      resetSettings: () =>
        set({
          settings: defaultMerchantSettings,
          apiKeys: defaultApiKeys,
          webhookEndpoint: defaultWebhookEndpoint,
        }),
    }),
    { name: 'payflow.settings', version: 1 },
  ),
)
