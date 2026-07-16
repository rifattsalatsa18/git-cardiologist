import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import type { Profile, Recording } from '../../lib/types'
import { OverallTierPill } from '../../components/ui/StatusPill'

interface PatientRow extends Profile {
  latestRecording?: Recording
}

export function DoctorDashboard() {
  const { profile } = useAuth()
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const doctorProfile = profile
    let isMounted = true

    async function load() {
      setLoading(true)

      const { data: patientData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('assigned_doctor_id', doctorProfile.id)
        .order('full_name')

      if (!isMounted) return

      if (error || !patientData) {
        setPatients([])
        setLoading(false)
        return
      }

      const patientsWithLatest: PatientRow[] = await Promise.all(
        (patientData as Profile[]).map(async (p) => {
          const { data: recData } = await supabase
            .from('recordings')
            .select('*')
            .eq('patient_id', p.id)
            .order('created_at', { ascending: false })
            .limit(1)
          return { ...p, latestRecording: recData?.[0] as Recording | undefined }
        }),
      )

      if (!isMounted) return
      setPatients(patientsWithLatest)
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <p className="font-mono text-xs uppercase tracking-widest text-teal mb-2">
        Doctor dashboard
      </p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-8">
        Dr. {profile.full_name.split(' ')[0]}&rsquo;s patients
      </h1>

      <div className="bg-white rounded-2xl border border-ink/10 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-ink/10 text-ink-soft text-sm">
          <Users size={16} aria-hidden="true" />
          {patients.length} patient{patients.length === 1 ? '' : 's'} assigned to you
        </div>

        {loading ? (
          <p className="p-6 text-sm text-ink-soft">Loading…</p>
        ) : patients.length === 0 ? (
          <p className="p-6 text-sm text-ink-soft">
            No patients have assigned you yet. When someone chooses you as their doctor
            during signup, they&rsquo;ll show up here.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {patients.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/doctor/patients/${p.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-paper-dim/60 transition-colors"
                >
                  <div>
                    <p className="font-medium text-ink">{p.full_name}</p>
                    <p className="text-xs text-ink-soft">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {p.latestRecording ? (
                      <OverallTierPill tier={p.latestRecording.overall_risk_tier} />
                    ) : (
                      <span className="text-xs text-ink-soft">No scans yet</span>
                    )}
                    <ChevronRight size={18} className="text-ink-soft" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
