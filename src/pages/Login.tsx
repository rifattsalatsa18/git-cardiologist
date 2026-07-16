import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { PasswordInput } from '../components/ui/PasswordInput'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { signIn, isAuthenticated, profile, loading, profileLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

    const { error: signInError, profile: signedInProfile } = await signIn(email, password)
    setSubmitting(false)

    if (signInError) {
      setError(signInError)
      return
    }

    navigate(signedInProfile?.role === 'doctor' ? '/doctor' : '/patient', { replace: true })
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="flex items-center gap-2 justify-center mb-8 text-ink">
        <HeartPulse size={24} className="text-coral" aria-hidden="true" />
        <span className="font-display text-xl font-semibold">CardiologistAI</span>
      </div>

      <h1 className="font-display text-2xl font-semibold text-ink text-center mb-2">
        Welcome back
      </h1>
      <p className="text-ink-soft text-center mb-8">Log in to see your dashboard.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-alert text-sm bg-alert-soft rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal text-paper font-semibold rounded-full py-2.5 hover:bg-teal-deep transition-colors disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft mt-6">
        New here?{' '}
        <Link to="/signup" className="text-teal font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
