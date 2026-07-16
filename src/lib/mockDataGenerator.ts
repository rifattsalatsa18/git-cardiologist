import type {
  OverallRiskTier,
  RecordingMetrics,
  RiskIndicator,
  RiskLevel,
  SeriesPoint,
} from './types'

/**
 * ---------------------------------------------------------------------------
 * IMPORTANT — READ BEFORE TOUCHING THIS FILE
 * ---------------------------------------------------------------------------
 * Nothing in this file analyzes a real camera or microphone signal. There is
 * no rPPG algorithm and no audio spectrogram analysis here — every number is
 * randomly generated to *look* like a plausible cardiovascular screening
 * report for demo purposes only. Do not wire this up to real biometric input
 * and present it as diagnostic. See src/components/DisclaimerBanner.tsx.
 * ---------------------------------------------------------------------------
 */

function randBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function gaussianNoise(stdDev: number): number {
  // Box-Muller transform for a more natural-looking wobble than flat noise
  const u1 = Math.random() || 1e-9
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * stdDev
}

function levelFromScore(score: number, mediumAt: number, highAt: number): RiskLevel {
  if (score >= highAt) return 'elevated'
  if (score >= mediumAt) return 'monitor'
  return 'normal'
}

/** 30 seconds of pseudo heart-rate samples at 2Hz, with a resting-HR baseline drift. */
function buildHeartRateSeries(baselineBpm: number): SeriesPoint[] {
  const points: SeriesPoint[] = []
  const durationSeconds = 30
  const sampleHz = 2
  const totalSamples = durationSeconds * sampleHz
  const driftPhase = randBetween(0, Math.PI * 2)

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleHz
    const slowDrift = Math.sin(t / 6 + driftPhase) * 2.5 // gentle respiratory sinus arrhythmia look
    const bpm = baselineBpm + slowDrift + gaussianNoise(1.1)
    points.push({ t, value: Math.round(bpm * 10) / 10 })
  }
  return points
}

/** Derives simple HRV-style stats (SDNN, RMSSD) from consecutive simulated beat intervals. */
function computeHrvStats(heartRateSeries: SeriesPoint[]) {
  const intervals = heartRateSeries.map((p) => 60000 / p.value) // ms between beats, approximated
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length
  const sdnn = Math.sqrt(variance)

  let diffSqSum = 0
  for (let i = 1; i < intervals.length; i++) {
    diffSqSum += (intervals[i] - intervals[i - 1]) ** 2
  }
  const rmssd = Math.sqrt(diffSqSum / (intervals.length - 1))

  return { sdnn: Math.round(sdnn * 10) / 10, rmssd: Math.round(rmssd * 10) / 10 }
}

function buildAudioSyncSeries(): { series: SeriesPoint[]; score: number } {
  const series: SeriesPoint[] = []
  const base = randBetween(72, 94)
  for (let i = 0; i < 30; i++) {
    const value = Math.max(0, Math.min(100, base + gaussianNoise(3)))
    series.push({ t: i, value: Math.round(value * 10) / 10 })
  }
  const score = Math.round(series.reduce((a, p) => a + p.value, 0) / series.length)
  return { series, score }
}

function buildPulseWaveSeries(): { series: SeriesPoint[]; augmentationIndex: number } {
  const series: SeriesPoint[] = []
  // One simulated pulse-wave cycle sampled at high resolution, repeated a few times
  for (let i = 0; i < 120; i++) {
    const phase = (i % 40) / 40
    const systolicPeak = Math.exp(-((phase - 0.15) ** 2) / 0.004) * 100
    const reflectedWave = Math.exp(-((phase - 0.45) ** 2) / 0.01) * randBetween(35, 65)
    const value = Math.max(0, systolicPeak + reflectedWave + gaussianNoise(1.5))
    series.push({ t: i, value: Math.round(value * 10) / 10 })
  }
  const augmentationIndex = Math.round(randBetween(15, 45))
  return { series, augmentationIndex }
}

function buildRiskIndicator(label: string, mediumAt: number, highAt: number): RiskIndicator {
  // Weighted toward "normal" so most demo runs look reassuring, same as most
  // real screening populations — occasional elevated readings still occur.
  const roll = Math.random()
  let score: number
  if (roll < 0.7) score = randBetween(2, mediumAt - 1)
  else if (roll < 0.92) score = randBetween(mediumAt, highAt - 1)
  else score = randBetween(highAt, 100)

  return {
    score: Math.round(score),
    level: levelFromScore(score, mediumAt, highAt),
    label,
  }
}

