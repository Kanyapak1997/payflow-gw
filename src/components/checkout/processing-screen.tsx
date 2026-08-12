import { Lock } from 'lucide-react'

/**
 * Interstitial shown while the simulated authorization runs. Kept short — the
 * point is to make the state transition legible, not to make people wait.
 */
export function ProcessingScreen({
  label = 'Processing your payment',
  hint = "Please don't close this window.",
}: {
  label?: string
  hint?: string
}) {
  return (
    <div className="bg-card shadow-card flex flex-col items-center justify-center rounded-xl border px-6 py-16 text-center">
      <div className="relative flex size-16 items-center justify-center">
        <span
          className="border-primary/25 absolute inset-0 rounded-full border-2"
          style={{ animation: 'payflow-pulse-ring 1.8s ease-out infinite' }}
        />
        <span
          className="border-primary/15 border-t-primary absolute inset-0 rounded-full border-2"
          style={{ animation: 'payflow-sweep 0.9s linear infinite' }}
        />
        <Lock className="text-primary size-5" />
      </div>

      <p className="mt-6 text-[15px] font-medium">{label}</p>
      <p className="text-muted-foreground mt-1 text-[13px]">{hint}</p>

      <div className="text-muted-foreground mt-6 flex items-center gap-1.5 text-[11.5px]">
        <span className="bg-success size-1.5 animate-pulse rounded-full" />
        Secure connection established
      </div>
    </div>
  )
}
