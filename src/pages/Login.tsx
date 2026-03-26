import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrivy, useLoginWithEmail, useLoginWithSiws } from '@privy-io/react-auth'
import { useAuth } from '../contexts/AuthContext'

function toBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''))
}

type View = 'main' | 'email' | 'otp'
type WalletId = 'phantom' | 'solflare'

declare global {
  interface Window {
    phantom?: {
      solana?: {
        connect: () => Promise<{ publicKey: { toBase58(): string } }>
        signMessage: (msg: Uint8Array, enc: string) => Promise<{ signature: Uint8Array }>
      }
    }
    solflare?: {
      isSolflare?: boolean
      connect: () => Promise<void>
      publicKey?: { toBase58(): string }
      signMessage: (msg: Uint8Array) => Promise<{ signature: Uint8Array }>
    }
  }
}

/* ─── Boot animation ──────────────────────────────────────────── */

const BOOT_LINES = [
  { text: 'AUTHENTICATING IDENTITY',     delay: 0 },
  { text: 'VERIFYING WALLET SIGNATURE',  delay: 500 },
  { text: 'LOADING USER PROFILE',        delay: 1000 },
  { text: 'INITIALIZING SCHEDULER SDK',  delay: 1500 },
  { text: 'CONNECTING TO SOLANA DEVNET', delay: 2000 },
  { text: 'BOOTING DASHBOARD',           delay: 2500 },
]

function BootScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState<number[]>([])
  const [done, setDone] = useState<number[]>([])
  const [out, setOut] = useState(false)

  useEffect(() => {
    BOOT_LINES.forEach(({ delay }, i) => {
      setTimeout(() => setVisible(v => [...v, i]), delay)
      setTimeout(() => setDone(v => [...v, i]), delay + 400)
    })
    setTimeout(() => { setOut(true); setTimeout(onDone, 600) }, 3200)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={out ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-[oklch(4%_0_0)] circuit-bg flex items-center justify-center"
    >
      <div className="w-full max-w-md px-8">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-6 h-6 border border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white" />
          </div>
          <span className="font-mono text-sm font-medium tracking-widest uppercase text-white">CronAI</span>
        </div>

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
                    <span className="text-[oklch(28%_0_0)] mr-2">▸</span>{line.text}
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
                    <span className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest animate-blink">...</span>
                  )}
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 h-px bg-[oklch(12%_0_0)]">
          <motion.div
            className="h-full bg-white"
            initial={{ width: '0%' }}
            animate={{ width: out ? '100%' : `${(done.length / BOOT_LINES.length) * 90}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Wallet button ────────────────────────────────────────────── */

function WalletButton({
  name, logo, status, onClick,
}: {
  name: string
  logo: string
  status: 'idle' | 'connecting' | 'signing' | 'unavailable'
  onClick: () => void
}) {
  const unavailable = status === 'unavailable'
  const busy = status === 'connecting' || status === 'signing'

  const statusLabel = {
    idle: 'CONNECT →',
    connecting: 'CONNECTING...',
    signing: 'SIGN IN WALLET...',
    unavailable: 'NOT INSTALLED',
  }[status]

  return (
    <motion.button
      whileTap={unavailable || busy ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={unavailable || busy}
      className="w-full flex items-center justify-between px-5 py-4 border border-[oklch(18%_0_0)] bg-[oklch(6%_0_0)]
        hover:enabled:border-[oklch(40%_0_0)] hover:enabled:bg-[oklch(9%_0_0)]
        disabled:opacity-30 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <img src={logo} alt={name} className="w-8 h-8 object-contain" />
        <span className="font-mono text-sm text-white">{name}</span>
      </div>
      <span className={`font-mono text-[10px] tracking-widest transition-colors ${
        busy
          ? 'text-[oklch(55%_0_0)] animate-blink'
          : unavailable
            ? 'text-[oklch(25%_0_0)]'
            : 'text-[oklch(30%_0_0)] group-hover:text-[oklch(70%_0_0)]'
      }`}>
        {statusLabel}
      </span>
    </motion.button>
  )
}

/* ─── Privy badge ─────────────────────────────────────────────── */

function PrivyBadge() {
  return (
    <div className="mt-10 pt-6 border-t border-[oklch(10%_0_0)]">
      <a
        href="https://privy.io"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 group"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[oklch(40%_0_0)] group-hover:text-white transition-colors shrink-0">
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="text-left">
          <div className="font-mono text-[10px] text-[oklch(40%_0_0)] group-hover:text-white transition-colors tracking-wider">
            SECURED BY <span className="text-[oklch(55%_0_0)] group-hover:text-white font-medium">PRIVY</span>
          </div>
          <div className="font-mono text-[9px] text-[oklch(26%_0_0)] tracking-wider mt-0.5">
            Non-custodial · Self-sovereign · Solana devnet
          </div>
        </div>
      </a>
    </div>
  )
}

/* ─── Main page ────────────────────────────────────────────────── */

export default function LoginPage() {
  const navigate = useNavigate()
  const { authenticated, ready } = usePrivy()
  const { hasProfile } = useAuth()
  const { generateSiwsMessage, loginWithSiws } = useLoginWithSiws()
  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail()

  const [view, setView] = useState<View>('main')
  const [booting, setBooting] = useState(false)
  const [walletStatus, setWalletStatus] = useState<Record<WalletId, 'idle' | 'connecting' | 'signing' | 'unavailable'>>({
    phantom: window.phantom?.solana ? 'idle' : 'unavailable',
    solflare: window.solflare?.isSolflare ? 'idle' : 'unavailable',
  })
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (authenticated && !booting) setBooting(true)
  }, [authenticated, booting])

  const onBootDone = useCallback(() => {
    navigate(hasProfile ? '/app' : '/onboarding', { replace: true })
  }, [hasProfile, navigate])

  /* ── SIWS headless wallet flow ── */
  async function connectWallet(id: WalletId) {
    setError('')

    try {
      let address = ''
      let signFn: (msg: Uint8Array) => Promise<Uint8Array>

      setWalletStatus(s => ({ ...s, [id]: 'connecting' }))

      if (id === 'phantom') {
        const provider = window.phantom!.solana!
        const { publicKey } = await provider.connect()
        address = publicKey.toBase58()
        signFn = async (msg) => (await provider.signMessage(msg, 'utf8')).signature
      } else {
        const sf = window.solflare!
        await sf.connect()
        address = sf.publicKey!.toBase58()
        signFn = async (msg) => (await sf.signMessage(msg)).signature
      }

      setWalletStatus(s => ({ ...s, [id]: 'signing' }))
      const message = await generateSiwsMessage({ address })
      const encoded = new TextEncoder().encode(message)
      const sigBytes = await signFn(encoded)
      const signature = toBase64(sigBytes)
      await loginWithSiws({ message, signature })
      // `authenticated` → boot screen via useEffect

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
        setError('Signature cancelled.')
      } else {
        setError(msg)
      }
      setWalletStatus(s => ({
        ...s,
        [id]: id === 'phantom' ? (window.phantom?.solana ? 'idle' : 'unavailable')
                               : (window.solflare?.isSolflare ? 'idle' : 'unavailable'),
      }))
    }
  }

  /* ── Email OTP ── */
  async function handleSendCode(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address'); return }
    setError('')
    setSendingCode(true)
    try {
      await sendCode({ email })
      setView('otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setSendingCode(false)
    }
  }

  async function handleVerifyOtp(e: { preventDefault(): void }) {
    e.preventDefault()
    if (otp.length < 6) { setError('Enter the 6-digit code'); return }
    setError('')
    setVerifying(true)
    try {
      await loginWithCode({ code: otp })
    } catch {
      setError('Invalid code. Try again.')
      setVerifying(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[oklch(4%_0_0)] flex items-center justify-center">
        <span className="font-mono text-xs text-[oklch(25%_0_0)] tracking-widest">
          LOADING<span className="animate-blink">_</span>
        </span>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {booting && <BootScreen onDone={onBootDone} />}
      </AnimatePresence>

      {!booting && (
        <div className="min-h-screen bg-[oklch(4%_0_0)] circuit-bg flex">

          {/* ── Left — branding ── */}
          <div className="hidden lg:flex flex-col justify-between w-1/2 border-r border-[oklch(18%_0_0)] p-16">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white" />
              </div>
              <span className="font-mono text-sm font-medium tracking-widest uppercase text-white">CronAI</span>
            </div>

            <div>
              <h1 className="font-mono text-4xl font-medium text-white leading-tight mb-6">
                AUTONOMOUS<br />
                <span className="text-[oklch(35%_0_0)]">SCHEDULING</span><br />
                ON SOLANA
              </h1>
              <p className="font-mono text-xs text-[oklch(40%_0_0)] leading-relaxed max-w-sm">
                Schedule AI agent tasks to execute at any future slot.
                Trustlessly. Without human intervention.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Active Keepers', val: '3' },
                { label: 'Avg Latency',    val: '400ms' },
                { label: 'Network',        val: 'Devnet' },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between border-b border-[oklch(10%_0_0)] pb-4">
                  <span className="font-mono text-[10px] text-[oklch(30%_0_0)] tracking-widest uppercase">{label}</span>
                  <span className="font-mono text-xs text-[oklch(55%_0_0)]">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right — auth ── */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm"
              >
                {/* Mobile logo */}
                <div className="flex lg:hidden items-center gap-2 mb-10">
                  <div className="w-6 h-6 border border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white" />
                  </div>
                  <span className="font-mono text-sm font-medium tracking-widest uppercase text-white">CronAI</span>
                </div>

                {/* ── Main ── */}
                {view === 'main' && (
                  <>
                    <h2 className="font-mono text-2xl font-medium text-white mb-2">Sign in</h2>
                    <p className="font-mono text-xs text-[oklch(40%_0_0)] mb-8 leading-relaxed">
                      Connect your Solana wallet or continue with email.
                    </p>

                    <div className="space-y-3 mb-6">
                      <WalletButton
                        name="Phantom"
                        logo="/phantom.svg"
                        status={walletStatus.phantom}
                        onClick={() => connectWallet('phantom')}
                      />
                      <WalletButton
                        name="Solflare"
                        logo="/solflare.svg"
                        status={walletStatus.solflare}
                        onClick={() => connectWallet('solflare')}
                      />
                    </div>

                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-[oklch(12%_0_0)]" />
                      <span className="font-mono text-[10px] text-[oklch(28%_0_0)] tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-[oklch(12%_0_0)]" />
                    </div>

                    <button
                      onClick={() => { setView('email'); setError('') }}
                      className="w-full font-mono text-xs border border-[oklch(18%_0_0)] text-[oklch(50%_0_0)]
                        py-3 hover:border-[oklch(35%_0_0)] hover:text-white transition-colors tracking-widest uppercase"
                    >
                      Continue with Email
                    </button>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-mono text-[10px] text-[oklch(65%_0.2_25)] mt-4 text-center"
                      >
                        {error}
                      </motion.p>
                    )}
                  </>
                )}

                {/* ── Email ── */}
                {view === 'email' && (
                  <>
                    <button
                      onClick={() => { setView('main'); setError('') }}
                      className="font-mono text-[10px] text-[oklch(30%_0_0)] hover:text-white transition-colors tracking-widest uppercase mb-8"
                    >
                      ← Back
                    </button>
                    <h2 className="font-mono text-2xl font-medium text-white mb-2">Email sign in</h2>
                    <p className="font-mono text-xs text-[oklch(40%_0_0)] mb-8">
                      We'll send a one-time code to your inbox.
                    </p>
                    <form onSubmit={handleSendCode} className="space-y-4">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError('') }}
                        autoFocus
                        className="w-full font-mono text-sm bg-[oklch(6%_0_0)] border border-[oklch(18%_0_0)] text-white px-4 py-3
                          focus:outline-none focus:border-[oklch(45%_0_0)] transition-colors placeholder:text-[oklch(22%_0_0)]"
                      />
                      {error && <p className="font-mono text-[10px] text-[oklch(65%_0.2_25)]">{error}</p>}
                      <button
                        type="submit"
                        disabled={sendingCode || !email}
                        className="w-full font-mono text-sm bg-white text-black py-3 tracking-widest uppercase font-medium
                          disabled:opacity-30 hover:enabled:bg-[oklch(85%_0_0)] transition-colors"
                      >
                        {sendingCode ? 'SENDING...' : 'Send Code →'}
                      </button>
                    </form>
                  </>
                )}

                {/* ── OTP ── */}
                {view === 'otp' && (
                  <>
                    <button
                      onClick={() => { setView('email'); setOtp(''); setError('') }}
                      className="font-mono text-[10px] text-[oklch(30%_0_0)] hover:text-white transition-colors tracking-widest uppercase mb-8"
                    >
                      ← Back
                    </button>
                    <h2 className="font-mono text-2xl font-medium text-white mb-2">Check your email</h2>
                    <p className="font-mono text-xs text-[oklch(40%_0_0)] mb-1">6-digit code sent to</p>
                    <p className="font-mono text-sm text-white mb-8">{email}</p>

                    {emailState.status === 'sending-code' && (
                      <p className="font-mono text-[10px] text-[oklch(35%_0_0)] mb-4 tracking-wider animate-blink">SENDING CODE...</p>
                    )}

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                        autoFocus
                        className="w-full font-mono text-3xl text-center bg-[oklch(6%_0_0)] border border-[oklch(18%_0_0)] text-white
                          px-4 py-4 focus:outline-none focus:border-[oklch(45%_0_0)] transition-colors
                          tracking-[0.5em] placeholder:text-[oklch(18%_0_0)]"
                      />
                      {error && <p className="font-mono text-[10px] text-[oklch(65%_0.2_25)] text-center">{error}</p>}
                      <button
                        type="submit"
                        disabled={verifying || otp.length < 6}
                        className="w-full font-mono text-sm bg-white text-black py-3 tracking-widest uppercase font-medium
                          disabled:opacity-30 hover:enabled:bg-[oklch(85%_0_0)] transition-colors"
                      >
                        {verifying ? 'VERIFYING...' : 'Verify →'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { sendCode({ email }); setOtp(''); setError('') }}
                        className="w-full font-mono text-[10px] text-[oklch(30%_0_0)] hover:text-[oklch(55%_0_0)] transition-colors tracking-widest uppercase py-2"
                      >
                        Resend code
                      </button>
                    </form>
                  </>
                )}

                <PrivyBadge />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  )
}
