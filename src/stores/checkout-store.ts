import { create } from 'zustand'
import type { InstallmentBank, PaymentMethod, WalletProvider } from '@/types'

export type CheckoutStep =
  | 'select'
  | 'method'
  | 'processing'
  | 'authenticating'
  | 'redirecting'
  | 'result'

export type CheckoutResultStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING'

export interface CheckoutResult {
  status: CheckoutResultStatus
  transactionId: string
  responseCode: string
  responseMessage: string
  method: PaymentMethod
}

interface CheckoutState {
  paymentId: string | null
  step: CheckoutStep
  /** Which tab of the payment-method selector is open */
  selectedMethod: PaymentMethod['type'] | null
  selectedWallet: WalletProvider | null
  selectedBank: InstallmentBank | null
  selectedPlanMonths: number | null
  processingLabel: string
  result: CheckoutResult | null

  beginSession: (paymentId: string) => void
  setStep: (step: CheckoutStep, processingLabel?: string) => void
  selectMethod: (method: PaymentMethod['type'] | null) => void
  selectWallet: (wallet: WalletProvider | null) => void
  selectBank: (bank: InstallmentBank | null) => void
  selectPlan: (months: number | null) => void
  finish: (result: CheckoutResult) => void
  restart: () => void
}

const blankSession = {
  step: 'select' as CheckoutStep,
  selectedMethod: null,
  selectedWallet: null,
  selectedBank: null,
  selectedPlanMonths: null,
  processingLabel: 'Processing your payment',
  result: null,
}

export const useCheckoutStore = create<CheckoutState>()((set, get) => ({
  paymentId: null,
  ...blankSession,

  beginSession: (paymentId) => {
    // Keep an in-flight session if the component remounts for the same payment.
    if (get().paymentId === paymentId) return
    set({ paymentId, ...blankSession })
  },

  setStep: (step, processingLabel) =>
    set((state) => ({ step, processingLabel: processingLabel ?? state.processingLabel })),

  selectMethod: (selectedMethod) =>
    set({ selectedMethod, step: selectedMethod ? 'method' : 'select' }),

  selectWallet: (selectedWallet) => set({ selectedWallet }),
  selectBank: (selectedBank) => set({ selectedBank }),
  selectPlan: (selectedPlanMonths) => set({ selectedPlanMonths }),

  finish: (result) => set({ result, step: 'result' }),

  restart: () => set({ ...blankSession }),
}))
