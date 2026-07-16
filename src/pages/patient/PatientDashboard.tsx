import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, ScanLine, Stethoscope } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { TrendChart } from '../../components/charts/TrendChart'
import { OverallTierPill } from '../../components/ui/StatusPill'
import type { Profile, Recording } from '../../lib/types'

export function PatientDashboard() {
  const { profile } = useAuth()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [doctor, setDoctor] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const patientProfile = profile
    let isMounted = true

    async function load() {
      setLoading(true)

      const { data: recData } = await supabase
        .from('recordings')
        .select('*')
        .eq('patient_id', patientProfile.id)
        .order('created_at', { ascending: false })

      if (!isMounted) return
      setRecordings((recData as Recording[]) ?? [])

      if (patientProfile.assigned_doctor_id) {
        const { data: docData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', patientProfile.assigned_doctor_id)
          .single()
        if (isMounted && docData) setDoctor(docData as Profile)
      } else {
        setDoctor(null)
      }

      setLoading(false)
    }

    load()

    return () => {
      isMounted = false
    }
  }, [profile])

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-ink-soft">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-teal mb-2">
            Patient dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Hi, {profile.full_name.split(' ')[0]}
          </h1>
        </div>
        <Link
          to="/patient/scan"
          className="inline-flex items-center gap-2 bg-coral text-paper px-5 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity w-fit"
        >
          <ScanLine size={18} aria-hidden="true" />
          Start a new scan
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-ink/10 p-6">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">
              Heart rate trend
            </h2>
            {recordings.length > 0 ? (
              <TrendChart recordings={recordings} />
            ) : (
              <p className="text-ink-soft text-sm py-10 text-center">
                Your trend will appear here after your first scan.
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-ink/10 p-6">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">
              Scan history
            </h2>
            {loading ? (
              <p className="text-ink-soft text-sm">Loading…</p>
            ) : recordings.length === 0 ? (
              <p className="text-ink-soft text-sm">
                No scans yet.{' '}
                <Link to="/patient/scan" className="text-teal font-medium hover:underline">
                  Start your first one
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-ink/10">
                {recordings.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/patient/report/${r.id}`}
                      className="flex items-center justify-between py-3.5 hover:bg-paper-dim/60 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <span className="text-sm text-ink">
                        {new Date(r.created_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-xs text-ink-soft">
                          {r.metrics.avgBpm} bpm avg
                        </span>
                        <OverallTierPill tier={r.overall_risk_tier} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-ink/10 p-6">
            <div className="flex items-center gap-2 text-teal-deep font-semibold mb-4">
              <Stethoscope size={18} aria-hidden="true" />
              Your doctor
            </div>
            {doctor ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-ink">Dr. {doctor.full_name}</p>
                <p className="flex items-center gap-2 text-ink-soft">
                  <Mail size={14} aria-hidden="true" /> {doctor.email}
                </p>
                {doctor.phone && (
                  <p className="flex items-center gap-2 text-ink-soft">
                    <Phone size={14} aria-hidden="true" /> {doctor.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">
                You haven&rsquo;t assigned a doctor yet. Your scans are still saved to your
                history either way.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
