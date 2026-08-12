import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import type {
  CheckoutOutcome,
  InstallmentBank,
  PaymentMethod,
  PaymentMethodType,
  WalletProvider,
} from '@/types'
import { Button } from '@/components/ui/button'
import { PayFlowLogo } from '@/components/common/brand-marks'
import { EmptyState } from '@/components/common/misc'
import { CheckoutLayout } from '@/components/checkout/checkout-layout'
import { PaymentMethodSelector } from '@/components/checkout/payment-method-selector'
import { CardForm, type CardFormValues } from '@/components/checkout/card-form'
import { ThreeDSecureScreen } from '@/components/checkout/three-ds-screen'
import { ProcessingScreen } from '@/components/checkout/processing-screen'
import { PromptPayPanel } from '@/components/checkout/promptpay-panel'
import { WalletPanel } from '@/components/checkout/wallet-panel'
import { InstallmentPanel } from '@/components/checkout/installment-panel'
import { PaymentResult } from '@/components/checkout/payment-result'
import { usePaymentStore } from '@/stores/payment-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useCheckoutStore } from '@/stores/checkout-store'
import {
  PAYMENT_METHOD_LABEL,
  RESPONSE_CODES,
  cardMethod,
  detectCardBrand,
  installmentMethod,
  promptPayMethod,
  shouldCardDecline,
  walletMethod,
} from '@/lib/payment'
import { sleep } from '@/lib/utils'

