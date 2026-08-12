<div align="center">

# PayFlow

**Payments made simple for modern businesses.**

A frontend-only payment gateway and merchant management platform — built to demonstrate
the full payment lifecycle, from creating a payment to hosted checkout, 3-D Secure,
webhooks and refunds.

[Features](#features) · [Demo flow](#the-demo-payment-flow) · [Architecture](#architecture) ·
[Getting started](#local-installation) · [Deployment](#deployment) ·
[Sandbox test data](#sandbox-test-data)

</div>

> [!IMPORTANT]
> **This project is a frontend-only payment gateway simulation built for demonstration and
> portfolio purposes. No real payment data is processed.** There is no backend, no database and
> no payment provider integration. Every transaction, webhook and API log you see is generated
> in your browser and stored in `localStorage`. Never enter real card or personal data.

---

## Screenshots

| | |
|---|---|
| ![Overview dashboard](docs/screenshots/dashboard.png) | ![Transaction detail](docs/screenshots/transaction-detail.png) |
| **Overview dashboard** — KPIs, payment volume, method mix | **Transaction detail** — timeline, technical info, payloads |
| ![Hosted checkout](docs/screenshots/checkout.png) | ![3-D Secure](docs/screenshots/three-ds.png) |
| **Hosted checkout** — customer-facing payment page | **3-D Secure** — simulated issuer authentication |

<sub>_Screenshot placeholders — drop your captures into `docs/screenshots/`._</sub>

---

## Features

### Merchant dashboard
- **Overview** — payment volume KPIs, an interactive volume chart (7 / 30 / 90 days), payment
  method mix, and recent transactions. Figures update live as you complete demo payments.
- **Transactions** — searchable, filterable ledger (status, payment method, date range) with CSV
  export and pagination.
- **Transaction detail** — full event timeline, technical information, and collapsible
  API request / API response / webhook payload viewers with copy buttons.
- **Refunds** — full and partial refunds that update transaction status, append timeline events
  and emit a `payment.refunded` webhook.
- **Payments** — the payment intents you have created, each with a hosted checkout link.
- **Payment Links** — reusable links with usage stats, enable/disable and delete.
- **Customers** — customer list with a side panel showing saved payment methods and history.

### Hosted checkout
A customer-facing checkout at `/pay/:paymentId`, visually distinct from the dashboard, supporting
four simulated payment methods:

| Method | Simulation |
|---|---|
| **Credit / Debit Card** | Live card-number formatting, brand detection (Visa / Mastercard / Amex / JCB / UnionPay), Luhn validation, then a mock 3-D Secure OTP challenge |
| **PromptPay QR** | QR screen with a 5-minute expiry countdown and explicit *Simulate Success / Failure / Timeout* controls |
| **Digital Wallet** | TrueMoney, LINE Pay and ShopeePay redirect flow with Approve / Reject |
| **Installment** | KBank, SCB, Krungsri and KTC with 3 / 6 / 10-month plans, interest rates and monthly quotes |

Every method resolves to a reusable result screen — Success, Pending, Failed or Cancelled — with
a printable receipt.

### Developer tools
- **API Keys** — publishable and secret sandbox keys, masking, reveal, copy, regenerate.
- **Webhooks** — endpoint configuration, signing secret, per-event subscriptions, a delivery log
  with HTTP status and latency, payload inspection and *Resend Webhook*.
- **API Logs** — every simulated request with method, endpoint, status, duration, and a side panel
  showing request/response headers and bodies in monospace.

### Throughout
Skeleton loaders · empty states · confirmation dialogs · toasts · copy-to-clipboard · status
badges · tooltips · breadcrumbs · side sheets · responsive tables · light & dark themes ·
a global search palette · and a persistent sandbox indicator.

---

## The demo payment flow

The hero experience is a complete payment lifecycle you can walk end to end. Click **Start Demo**
on the dashboard to begin with the order pre-filled.

```text
Dashboard
  ↓  Create Payment
INV-20260812-001 · ฿2,590
  ↓  Generate payment link
https://payflow.demo/pay/PAY-XXXXXX
  ↓  Open Checkout
Credit / Debit Card
  ↓  4242 4242 4242 4242
Pay ฿2,590
  ↓  Processing
3-D Secure · Demo Bank
  ↓  OTP 123456
Payment Successful · TX-XXXXX
  ↓  View Transaction
Timeline · API request · API response
  ↓  Webhook: payment.success
Refund ฿1,000
  ↓
PARTIALLY REFUNDED
  ↓  Webhook: payment.refunded
```

The transaction stays available when you navigate back to the dashboard — state is persisted to
`localStorage`, and the dashboard KPIs move to reflect it. **Settings → Demo → Reset data**
restores the seeded dataset at any time.

---

## Technology stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite |
| Styling | Tailwind CSS v4 with CSS-variable design tokens |
| Components | shadcn/ui patterns over Radix UI primitives |
| Icons | Lucide React |
| Routing | React Router (with route-level code splitting) |
| Charts | Recharts (lazily loaded) |
| Forms | React Hook Form + Zod |
| State | Zustand (with `persist`) |
| Dates | date-fns |
| Toasts | Sonner |
| Fonts | Inter + JetBrains Mono, self-hosted via Fontsource |

No backend, no database, no payment provider SDK — by design.

---

## Architecture

```text
src/
  components/
    common/        # StatusBadge, DataTable, JsonViewer, CopyButton, PaymentTimeline…
    checkout/      # CheckoutLayout, CardForm, ThreeDSecureScreen, PromptPayPanel…
    dashboard/     # VolumeChart, MethodBreakdown, DemoCallout
    layout/        # AppSidebar, TopNavigation, DashboardLayout, GlobalSearch
    transactions/  # TransactionTable, RefundDialog
    ui/            # Design-system primitives (Button, Card, Dialog, Select…)

  pages/           # One folder per route group
  data/            # Seeded mock datasets
  stores/          # Zustand stores
  types/           # Domain models
  hooks/           # useTheme, useSimulatedLoading
  lib/             # format, payment, timeline, webhook, analytics, utils
  routes/          # Router and navigation config
```

### How the demo hangs together

The illusion of a real gateway comes from keeping the domain model honest and wiring the side
effects that a real system would have:

- **`payment-store`** owns transactions, events, webhooks, API logs, payments, links and refunds.
  Creating a payment writes a `POST /v1/payments` log. Completing checkout creates a transaction,
  generates its event timeline, emits `payment.created` plus the terminal event, and logs the
  confirm call. Refunding updates the transaction, appends three timeline events, emits
  `payment.refunded` and logs `POST /v1/refunds`.
- **`lib/timeline`** derives a plausible event history from a transaction's method and status, so
  seeded and live transactions share one source of truth.
- **`lib/analytics`** blends headline figures with live session activity, so the dashboard opens on
  realistic numbers *and* visibly reacts when you complete a payment.
- **`settings-store`** drives the checkout — disabling a payment method in Settings removes it from
  the hosted checkout immediately.

### Design system

A single token layer in `src/index.css` defines surfaces, a restrained indigo accent, a dedicated
semantic scale for payment states (success / warning / danger / info / violet / neutral) and a
five-colour chart ramp — each with a hand-tuned dark-mode counterpart. The categorical chart
palette was validated for colour-vision deficiency separation and contrast.

---

## Local installation

**Requirements:** Node.js 20.19+ (or 22.12+) and npm.

```bash
git clone <repository-url>
cd payflow-gw
npm install
npm run dev
```

Then open <http://localhost:5173>.

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type-check only |
| `npm run lint` | Lint with oxlint |

---

## Deployment

### GitHub Pages

`.github/workflows/deploy.yml` builds and publishes the site on every push to `main`, and can be
run manually from the **Actions** tab.

One-time setup: **Settings → Pages → Build and deployment → Source → GitHub Actions.**

That's it — the workflow resolves the base path itself. For a project site it builds with
`VITE_BASE_PATH=/<repo>/`; for a user or organisation site (`<owner>.github.io`) it builds at the
domain root.

Two details make a client-side-routed SPA work on Pages:

- **Base path.** Vite's `base` comes from `VITE_BASE_PATH`, and React Router takes its `basename`
  from `import.meta.env.BASE_URL`, so both the asset URLs and the routes live under the same
  prefix. Use `appUrl()` from `src/lib/utils.ts` for any raw `<a href>` — React Router's `<Link>`
  already handles it.
- **Deep links.** Pages has no SPA rewrite, so `/transactions/TX-10291` would 404. A small Vite
  plugin copies `index.html` to `404.html` at build time; Pages serves that for unknown paths and
  the router takes over from there.

To reproduce a Pages build locally:

```bash
VITE_BASE_PATH=/payflow-gw/ npm run build
VITE_BASE_PATH=/payflow-gw/ npm run preview
# → http://localhost:4173/payflow-gw/
```

### Anywhere else

Any static host works. Run `npm run build` and serve `dist/`. If you deploy to a sub-path, set
`VITE_BASE_PATH` accordingly; if your host has its own SPA fallback rule, point it at
`index.html` and the generated `404.html` is simply unused.

---

## Sandbox test data

Everything below is fictional. **Never enter real card details.**

| | |
|---|---|
| **Approved card** | `4242 4242 4242 4242` |
| **Declining card** | `4000 0000 0000 0002` (any card starting `4000` declines) |
| **Expiration** | Any future date |
| **CVV** | Any 3 digits |
| **3-D Secure OTP** | `123456` |
| **Publishable key** | `pk_test_51PAYFLOW823910` |
| **Secret key** | `sk_test_51PAYFLOW…` |

Other outcomes are reachable through the clearly-labelled **Demo Simulation** panels on each
payment method — success, failure, timeout, wallet rejection and bank decline are all one click
away, which makes the app easy to drive during a live walkthrough.

---

## Portfolio context

PayFlow was built as a portfolio and client-demonstration project to show:

- **Realistic domain modelling** of a payment gateway — payment intents, transactions, events,
  refunds, webhooks and API logs, with a consistent status system
  (`CREATED` · `PENDING` · `PROCESSING` · `REQUIRES_ACTION` · `SUCCESS` · `FAILED` · `CANCELLED` ·
  `REFUNDED` · `PARTIALLY_REFUNDED`).
- **Connected interactions** — actions in one surface visibly change others, so the product feels
  like a system rather than a set of screens.
- **Frontend architecture** — typed domain models, a shared design-token layer, reusable
  primitives, feature-scoped components, and store-owned side effects.
- **Product and UX judgement** — an enterprise-fintech visual language, strong information
  hierarchy, and a checkout that reads as customer-facing rather than admin-facing.
- **Performance awareness** — route-level code splitting and a lazily-loaded chart library keep
  the entry bundle small.

It is inspired by payment platforms such as Stripe, Adyen and 2C2P, but uses its own branding,
naming, visual identity and mock data throughout.

---

## Licence

Provided as-is for demonstration and portfolio purposes.
