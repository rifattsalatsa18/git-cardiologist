import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Navbar() {
  const { isAuthenticated, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  const portalHref = profile?.role === 'doctor' ? '/doctor' : '/patient'

  return (
    <header className="border-b border-ink/10 bg-paper/90 backdrop-blur sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <HeartPulse size={22} className="text-coral" aria-hidden="true" />
          CardiologistAI
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          {isAuthenticated ? (
            <>
              {profile && (
                <Link to={portalHref} className="text-ink-soft hover:text-teal transition-colors">
                  {profile.role === 'doctor' ? 'Doctor dashboard' : 'My dashboard'}
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogOut}
                className="flex items-center gap-1.5 text-ink-soft hover:text-alert transition-colors"
              >
                <LogOut size={16} aria-hidden="true" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-ink-soft hover:text-teal transition-colors">
                Log in
              </Link>
              <Link
                to="/signup"
                className="bg-teal text-paper px-4 py-2 rounded-full font-medium hover:bg-teal-deep transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
