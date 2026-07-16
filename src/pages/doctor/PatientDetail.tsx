import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { MetricLineChart } from '../../components/charts/MetricLineChart'
import { TrendChart } from '../../components/charts/TrendChart'
import { OverallTierPill, RiskLevelPill } from '../../components/ui/StatusPill'
import type { Profile, Recording } from '../../lib/types'

export function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>()
  const [patient, setPatient] = useState<Profile | null>(null)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!patientId) return

    async function load() {
      const [{ data: patientData }, { data: recData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', patientId).single(),
        supabase
          .from('recordings')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
      ])

      if (patientData) setPatient(patientData as Profile)
      if (recData) {
        setRecordings(recData as Recording[])
        if (recData.length > 0) setSelectedId(recData[0].id)
      }
      setLoading(false)
    }

    load()
  }, [patientId])

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-ink-soft">Loading…</div>
  }

  if (!patient) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-ink-soft mb-4">Patient not found, or not assigned to you.</p>
        <Link to="/doctor" className="text-teal font-medium hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const selected = recordings.find((r) => r.id === selectedId) ?? null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <Link to="/doctor" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-teal mb-6">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to patients
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            {patient.full_name}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-soft mt-1">
            <Mail size={14} aria-hidden="true" /> {patient.email}
          </p>
        </div>
        {selected && <OverallTierPill tier={selected.overall_risk_tier} />}
      </div>

      {recordings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink/10 p-6 text-sm text-ink-soft">
          This patient hasn&rsquo;t run any scans yet.
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-ink/10 p-6">
              <h2 className="font-display font-semibold text-ink mb-4">Heart rate trend</h2>
              <TrendChart recordings={recordings} />
            </div>

            {selected && (
              <>
                <div className="bg-white rounded-2xl border border-ink/10 p-6">
                  <h2 className="font-display font-semibold text-ink mb-3">
                    Pulse-wave analysis
                  </h2>
                  <p className="text-xs text-ink-soft mb-3">
                    Simulated augmentation index: {selected.metrics.pulseWave.augmentationIndex}
                  </p>
                  <MetricLineChart
                    data={selected.metrics.pulseWave.series}
                    unit=""
                    xLabel=""
                    color="var(--color-teal)"
                  />
                </div>

                <div className="bg-white rounded-2xl border border-ink/10 p-6">
                  <h2 className="font-display font-semibold text-ink mb-4">
                    Screening indicators for this scan
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-paper-dim/60 px-4 py-3">
                      <span className="text-ink-soft">Atrial fibrillation</span>
                      <RiskLevelPill level={selected.metrics.afib.level} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-paper-dim/60 px-4 py-3">
                      <span className="text-ink-soft">Heart failure pattern</span>
                      <RiskLevelPill level={selected.metrics.chf.level} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-paper-dim/60 px-4 py-3">
                      <span className="text-ink-soft">Pulse-wave shape</span>
                      <RiskLevelPill level={selected.metrics.pulseWave.level} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-ink/10 overflow-hidden h-fit">
            <div className="px-5 py-3.5 border-b border-ink/10 text-sm font-medium text-ink">
              Recording history
            </div>
            <ul className="divide-y divide-ink/10 max-h-[480px] overflow-y-auto">
              {recordings.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${
                      r.id === selectedId ? 'bg-teal-soft' : 'hover:bg-paper-dim/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-ink">
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <OverallTierPill tier={r.overall_risk_tier} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
