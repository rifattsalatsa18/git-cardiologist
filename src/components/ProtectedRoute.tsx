import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../lib/types'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserRole
}

function RouteLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-ink-soft">
      Loading…
    </div>
  )
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, profile, loading, profileLoading } = useAuth()

  if (loading || (isAuthenticated && profileLoading)) {
    return <RouteLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && profile && profile.role !== requiredRole) {
    return <Navigate to={profile.role === 'doctor' ? '/doctor' : '/patient'} replace />
  }

  return <>{children}</>
}
