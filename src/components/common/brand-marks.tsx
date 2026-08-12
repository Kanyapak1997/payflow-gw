import type { CardBrand, WalletProvider } from '@/types'
import { cn } from '@/lib/utils'

/**
 * Stylised, non-trademark card-scheme marks. They read as the real thing at a
 * glance without reproducing any brand's actual logo artwork.
 */
export function CardBrandMark({ brand, className }: { brand: CardBrand; className?: string }) {
  const base = cn('h-6 w-9 shrink-0 rounded-[3px] border', className)

  switch (brand) {
    case 'visa':
      return (
        <span
          className={cn(base, 'flex items-center justify-center border-[#1a1f71]/15 bg-white')}
          aria-label="Visa"
        >
          <span className="text-[10px] font-bold tracking-tight text-[#1a1f71] italic">VISA</span>
        </span>
      )
    case 'mastercard':
      return (
        <span
          className={cn(base, 'flex items-center justify-center gap-0 border-black/10 bg-white')}
          aria-label="Mastercard"
        >
          <span className="size-3.5 rounded-full bg-[#eb001b]" />
          <span className="-ml-1.5 size-3.5 rounded-full bg-[#f79e1b] mix-blend-multiply" />
        </span>
      )
    case 'amex':
      return (
        <span
          className={cn(base, 'flex items-center justify-center border-transparent bg-[#006fcf]')}
          aria-label="American Express"
        >
          <span className="text-[8px] font-bold tracking-tight text-white">AMEX</span>
        </span>
      )
    case 'jcb':
      return (
        <span
          className={cn(base, 'flex items-center justify-center gap-px overflow-hidden border-black/10 bg-white')}
          aria-label="JCB"
        >
          <span className="h-4 w-2 rounded-[1px] bg-[#0e4c96]" />
          <span className="h-4 w-2 rounded-[1px] bg-[#d0021b]" />
          <span className="h-4 w-2 rounded-[1px] bg-[#00a650]" />
        </span>
      )
    case 'unionpay':
      return (
        <span
          className={cn(base, 'flex items-center justify-center gap-px overflow-hidden border-black/10 bg-white')}
          aria-label="UnionPay"
        >
          <span className="h-4 w-2 -skew-x-12 bg-[#e21836]" />
          <span className="h-4 w-2 -skew-x-12 bg-[#00447c]" />
          <span className="h-4 w-2 -skew-x-12 bg-[#007b84]" />
        </span>
      )
    default:
      return (
        <span
          className={cn(base, 'bg-muted flex items-center justify-center')}
          aria-label="Card"
        >
          <svg viewBox="0 0 24 16" className="text-muted-foreground h-3 w-5" fill="none">
            <rect x="0.5" y="0.5" width="23" height="15" rx="2" stroke="currentColor" />
            <path d="M0 5h24" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
      )
  }
}

export function PromptPayMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-md bg-[#003d6b]',
        className,
      )}
      aria-label="PromptPay"
    >
      <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" strokeWidth={2}>
        <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" stroke="currentColor" strokeLinecap="round" />
        <rect x="8.5" y="8.5" width="7" height="7" rx="1" fill="currentColor" />
      </svg>
    </span>
  )
}

const WALLET_STYLE: Record<WalletProvider, { bg: string; label: string; short: string }> = {
  truemoney: { bg: 'bg-[#f47b20]', label: 'TrueMoney Wallet', short: 'TM' },
  linepay: { bg: 'bg-[#06c755]', label: 'LINE Pay', short: 'LP' },
  shopeepay: { bg: 'bg-[#ee4d2d]', label: 'ShopeePay', short: 'SP' },
}

export function WalletMark({
  wallet,
  className,
}: {
  wallet: WalletProvider
  className?: string
}) {
  const style = WALLET_STYLE[wallet]
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white',
        style.bg,
        className,
      )}
      aria-label={style.label}
    >
      {style.short}
    </span>
  )
}

const BANK_STYLE: Record<string, { bg: string; short: string }> = {
  kbank: { bg: 'bg-[#138f2d]', short: 'K' },
  scb: { bg: 'bg-[#4e2a84]', short: 'S' },
  krungsri: { bg: 'bg-[#fec43b] text-slate-900', short: 'K' },
  ktc: { bg: 'bg-[#00a0e9]', short: 'T' },
}

export function BankMark({ bank, className }: { bank: string; className?: string }) {
  const style = BANK_STYLE[bank] ?? { bg: 'bg-muted text-foreground', short: '?' }
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
        style.bg,
        className,
      )}
    >
      {style.short}
    </span>
  )
}

/** PayFlow logotype used in the sidebar and on the hosted checkout. */
export function PayFlowLogo({
  className,
  showWordmark = true,
  tone = 'default',
}: {
  className?: string
  showWordmark?: boolean
  tone?: 'default' | 'light'
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="bg-primary flex size-7 shrink-0 items-center justify-center rounded-[7px]">
        <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
          <path
            d="M10 23V9h7.2c2.8 0 4.8 1.9 4.8 4.6 0 2.8-2 4.7-4.9 4.7H13.4V23H10Zm3.4-7.6h3.2c1.2 0 2-.7 2-1.8s-.8-1.8-2-1.8h-3.2v3.6Z"
            fill="white"
          />
        </svg>
      </span>
      {showWordmark && (
        <span
          className={cn(
            'text-[15px] font-semibold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-foreground',
          )}
        >
          PayFlow
        </span>
      )}
    </span>
  )
}
