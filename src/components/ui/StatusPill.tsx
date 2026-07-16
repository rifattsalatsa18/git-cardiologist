import type { OverallRiskTier, RiskLevel } from '../../lib/types'

const RISK_STYLES: Record<RiskLevel, { bg: string; fg: string; text: string }> = {
  normal: { bg: 'bg-mint-soft', fg: 'text-teal-deep', text: 'Normal range' },
  monitor: { bg: 'bg-amber-soft', fg: 'text-ink', text: 'Worth monitoring' },
  elevated: { bg: 'bg-alert-soft', fg: 'text-alert', text: 'Elevated' },
}

const TIER_STYLES: Record<OverallRiskTier, { bg: string; fg: string; text: string }> = {
  normal: { bg: 'bg-mint-soft', fg: 'text-teal-deep', text: 'Normal' },
  monitor: { bg: 'bg-amber-soft', fg: 'text-ink', text: 'Monitor' },
  consult: { bg: 'bg-alert-soft', fg: 'text-alert', text: 'Consult your doctor' },
}

export function RiskLevelPill({ level }: { level: RiskLevel }) {
  const style = RISK_STYLES[level]
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.fg}`}>
      {style.text}
    </span>
  )
}

export function OverallTierPill({ tier }: { tier: OverallRiskTier }) {
  const style = TIER_STYLES[tier]
  return (
    <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold ${style.bg} ${style.fg}`}>
      {style.text}
    </span>
  )
}
