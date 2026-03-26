import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { usePrivy } from '@privy-io/react-auth'

export interface UserProfile {
  id: string
  username: string
  wallet: string
  createdAt: number
}

interface AuthContextValue {
  profile: UserProfile | null
  saveProfile: (username: string, wallet: string) => void
  hasProfile: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const KEY = 'cronai_profiles'

function load(): Record<string, UserProfile> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  catch { return {} }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, authenticated } = usePrivy()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!authenticated || !user) { setProfile(null); return }
    const profiles = load()
    setProfile(profiles[user.id] ?? null)
  }, [authenticated, user])

  function saveProfile(username: string, wallet: string) {
    if (!user) return
    const profiles = load()
    const p: UserProfile = { id: user.id, username, wallet, createdAt: Date.now() }
    profiles[user.id] = p
    localStorage.setItem(KEY, JSON.stringify(profiles))
    setProfile(p)
  }

  return (
    <AuthContext.Provider value={{ profile, saveProfile, hasProfile: !!profile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
