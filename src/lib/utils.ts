import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Builds a browser-navigable URL for an in-app route, respecting the base path
 * the app was deployed under. Only needed for real anchors (new-tab links) —
 * React Router's own <Link> already applies the router basename.
 */
export function appUrl(routePath: string) {
  // import.meta.env.BASE_URL always ends with a slash.
  return `${import.meta.env.BASE_URL}${routePath.replace(/^\//, '')}`
}

/** Promise-based delay used to pace the simulated payment states. */
export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** Deterministic-ish pseudo id suffix. */
function randomDigits(length: number) {
  let out = ''
  for (let i = 0; i < length; i += 1) out += Math.floor(Math.random() * 10)
  return out
}

export function generateTransactionId() {
  // Sits just above the seeded range (TX-10268…TX-10291) so live demo
  // transactions read as the newest rows in the ledger.
  return `TX-${10300 + Math.floor(Math.random() * 200)}`
}

export function generatePaymentId() {
  return `PAY-${randomDigits(6)}`
}

export function generateOrderId(date = new Date()) {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
  return `INV-${stamp}-${randomDigits(3)}`
}

export function generateEventId() {
  return `evt_${Math.random().toString(36).slice(2, 12)}`
}

export function generateLogId() {
  return `req_${Math.random().toString(36).slice(2, 12)}`
}

export function generateLinkId() {
  return `plink_${randomDigits(5)}`
}

export function generateRefundId() {
  return `re_${Math.random().toString(36).slice(2, 12)}`
}

export function generateAuthCode() {
  return randomDigits(6)
}

/** Copies text and resolves to whether it worked, so callers can toast. */
export async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    // Clipboard API is unavailable over insecure origins — fall back.
    try {
      const el = document.createElement('textarea')
      el.value = value
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
