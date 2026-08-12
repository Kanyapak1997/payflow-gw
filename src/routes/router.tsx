import { Suspense, lazy, type ComponentType } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { RouteFallback } from '@/components/layout/route-fallback'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { NotFoundPage } from '@/pages/not-found-page'

/**
 * The Overview dashboard is the landing route, so it ships in the entry chunk.
 * Everything else is split out — the hosted checkout in particular should not
 * cost merchants a byte, and vice versa.
 */
function withSuspense(load: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(load)
  return (
    <Suspense fallback={<RouteFallback />}>
      <Component />
    </Suspense>
  )
}

const named = <K extends string>(key: K, load: () => Promise<Record<K, ComponentType>>) =>
  withSuspense(() => load().then((module) => ({ default: module[key] })))

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: 'dashboard', element: <DashboardPage /> },
        {
          path: 'transactions',
          element: named('TransactionsPage', () => import('@/pages/transactions/transactions-page')),
        },
        {
          path: 'transactions/:transactionId',
          element: named(
            'TransactionDetailPage',
            () => import('@/pages/transactions/transaction-detail-page'),
          ),
        },
        {
          path: 'payments',
          element: named('PaymentsPage', () => import('@/pages/payments/payments-page')),
        },
        {
          path: 'payments/create',
          element: named('CreatePaymentPage', () => import('@/pages/payments/create-payment-page')),
        },
        {
          path: 'payments/:paymentId',
          element: named('PaymentCreatedPage', () => import('@/pages/payments/payment-created-page')),
        },
        {
          path: 'payment-links',
          element: named(
            'PaymentLinksPage',
            () => import('@/pages/payment-links/payment-links-page'),
          ),
        },
        {
          path: 'customers',
          element: named('CustomersPage', () => import('@/pages/customers/customers-page')),
        },
        { path: 'developers', element: <Navigate to="/developers/api-keys" replace /> },
        {
          path: 'developers/api-keys',
          element: named('ApiKeysPage', () => import('@/pages/developers/api-keys-page')),
        },
        {
          path: 'developers/webhooks',
          element: named('WebhooksPage', () => import('@/pages/developers/webhooks-page')),
        },
        {
          path: 'developers/api-logs',
          element: named('ApiLogsPage', () => import('@/pages/developers/api-logs-page')),
        },
        {
          path: 'settings',
          element: named('SettingsPage', () => import('@/pages/settings/settings-page')),
        },
      ],
    },
    // The hosted checkout is customer-facing and deliberately sits outside the
    // merchant dashboard shell.
    {
      path: '/pay/:paymentId',
      element: named('CheckoutPage', () => import('@/pages/checkout/checkout-page')),
    },
    { path: '*', element: <NotFoundPage /> },
  ],
  {
    // Vite rewrites BASE_URL to the deployment base path (e.g. "/payflow-gw/"
    // on GitHub Pages project sites), so every route resolves under it.
    basename: import.meta.env.BASE_URL,
  },
)
