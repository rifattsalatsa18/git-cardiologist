import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Apple, ArrowLeft, HeartPulse, Salad, Wind } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { MetricLineChart } from '../../components/charts/MetricLineChart'
import { OverallTierPill, RiskLevelPill } from '../../components/ui/StatusPill'
import type { Recording } from '../../lib/types'

export function ReportView() {
  const { id } = useParams<{ id: string }>()
  const [recording, setRecording] = useState<Recording | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('recordings')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setRecording(data as Recording)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-ink-soft">Loading report…</div>
  }

  if (notFound || !recording) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-ink-soft mb-4">We couldn&rsquo;t find that report.</p>
        <Link to="/patient" className="text-teal font-medium hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const { metrics } = recording

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link to="/patient" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-teal mb-6">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
          Scan report
        </h1>
        <OverallTierPill tier={recording.overall_risk_tier} />
      </div>
      <p className="text-ink-soft text-sm mb-8">
        {new Date(recording.created_at).toLocaleString(undefined, {
          dateStyle: 'full',
          timeStyle: 'short',
        })}
      </p>

      {/* Advice section */}
      <section className="bg-teal-soft/70 rounded-2xl p-6 sm:p-8 mb-8">
        <h2 className="font-display text-xl font-semibold text-teal-deep mb-2">
          Next steps &amp; actionable advice
        </h2>
        <p className="text-ink-soft mb-6">{metrics.advice.summary}</p>

        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 font-semibold text-ink mb-2">
              <Wind size={16} className="text-teal-deep" aria-hidden="true" />
              Right now
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">
              {metrics.advice.immediateSuggestion}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 font-semibold text-ink mb-2">
              <Salad size={16} className="text-teal-deep" aria-hidden="true" />
              Food ideas
            </div>
            <ul className="text-sm text-ink-soft leading-relaxed space-y-1.5">
              {metrics.advice.dietTips.map((tip) => (
                <li key={tip}>· {tip}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 font-semibold text-ink mb-2">
              <Apple size={16} className="text-teal-deep" aria-hidden="true" />
              Everyday habits
            </div>
            <ul className="text-sm text-ink-soft leading-relaxed space-y-1.5">
              {metrics.advice.lifestyleHabits.map((habit) => (
                <li key={habit}>· {habit}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-ink/10 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-semibold text-ink">Heart rate variability</h3>
            <span className="font-mono text-sm text-ink-soft">{metrics.avgBpm} bpm avg</span>
          </div>
          <p className="text-xs text-ink-soft mb-3">
            SDNN {metrics.sdnn} ms · RMSSD {metrics.rmssd} ms
          </p>
          <MetricLineChart data={metrics.heartRateSeries} unit=" bpm" color="var(--color-coral)" />
        </div>

        <div className="bg-white rounded-2xl border border-ink/10 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-semibold text-ink">Audio sync</h3>
            <span className="font-mono text-sm text-ink-soft">{metrics.audioSyncScore}/100</span>
          </div>
          <p className="text-xs text-ink-soft mb-3">Voice-cadence to pulse correlation over the scan</p>
          <MetricLineChart data={metrics.audioSyncSeries} unit="" color="var(--color-teal)" />
        </div>
      </div>

      {/* Risk indicators */}
      <div className="bg-white rounded-2xl border border-ink/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse size={18} className="text-coral" aria-hidden="true" />
          <h3 className="font-display font-semibold text-ink">Screening indicators</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-paper-dim/60 px-4 py-3">
            <span className="text-ink-soft">Atrial fibrillation risk</span>
            <RiskLevelPill level={metrics.afib.level} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-paper-dim/60 px-4 py-3">
            <span className="text-ink-soft">Heart-failure pattern</span>
            <RiskLevelPill level={metrics.chf.level} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-paper-dim/60 px-4 py-3">
            <span className="text-ink-soft">Pulse-wave analysis</span>
            <RiskLevelPill level={metrics.pulseWave.level} />
          </div>
        </div>
      </div>
    </div>
  )
}