export function CheckoutPage() {
  const { paymentId = '' } = useParams()
  const payment = usePaymentStore((state) => state.payments.find((item) => item.id === paymentId))
  const settleCheckout = usePaymentStore((state) => state.settleCheckout)
  const merchantName = useSettingsStore((state) => state.settings.checkoutDisplayName)

  const {
    step,
    selectedMethod,
    processingLabel,
    result,
    beginSession,
    setStep,
    selectMethod,
    finish,
    restart,
  } = useCheckoutStore()

  // Card details are held only for the length of the 3DS step-up, then dropped.
  const [pendingCard, setPendingCard] = useState<CardFormValues | null>(null)

  useEffect(() => {
    if (paymentId) beginSession(paymentId)
  }, [paymentId, beginSession])

  const settle = useCallback(
    (method: PaymentMethod, outcome: Omit<CheckoutOutcome, 'transactionId'>) => {
      const transaction = settleCheckout({
        paymentId,
        method,
        status: outcome.status,
        responseCode: outcome.responseCode,
        responseMessage: outcome.responseMessage,
      })
      finish({
        status: outcome.status,
        transactionId: transaction.id,
        responseCode: outcome.responseCode,
        responseMessage: outcome.responseMessage,
        method,
      })
    },
    [finish, paymentId, settleCheckout],
  )

  if (!payment) {
    return (
      <div className="bg-canvas flex min-h-svh flex-col items-center justify-center px-4">
        <PayFlowLogo className="mb-8" />
        <div className="bg-card shadow-card w-full max-w-md rounded-xl border">
          <EmptyState
            icon={FileQuestion}
            title="This payment link is no longer available"
            description={`No payment matches ${paymentId} in this browser. Demo payment links are created locally and are cleared when site data is reset.`}
            action={
              <Button asChild>
                <Link to="/payments/create">Create a new payment</Link>
              </Button>
            }
          />
        </div>
        <Link
          to="/dashboard"
          className="text-muted-foreground hover:text-foreground mt-6 text-[13px]"
        >
          Return to the merchant dashboard
        </Link>
      </div>
    )
  }

  /* ---------------------------- Card flow -------------------------------- */

  const startCardPayment = async (values: CardFormValues) => {
    setPendingCard(values)
    setStep('processing', 'Processing your payment')
    await sleep(1000)
    setStep('authenticating')
  }

  const cardBrandOf = (values: CardFormValues | null) =>
    detectCardBrand(values?.cardNumber ?? '')

  const cardLast4Of = (values: CardFormValues | null) =>
    (values?.cardNumber ?? '').replace(/\D/g, '').slice(-4) || '0000'

  const finishCard = async (status: 'SUCCESS' | 'FAILED' | 'CANCELLED', reason?: keyof typeof RESPONSE_CODES) => {
    const values = pendingCard
    const method = cardMethod(cardBrandOf(values), cardLast4Of(values))

    if (status === 'CANCELLED') {
      settle(method, {
        status: 'CANCELLED',
        responseCode: RESPONSE_CODES.cancelled.code,
        responseMessage: RESPONSE_CODES.cancelled.message,
      })
      return
    }

    setStep('processing', 'Confirming your payment')
    await sleep(900)

    if (status === 'SUCCESS' && !shouldCardDecline(values?.cardNumber ?? '')) {
      settle(method, {
        status: 'SUCCESS',
        responseCode: RESPONSE_CODES.approved.code,
        responseMessage: RESPONSE_CODES.approved.message,
      })
      return
    }

    const failure = reason ? RESPONSE_CODES[reason] : RESPONSE_CODES.declinedByIssuer
    settle(method, {
      status: 'FAILED',
      responseCode: failure.code,
      responseMessage: failure.message,
    })
  }

  /* --------------------------- Other flows ------------------------------- */

  const finishPromptPay = async (outcome: 'SUCCESS' | 'FAILED' | 'PENDING') => {
    if (outcome !== 'PENDING') {
      setStep('processing', 'Confirming your transfer')
      await sleep(850)
    }
    const response =
      outcome === 'SUCCESS'
        ? RESPONSE_CODES.approved
        : outcome === 'FAILED'
          ? RESPONSE_CODES.declinedByIssuer
          : RESPONSE_CODES.expired
    settle(promptPayMethod(), {
      status: outcome,
      responseCode: response.code,
      responseMessage:
        outcome === 'PENDING'
          ? 'QR expired before payment was received.'
          : response.message,
    })
  }

  const finishWallet = async (wallet: WalletProvider, approved: boolean) => {
    setStep('processing', approved ? 'Confirming your payment' : 'Returning to checkout')
    await sleep(800)
    const response = approved ? RESPONSE_CODES.approved : RESPONSE_CODES.walletRejected
    settle(walletMethod(wallet), {
      status: approved ? 'SUCCESS' : 'FAILED',
      responseCode: response.code,
      responseMessage: response.message,
    })
  }

  const finishInstallment = async (
    bank: InstallmentBank,
    months: number,
    approved: boolean,
  ) => {
    setStep('processing', 'Submitting your installment application')
    await sleep(1100)
    const response = approved ? RESPONSE_CODES.approved : RESPONSE_CODES.declinedByIssuer
    settle(installmentMethod(bank, months), {
      status: approved ? 'SUCCESS' : 'FAILED',
      responseCode: response.code,
      responseMessage: approved ? response.message : 'Installment application declined by the bank.',
    })
  }

  /* ------------------------------ Render --------------------------------- */

  const backToMethods = () => {
    setPendingCard(null)
    selectMethod(null)
  }

  const retrySameMethod = () => {
    restart()
    if (selectedMethod) selectMethod(selectedMethod)
  }

  const renderPanel = () => {
    if (step === 'result' && result) {
      return (
        <PaymentResult
          payment={payment}
          result={result}
          onRetry={retrySameMethod}
          onChooseAnother={() => {
            restart()
            selectMethod(null)
          }}
        />
      )
    }

    if (step === 'processing') {
      return <ProcessingScreen label={processingLabel} />
    }

    if (step === 'authenticating') {
      return (
        <ThreeDSecureScreen
          amount={payment.amount}
          currency={payment.currency}
          merchantName={merchantName}
          cardLast4={cardLast4Of(pendingCard)}
          onVerified={() => void finishCard('SUCCESS')}
          onFailed={() => void finishCard('FAILED', 'authFailed')}
          onCancel={() => void finishCard('CANCELLED')}
        />
      )
    }

    if (step === 'select' || !selectedMethod) {
      return (
        <div className="space-y-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Choose payment method</h1>
            <p className="text-muted-foreground mt-1 text-[13px]">
              All methods below are simulated. Nothing you enter leaves this browser.
            </p>
          </div>
          <PaymentMethodSelector
            amount={payment.amount}
            currency={payment.currency}
            onSelect={(type: PaymentMethodType) => selectMethod(type)}
          />
        </div>
      )
    }

    if (selectedMethod === 'CARD') {
      return (
        <div className="space-y-4">
          <MethodHeader title={PAYMENT_METHOD_LABEL.CARD} onBack={backToMethods} />
          <div className="bg-card shadow-card rounded-xl border p-5 sm:p-6">
            <CardForm
              amount={payment.amount}
              currency={payment.currency}
              defaultHolder={payment.customerName}
              onSubmit={startCardPayment}
            />
          </div>
        </div>
      )
    }

    if (selectedMethod === 'PROMPTPAY') {
      return (
        <PromptPayPanel
          paymentId={payment.id}
          amount={payment.amount}
          currency={payment.currency}
          onBack={backToMethods}
          onSuccess={() => void finishPromptPay('SUCCESS')}
          onFailure={() => void finishPromptPay('FAILED')}
          onTimeout={() => void finishPromptPay('PENDING')}
        />
      )
    }

    if (selectedMethod === 'WALLET') {
      return (
        <WalletPanel
          amount={payment.amount}
          currency={payment.currency}
          merchantName={merchantName}
          onBack={backToMethods}
          onApprove={(wallet) => void finishWallet(wallet, true)}
          onReject={(wallet) => void finishWallet(wallet, false)}
        />
      )
    }

    return (
      <InstallmentPanel
        amount={payment.amount}
        currency={payment.currency}
        onBack={backToMethods}
        onContinue={(bank, months) => void finishInstallment(bank, months, true)}
        onDecline={(bank, months) => void finishInstallment(bank, months, false)}
      />
    )
  }

  return <CheckoutLayout payment={payment}>{renderPanel()}</CheckoutLayout>
}

function MethodHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to payment methods">
        <ArrowLeft />
      </Button>
      <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
    </div>
  )
}
