import {
  BookOpen,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Link2,
  Receipt,
  Settings,
  Users,
  Webhook,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Match nested routes such as /transactions/TX-10291 */
  matchPrefix?: boolean
  children?: NavItem[]
}

export const primaryNav: NavItem[] = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', to: '/transactions', icon: Receipt, matchPrefix: true },
  { label: 'Payments', to: '/payments', icon: CreditCard, matchPrefix: true },
  { label: 'Payment Links', to: '/payment-links', icon: Link2 },
  { label: 'Customers', to: '/customers', icon: Users },
]

export const developerNav: NavItem = {
  label: 'Developers',
  to: '/developers',
  icon: KeyRound,
  matchPrefix: true,
  children: [
    { label: 'API Keys', to: '/developers/api-keys', icon: KeyRound },
    { label: 'Webhooks', to: '/developers/webhooks', icon: Webhook },
    { label: 'API Logs', to: '/developers/api-logs', icon: BookOpen },
  ],
}

export const settingsNav: NavItem = { label: 'Settings', to: '/settings', icon: Settings }
