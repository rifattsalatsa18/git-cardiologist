import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Profile, UserRole } from '../lib/types'

interface SignUpArgs {
  email: string
  password: string
  fullName: string
  role: UserRole
  assignedDoctorId?: string
}

interface AuthResult {
  error: string | null
  profile: Profile | null
}

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (args: SignUpArgs) => Promise<AuthResult>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function isVerifiedSession(session: Session | null): boolean {
  if (!session?.access_token || !session.user?.id) return false
  if (session.user.is_anonymous) return false
  return true
}

function buildPlaceholderProfile(user: User): Profile {
  const meta = user.user_metadata ?? {}
  const role: UserRole = meta.role === 'doctor' ? 'doctor' : 'patient'

  return {
    id: user.id,
    full_name: typeof meta.full_name === 'string' ? meta.full_name : 'New User',
    email: user.email ?? '',
    role,
    phone: null,
    assigned_doctor_id:
      typeof meta.assigned_doctor_id === 'string' ? meta.assigned_doctor_id : null,
    created_at: new Date().toISOString(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const loadProfile = useCallback(async (user: User): Promise<Profile> => {
    setProfileLoading(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        const nextProfile = data as Profile
        setProfile(nextProfile)
        setProfileLoading(false)
        return nextProfile
      }
    } catch {
      // profiles table may not exist yet — fall through to placeholder
    }

    const placeholder = buildPlaceholderProfile(user)
    setProfile(placeholder)
    setProfileLoading(false)
    return placeholder
  }, [])

  const hydrateUser = useCallback(
    async (nextSession: Session | null) => {
      if (!isVerifiedSession(nextSession)) {
        setSession(null)
        setProfile(null)
        return
      }

      setSession(nextSession)
      await loadProfile(nextSession!.user)
    },
    [loadProfile],
  )

  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!isMounted) return

      if (userError || !user) {
        setSession(null)
        setProfile(null)
        setLoading(false)
        return
      }

      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (!isMounted) return
      await hydrateUser(initialSession)
      setLoading(false)
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted || event === 'INITIAL_SESSION') return

      if (!isVerifiedSession(newSession)) {
        setSession(null)
        setProfile(null)
        setProfileLoading(false)
        return
      }

      setSession(newSession)
      if (newSession?.user) {
        await loadProfile(newSession.user)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [hydrateUser, loadProfile])

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: error.message, profile: null }
    }

    if (data.session?.user) {
      setSession(data.session)
      const nextProfile = await loadProfile(data.session.user)
      return { error: null, profile: nextProfile }
    }

    return { error: null, profile: null }
  }

  async function signUp({
    email,
    password,
    fullName,
    role,
    assignedDoctorId,
  }: SignUpArgs): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          assigned_doctor_id: assignedDoctorId ?? null,
        },
      },
    })

    if (error) {
      return { error: error.message, profile: null }
    }

    if (data.session?.user) {
      setSession(data.session)
      const nextProfile = await loadProfile(data.session.user)
      return { error: null, profile: nextProfile }
    }
    return signIn(email, password)
  }

  async function signOut() {
    setSession(null)
    setProfile(null)
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (session?.user) {
      await loadProfile(session.user)
    }
  }

  const isAuthenticated = useMemo(() => isVerifiedSession(session), [session])

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        profileLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
