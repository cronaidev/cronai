import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authenticated, ready } = usePrivy()
  const { hasProfile } = useAuth()

  if (!ready) {
    return (
      <div className="min-h-screen bg-[oklch(4%_0_0)] flex items-center justify-center">
        <div className="font-mono text-xs text-[oklch(30%_0_0)] tracking-widest">
          LOADING<span className="animate-blink">_</span>
        </div>
      </div>
    )
  }

  if (!authenticated) return <Navigate to="/login" replace />
  if (!hasProfile) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}
