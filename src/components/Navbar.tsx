import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useAuth } from '../contexts/AuthContext'
import { useSlot } from '../hooks/useSlot'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const isLanding = location.pathname === '/'
  const isDashboard = location.pathname.startsWith('/app')
  const slot = useSlot()
  const { authenticated, logout, ready } = usePrivy()
  const { profile, hasProfile } = useAuth()

  function handleConnect() {
    if (authenticated && hasProfile) navigate('/app')
    else if (authenticated) navigate('/onboarding')
    else navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[oklch(18%_0_0)] bg-[oklch(4%_0_0/90%)] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 border border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white" />
          </div>
          <span className="font-mono text-sm font-medium tracking-widest uppercase text-white">CronAI</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {isLanding && (
            <>
              <a href="#how-it-works" className="font-mono text-xs text-[oklch(55%_0_0)] hover:text-white transition-colors tracking-wider uppercase">Protocol</a>
              <a href="#token" className="font-mono text-xs text-[oklch(55%_0_0)] hover:text-white transition-colors tracking-wider uppercase">Token</a>
              <a href="#keeper" className="font-mono text-xs text-[oklch(55%_0_0)] hover:text-white transition-colors tracking-wider uppercase">Keepers</a>
            </>
          )}
          {isDashboard && (
            <span className="font-mono text-[10px] text-[oklch(28%_0_0)] tracking-widest">
              SLOT {slot.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {authenticated && profile && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="font-mono text-xs text-[oklch(40%_0_0)]">@{profile.username}</span>
              <button
                onClick={logout}
                className="font-mono text-[10px] text-[oklch(28%_0_0)] hover:text-[oklch(50%_0_0)] transition-colors tracking-widest uppercase"
              >
                Disconnect
              </button>
            </div>
          )}
          {authenticated && hasProfile && !isDashboard && (
            <Link
              to="/app"
              className="font-mono text-xs bg-white text-black px-4 py-2 hover:bg-[oklch(85%_0_0)] transition-colors tracking-widest uppercase"
            >
              Dashboard →
            </Link>
          )}
          {(!authenticated || !hasProfile) && (
            <button
              onClick={handleConnect}
              disabled={!ready}
              className="font-mono text-xs border border-white text-white px-4 py-2 hover:bg-white hover:text-black transition-colors tracking-widest uppercase disabled:opacity-40"
            >
              {authenticated && !hasProfile ? 'Continue →' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