const DIET_TIPS = [
  'Add a serving of oats or overnight oats to breakfast — the soluble fiber supports healthy cholesterol.',
  'Work in a cup of local leafy greens (spinach, kale, or whatever is fresh nearby) most days.',
  'Swap in beans or lentils for meat in one meal a week — they are affordable, filling, and heart-friendly.',
  'Snack on a small handful of unsalted nuts instead of chips or crackers.',
  'Choose fruit for dessert a few times a week instead of sweets.',
  'Cook with olive or canola oil instead of butter or lard when you can.',
  'Cut back gradually on added salt — try herbs, garlic, or lemon for flavor instead.',
  'Add a piece of fatty fish (like sardines or mackerel) to your week if it is available and affordable.',
]

const LIFESTYLE_HABITS = [
  'Aim for a brisk 20–30 minute walk most days — consistency matters more than intensity.',
  'Try to get 7–8 hours of sleep on a regular schedule.',
  'Take short breaks to stretch or stand if you sit for long stretches during the day.',
  'Build a simple stress-relief habit, like a few minutes of quiet breathing before bed.',
  'Limit sugary drinks — water or unsweetened tea is an easy swap.',
  'If you smoke, cutting down — or getting support to quit — is one of the highest-impact changes for heart health.',
  'Keep a light log of how you feel day to day; patterns are easier to spot over weeks than single days.',
]

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(idx, 1)[0])
  }
  return out
}

function buildAdvice(tier: OverallRiskTier) {
  const dietTips = pickN(DIET_TIPS, 3)
  const lifestyleHabits = pickN(LIFESTYLE_HABITS, 3)

  if (tier === 'consult') {
    return {
      summary:
        'A few of today\u2019s simulated readings came back outside the usual range. This is not a diagnosis — it\u2019s a prompt to check in with a real clinician.',
      dietTips,
      lifestyleHabits,
      immediateSuggestion:
        'Try a few minutes of slow, deep breathing now, and reach out to your doctor to book a real appointment when you can — especially if you\u2019ve noticed symptoms like chest discomfort, unusual fatigue, or shortness of breath.',
    }
  }
  if (tier === 'monitor') {
    return {
      summary:
        'Today\u2019s simulated results look mostly steady, with one or two readings worth keeping an eye on over your next few scans.',
      dietTips,
      lifestyleHabits,
      immediateSuggestion:
        'No immediate action needed — a short breathing break can help you feel centered, and it\u2019s worth mentioning today\u2019s trend at your next real check-up.',
    }
  }
  return {
    summary: 'Today\u2019s simulated readings look steady and within the normal demo range.',
    dietTips,
    lifestyleHabits,
    immediateSuggestion:
      'Nothing urgent here — keep up whatever you\u2019re already doing, and keep scanning regularly to build up your trend history.',
  }
}

export function generateRecording(): RecordingMetrics {
  const baselineBpm = randBetween(58, 88)
  const heartRateSeries = buildHeartRateSeries(baselineBpm)
  const { sdnn, rmssd } = computeHrvStats(heartRateSeries)
  const avgBpm = Math.round(
    (heartRateSeries.reduce((a, p) => a + p.value, 0) / heartRateSeries.length) * 10,
  ) / 10

  const { series: audioSyncSeries, score: audioSyncScore } = buildAudioSyncSeries()
  const afib = buildRiskIndicator('Atrial fibrillation risk indicator', 35, 70)
  const chf = buildRiskIndicator('Congestive heart failure pre-screening pattern', 35, 70)
  const { series: pulseWaveSeriesRaw, augmentationIndex } = buildPulseWaveSeries()
  const pulseWaveLevel = levelFromScore(augmentationIndex, 30, 42)

  const worstScore = Math.max(
    afib.level === 'elevated' ? 3 : afib.level === 'monitor' ? 2 : 1,
    chf.level === 'elevated' ? 3 : chf.level === 'monitor' ? 2 : 1,
    pulseWaveLevel === 'elevated' ? 3 : pulseWaveLevel === 'monitor' ? 2 : 1,
  )
  const overallTier: OverallRiskTier =
    worstScore === 3 ? 'consult' : worstScore === 2 ? 'monitor' : 'normal'

  return {
    heartRateSeries,
    avgBpm,
    sdnn,
    rmssd,
    audioSyncSeries,
    audioSyncScore,
    afib,
    chf,
    pulseWave: {
      series: pulseWaveSeriesRaw,
      augmentationIndex,
      level: pulseWaveLevel,
    },
    overallTier,
    advice: buildAdvice(overallTier),
  }
}
