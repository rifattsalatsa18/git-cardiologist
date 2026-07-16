import { ShieldAlert } from 'lucide-react'

export function DisclaimerBanner() {
  return (
    <div className="bg-teal-deep text-paper text-xs sm:text-sm font-body px-4 py-2 flex items-center justify-center gap-2 text-center">
      <ShieldAlert size={16} className="shrink-0 text-mint" aria-hidden="true" />
      <p>
        <span className="font-semibold">Simulated demo.</span> No real biometric analysis is
        performed here — every reading is randomly generated for portfolio purposes. It is never
        a substitute for a licensed clinician.
      </p>
    </div>
  )
}
