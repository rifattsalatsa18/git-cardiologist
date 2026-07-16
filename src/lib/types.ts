export type UserRole = 'patient' | 'doctor'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  phone: string | null
  assigned_doctor_id: string | null
  created_at: string
}

export interface SeriesPoint {
  t: number
  value: number
}

export type RiskLevel = 'normal' | 'monitor' | 'elevated'
export type OverallRiskTier = 'normal' | 'monitor' | 'consult'

export interface RiskIndicator {
  score: number
  level: RiskLevel
  label: string
}

export interface RecordingMetrics {
  heartRateSeries: SeriesPoint[]
  avgBpm: number
  sdnn: number
  rmssd: number
  audioSyncSeries: SeriesPoint[]
  audioSyncScore: number
  afib: RiskIndicator
  chf: RiskIndicator
  pulseWave: {
    series: SeriesPoint[]
    augmentationIndex: number
    level: RiskLevel
  }
  overallTier: OverallRiskTier
  advice: {
    summary: string
    dietTips: string[]
    lifestyleHabits: string[]
    immediateSuggestion: string
  }
}

export interface Recording {
  id: string
  patient_id: string
  created_at: string
  overall_risk_tier: OverallRiskTier
  metrics: RecordingMetrics
}
