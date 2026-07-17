// Signup.tsx
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { HeartPulse, Stethoscope, UserRound } from 'lucide-react'
import { PasswordInput } from '../components/ui/PasswordInput'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import type { UserRole } from '../lib/types'

interface DoctorOption {
  id: string
  full_name: string
}

export function Signup() {
  const { signUp, isAuthenticated, profile, loading, profileLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // FIX 3: baca role awal dari state navigasi (tombol "I'm a Doctor" di landing page)
  const initialRoleFromState = location.state?.initialRole
  const [role, setRole] = useState<UserRole>(
    initialRoleFromState === 'doctor' ? 'doctor' : 'patient',
  )

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [assignedDoctorId, setAssignedDoctorId] = useState('')
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (role !== 'patient') return

    let isMounted = true

    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'doctor')
      .then(({ data, error: fetchError }) => {
        if (!isMounted) return
        if (fetchError) {
          console.error('Failed to load doctors list:', fetchError)
          return
        }
        if (data) setDoctors(data as DoctorOption[])
      })

    return () => {
      isMounted = false
    }
  }, [role])

  if (loading || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-ink-soft">
        Loading…
      </div>
    )
  }

  if (isAuthenticated && profile) {
    return <Navigate to={profile.role === 'doctor' ? '/doctor' : '/patient'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // FIX 2: pasien wajib memilih dokter jika daftar dokter tersedia,
    // agar tidak memicu error FK "recordings_patient_id_fkey" di kemudian hari.
    if (role === 'patient' && doctors.length > 0 && !assignedDoctorId) {
      setError('Please select a doctor to monitor your cardiovascular reports.')
      setSubmitting(false)
      return
    }

    // FIX 1: full_name & role dikirim lewat options.data saat signUp
    const { error: signUpError } = await signUp({
      email,
      password,
      fullName,
      role,
      assignedDoctorId: role === 'patient' ? assignedDoctorId || undefined : undefined,
    })

    if (signUpError) {
      setError(signUpError)
      setSubmitting(false)
      return
    }

    // FIX 1 (lanjutan): jaminan (fallback) agar baris di tabel `profiles`
    // benar-benar tersimpan di Table Editor Supabase, bukan cuma di user_metadata.
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: userData.user.id,
          full_name: fullName,
          role,
          assigned_doctor_id: role === 'patient' ? assignedDoctorId || null : null,
          updated_at: new Date().toISOString(),
        })
        if (upsertError) {
          console.error('Profile upsert fallback failed:', upsertError)
        }
      }
    } catch (dbError) {
      console.error('Profile upsert fallback threw:', dbError)
    }

    setSubmitting(false)
    navigate(role === 'doctor' ? '/doctor' : '/patient', { replace: true })
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="flex items-center gap-2 justify-center mb-8 text-ink">
        <HeartPulse size={24} className="text-coral" aria-hidden="true" />
        <span className="font-display text-xl font-semibold">CardiologistAI</span>
      </div>

      <h1 className="font-display text-2xl font-semibold text-ink text-center mb-2">
        Create your account
      </h1>
      <p className="text-ink-soft text-center mb-8">
        Choose the portal that fits you — you can&rsquo;t change this after signup in this demo.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setRole('patient')}
          className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition-colors ${
            role === 'patient' ? 'border-teal bg-teal-soft text-teal-deep' : 'border-ink/15 text-ink-soft'
          }`}
        >
          <UserRound size={20} aria-hidden="true" />
          <span className="font-medium text-sm">Patient</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('doctor')}
          className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition-colors ${
            role === 'doctor' ? 'border-teal bg-teal-soft text-teal-deep' : 'border-ink/15 text-ink-soft'
          }`}
        >
          <Stethoscope size={20} aria-hidden="true" />
          <span className="font-medium text-sm">Doctor</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-ink mb-1.5">
            Full name
          </label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 focus:border-teal outline-none"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 focus:border-teal outline-none"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
            Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        {role === 'patient' && (
          <div>
            <label htmlFor="doctor" className="block text-sm font-medium text-ink mb-1.5">
              Assign a doctor
            </label>
            <select
              id="doctor"
              required
              value={assignedDoctorId}
              onChange={(e) => setAssignedDoctorId(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 focus:border-teal outline-none bg-paper"
            >
              <option value="" disabled>-- Select Your Assigned Specialist --</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.full_name}
                </option>
              ))}
            </select>
            {doctors.length === 0 && (
              <p className="text-xs text-alert mt-1.5 bg-alert-soft px-2 py-1.5 rounded">
                Warning: No doctor accounts found. Create a Doctor account first to prevent recording data errors.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-alert text-sm bg-alert-soft rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal text-paper font-semibold rounded-full py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-teal font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}