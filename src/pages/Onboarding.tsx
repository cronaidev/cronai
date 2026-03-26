import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets } from '@privy-io/react-auth/solana'
import { useAuth } from '../contexts/AuthContext'

/* ─── Loading sequence ─────────────────────────────────────────── */

const BOOT_LINES = [
  { text: 'AUTHENTICATING IDENTITY', delay: 0 },
  { text: 'VERIFYING WALLET SIGNATURE', delay: 500 },
  { text: 'LOADING USER PROFILE', delay: 1000 },
  { text: 'INITIALIZING SCHEDULER SDK', delay: 1500 },
  { text: 'CONNECTING TO SOLANA DEVNET', delay: 2000 },
  { text: 'BOOTING DASHBOARD', delay: 2500 },
]

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState<number[]>([])
  const [done, setDone] = useState<number[]>([])
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    BOOT_LINES.forEach(({ delay }, i) => {
      setTimeout(() => setVisible(v => [...v, i]), delay)
      setTimeout(() => setDone(v => [...v, i]), delay + 400)
    })
    setTimeout(() => {
      setFinished(true)
      setTimeout(onDone, 600)
    }, 3200)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={finished ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-[oklch(4%_0_0)] circuit-bg flex items-center justify-center"
    >
      <div className="w-full max-w-md px-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-6 h-6 border border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white" />
          </div>
          <span className="font-mono text-sm font-medium tracking-widest uppercase text-white">
            CronAI
          </span>
        </div>

        {/* Boot lines */}
        <div className="space-y-3">
          <AnimatePresence>
            {BOOT_LINES.map((line, i) =>
              visible.includes(i) ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between"
                >
                  <span className="font-mono text-xs text-[oklch(50%_0_0)] tracking-widest">
                    <span className="text-[oklch(30%_0_0)] mr-2">▸</span>
                    {line.text}
                  </span>
                  {done.includes(i) ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-mono text-[10px] text-[oklch(72%_0.18_145)] tracking-widest"
                    >
                      OK
                    </motion.span>
                  ) : (
                    <span className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest animate-blink">
                      ...
                    </span>
                  )}
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="mt-10 h-px bg-[oklch(12%_0_0)]">
          <motion.div
            className="h-full bg-white"
            initial={{ width: '0%' }}
            animate={{ width: finished ? '100%' : `${(done.length / BOOT_LINES.length) * 90}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Registration form ────────────────────────────────────────── */

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, logout } = usePrivy()
  const { wallets } = useWallets()
  const { saveProfile, hasProfile } = useAuth()

  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already has profile — show loading and redirect
  useEffect(() => {
    if (hasProfile) {
      setLoading(true)
    }
  }, [hasProfile])

  const walletAddress = wallets[0]?.address ?? user?.wallet?.address ?? ''

  function validate(val: string) {
    if (val.length < 3) return 'At least 3 characters'
    if (val.length > 20) return 'Max 20 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Only letters, numbers, and underscores'
    return ''
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    const err = validate(username)
    if (err) { setError(err); return }
    saveProfile(username.toLowerCase(), walletAddress)
    setLoading(true)
  }

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen onDone={() => navigate('/app', { replace: true })} />}
      </AnimatePresence>

      {!loading && (
        <div className="min-h-screen bg-[oklch(4%_0_0)] circuit-bg flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12">
              <div className="w-6 h-6 border border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white" />
              </div>
              <span className="font-mono text-sm font-medium tracking-widest uppercase text-white">
                CronAI
              </span>
            </div>

            <h1 className="font-mono text-2xl font-medium text-white mb-2">
              Create your account
            </h1>
            <p className="font-mono text-xs text-[oklch(45%_0_0)] mb-8 leading-relaxed">
              Choose a username to set up your CronAI profile.
              Your wallet and tasks will be linked to this identity.
            </p>

            {/* Wallet chip */}
            {walletAddress && (
              <div className="flex items-center gap-3 mb-8 px-4 py-3 border border-[oklch(18%_0_0)] bg-[oklch(6%_0_0)]">
                <div className="w-1.5 h-1.5 bg-[oklch(72%_0.18_145)]" />
                <span className="font-mono text-xs text-[oklch(55%_0_0)] truncate">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                </span>
                <span className="font-mono text-[10px] text-[oklch(30%_0_0)] ml-auto tracking-widest uppercase">
                  CONNECTED
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest uppercase block mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[oklch(30%_0_0)]">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError('') }}
                    placeholder="your_username"
                    maxLength={20}
                    autoFocus
                    className="w-full font-mono text-sm bg-[oklch(6%_0_0)] border border-[oklch(18%_0_0)] text-white pl-8 pr-4 py-3 focus:outline-none focus:border-[oklch(45%_0_0)] transition-colors placeholder:text-[oklch(22%_0_0)]"
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-mono text-[10px] text-[oklch(65%_0.2_25)] mt-2"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={username.length < 3}
                className="w-full font-mono text-sm bg-white text-black py-3 tracking-widest uppercase font-medium
                  disabled:opacity-30 disabled:cursor-not-allowed
                  hover:enabled:bg-[oklch(85%_0_0)] transition-colors"
              >
                Enter Dashboard →
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={logout}
                className="font-mono text-[10px] text-[oklch(28%_0_0)] hover:text-[oklch(45%_0_0)] transition-colors tracking-widest uppercase"
              >
                Disconnect wallet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
