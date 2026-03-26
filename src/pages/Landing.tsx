import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { usePrivy } from '@privy-io/react-auth'
import Navbar from '../components/Navbar'
import { useSlot } from '../hooks/useSlot'
import { useAuth } from '../contexts/AuthContext'

/* ─────────────────────────── helpers ─────────────────────────── */

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1800
    const step = 16
    const increment = end / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [inView, end])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ─────────────────────────── ticker ──────────────────────────── */

const TICKER_ITEMS = [
  '▸ KEEPER REGISTERED', '▸ TASK EXECUTED', '▸ AGENT SCHEDULED', '▸ PAYMENT RELEASED',
  '▸ SLOT 302,847,112', '▸ 3 ACTIVE KEEPERS', '▸ CPI DISPATCHED', '▸ STAKE LOCKED',
  '▸ CRON PROTOCOL v0.1.0', '▸ AGENT PROTOCOL v0.1.0',
]
function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="overflow-hidden border-t border-b border-[oklch(18%_0_0)] py-3 bg-[oklch(6%_0_0)]">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="font-mono text-xs text-[oklch(40%_0_0)] tracking-widest mx-8">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────── hero ────────────────────────────── */

function Hero() {
  const slot = useSlot()
  const { authenticated } = usePrivy()
  const { hasProfile } = useAuth()
  const navigate = useNavigate()

  function handleLaunch() {
    if (authenticated && hasProfile) navigate('/app')
    else if (authenticated) navigate('/onboarding')
    else navigate('/login')
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden circuit-bg pt-14">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[oklch(4%_0_0)]" />

      {/* Slot counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 mb-8 font-mono text-xs text-[oklch(35%_0_0)] tracking-widest"
      >
        SLOT {slot.toLocaleString()}
        <span className="inline-block w-2 h-3 bg-[oklch(35%_0_0)] ml-1 animate-blink" />
      </motion.div>

      {/* Headline */}
      <div className="relative z-10 text-center px-6 max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono font-medium text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-none mb-6"
        >
          AUTONOMOUS
          <br />
          <span className="text-[oklch(40%_0_0)]">SCHEDULING</span>
          <br />
          ON SOLANA
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-sm md:text-base text-[oklch(50%_0_0)] max-w-2xl mx-auto leading-relaxed tracking-wide mb-10"
        >
          Cron Protocol executes AI agent tasks at any future slot — trustlessly,
          without human intervention. Keepers compete to execute. The protocol pays them in $CRONAI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={handleLaunch}
            className="font-mono text-sm border border-white text-white px-8 py-3 hover:bg-white hover:text-black transition-colors tracking-widest uppercase"
          >
            {authenticated && hasProfile ? 'Open Dashboard →' : 'Connect Wallet'}
          </button>
          <a
            href="#how-it-works"
            className="font-mono text-sm border border-[oklch(25%_0_0)] text-[oklch(55%_0_0)] px-8 py-3 hover:border-[oklch(40%_0_0)] hover:text-white transition-colors tracking-widest uppercase"
          >
            How It Works
          </a>
        </motion.div>
      </div>

      {/* Bottom stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 mt-20 w-full max-w-4xl mx-auto px-6"
      >
        <div className="grid grid-cols-3 border border-[oklch(18%_0_0)]">
          {[
            { label: 'Tasks Executed', value: 0, suffix: '' },
            { label: 'Active Keepers', value: 3, suffix: '' },
            { label: 'Avg Latency', value: 400, suffix: 'ms' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`py-6 px-6 text-center ${i > 0 ? 'border-l border-[oklch(18%_0_0)]' : ''}`}
            >
              <div className="font-mono text-3xl font-medium text-white mb-1">
                <Counter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="font-mono text-xs text-[oklch(40%_0_0)] tracking-widest uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

/* ─────────────────────────── how it works ────────────────────── */

const STEPS = [
  {
    num: '01',
    title: 'Schedule a Task',
    desc: 'Client calls register_task() specifying a target slot, CPI payload, and $CRONAI fee. The task is stored on-chain as a PDA.',
    code: `sdk.scheduleAgentTask({
  agentProfile: myAgent,
  targetSlot: currentSlot + 10_000,
  budgetLamports: 100_000_000,
  cronFee: 100_000_000,
})`,
  },
  {
    num: '02',
    title: 'Keepers Monitor',
    desc: 'Registered keepers poll every 400ms. When target_slot ≤ current_slot, any keeper can submit execute_task().',
    code: `// Keeper polls RPC
let pending = getPendingTasks(program);
for task in pending {
  if task.target_slot <= slot {
    execute_task(task);
  }
}`,
  },
  {
    num: '03',
    title: 'CPI Fires',
    desc: 'The scheduler CPIs into Agent Protocol, triggering the on-chain job. First executor wins and earns $CRONAI.',
    code: `// On-chain execution
invoke(&Instruction {
  program_id: cpi_program,
  accounts: task.cpi_accounts,
  data: task.cpi_data,
}, &account_infos)?;`,
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 px-6 max-w-7xl mx-auto">
      <FadeIn className="mb-16">
        <div className="font-mono text-xs text-[oklch(40%_0_0)] tracking-widest uppercase mb-4">
          Protocol
        </div>
        <h2 className="font-mono text-3xl md:text-4xl font-medium text-white">
          How Cron Protocol Works
        </h2>
      </FadeIn>

      <div className="grid md:grid-cols-3 gap-0">
        {STEPS.map((step, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div className={`border border-[oklch(18%_0_0)] p-8 h-full ${i > 0 ? 'border-l-0' : ''}`}>
              <div className="font-mono text-[oklch(25%_0_0)] text-5xl font-medium mb-6">
                {step.num}
              </div>
              <h3 className="font-mono text-base font-medium text-white mb-3 tracking-wide">
                {step.title}
              </h3>
              <p className="font-mono text-xs text-[oklch(50%_0_0)] leading-relaxed mb-6">
                {step.desc}
              </p>
              <pre className="font-mono text-xs text-[oklch(45%_0_0)] bg-[oklch(8%_0_0)] border border-[oklch(14%_0_0)] p-4 overflow-x-auto leading-relaxed">
                {step.code}
              </pre>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────── architecture ────────────────────── */

function Architecture() {
  return (
    <section className="py-24 px-6 border-t border-[oklch(18%_0_0)]">
      <div className="max-w-7xl mx-auto">
        <FadeIn className="mb-16">
          <div className="font-mono text-xs text-[oklch(40%_0_0)] tracking-widest uppercase mb-4">
            Architecture
          </div>
          <h2 className="font-mono text-3xl md:text-4xl font-medium text-white">
            Two Protocols. One Ecosystem.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-0">
          {[
            {
              label: 'Agent Protocol',
              sub: 'WHO does the work',
              items: ['AgentProfile PDA', 'Job PDA (SOL escrow)', 'Rating PDA', '10 instructions · 60 tests'],
              status: 'LIVE · DEVNET',
            },
            {
              label: 'Cron Protocol',
              sub: 'WHEN it happens',
              items: ['Scheduler (5 ix)', 'Staking + Slashing (4 ix)', 'Keeper Registry', '15 tests'],
              status: 'LIVE · DEVNET',
            },
          ].map((proto, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div className={`border border-[oklch(18%_0_0)] p-10 ${i > 0 ? 'border-l-0' : ''}`}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-mono text-xl font-medium text-white mb-1">{proto.label}</h3>
                    <p className="font-mono text-xs text-[oklch(40%_0_0)] tracking-wide">{proto.sub}</p>
                  </div>
                  <span className="font-mono text-[10px] border border-[oklch(72%_0.18_145)] text-[oklch(72%_0.18_145)] px-2 py-1 tracking-widest">
                    {proto.status}
                  </span>
                </div>
                <ul className="space-y-3">
                  {proto.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-3 font-mono text-xs text-[oklch(60%_0_0)]">
                      <span className="w-1 h-1 bg-[oklch(40%_0_0)] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* SDK bar */}
        <FadeIn delay={0.2}>
          <div className="border border-[oklch(18%_0_0)] border-t-0 p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-mono text-sm font-medium text-white mb-1">@cronai/sdk</div>
              <div className="font-mono text-xs text-[oklch(45%_0_0)]">
                Unified TypeScript SDK · scheduleAgentTask · getPendingTasks · registerKeeper
              </div>
            </div>
            <code className="font-mono text-xs text-[oklch(55%_0_0)] bg-[oklch(8%_0_0)] px-4 py-2 border border-[oklch(14%_0_0)]">
              npm install @cronai/sdk
            </code>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ─────────────────────────── token ───────────────────────────── */

function Token() {
  return (
    <section id="token" className="py-32 px-6 border-t border-[oklch(18%_0_0)] circuit-bg">
      <div className="max-w-7xl mx-auto">
        <FadeIn className="text-center mb-16">
          <div className="font-mono text-xs text-[oklch(40%_0_0)] tracking-widest uppercase mb-4">
            Token
          </div>
          <h2 className="font-mono text-3xl md:text-4xl font-medium text-white mb-4">
            $CRONAI — The Economic Fuel
          </h2>
          <p className="font-mono text-sm text-[oklch(50%_0_0)] max-w-xl mx-auto leading-relaxed">
            Every scheduled task pays a $CRONAI fee. Keepers stake $CRONAI to participate.
            Slashing punishes bad actors. The protocol is self-sustaining.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {[
            { label: 'Fee per Task', value: '50–100', unit: '$CRONAI' },
            { label: 'Min Keeper Stake', value: '1,000', unit: '$CRONAI' },
            { label: 'Slash Penalty', value: '10%', unit: 'of stake' },
            { label: 'Launch', value: 'pump.fun', unit: 'external' },
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className={`border border-[oklch(18%_0_0)] p-8 text-center bg-[oklch(6%_0_0)] ${i > 0 ? 'border-l-0' : ''}`}>
                <div className="font-mono text-2xl font-medium text-white mb-1">{item.value}</div>
                <div className="font-mono text-[10px] text-[oklch(55%_0_0)] tracking-widest uppercase mb-1">{item.unit}</div>
                <div className="font-mono text-[10px] text-[oklch(35%_0_0)] tracking-widest uppercase">{item.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3} className="mt-10">
          <div className="border border-[oklch(18%_0_0)] p-6 bg-[oklch(6%_0_0)] flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-2 h-2 bg-[oklch(72%_0.18_145)] shrink-0 mt-1" />
            <p className="font-mono text-xs text-[oklch(50%_0_0)] leading-relaxed">
              The $CRONAI token is launched on <strong className="text-white">pump.fun</strong> and is external to this protocol.
              We do not control the token contract. The fee_mint in our programs accepts any SPL token —
              it is set at initialize() time and can be updated to the real $CRONAI address after launch.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ─────────────────────────── keeper ──────────────────────────── */

function KeeperSection() {
  return (
    <section id="keeper" className="py-32 px-6 border-t border-[oklch(18%_0_0)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-0 items-start">
          <FadeIn className="pr-0 md:pr-16 mb-10 md:mb-0">
            <div className="font-mono text-xs text-[oklch(40%_0_0)] tracking-widest uppercase mb-4">
              Keepers
            </div>
            <h2 className="font-mono text-3xl md:text-4xl font-medium text-white mb-6">
              Run a Keeper Node.
              <br />
              Earn $CRONAI.
            </h2>
            <p className="font-mono text-sm text-[oklch(50%_0_0)] leading-relaxed mb-8">
              Keeper nodes watch the chain and execute due tasks. First to submit wins the fee.
              Stake $CRONAI to participate. Reliable keepers earn consistently — bad actors get slashed.
            </p>
            <div className="space-y-3">
              {[
                'Polls Solana RPC every 400ms',
                'Submits execute_task() with priority fees',
                'Handles race conditions gracefully',
                'Earn proportional $CRONAI fees',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 font-mono text-xs text-[oklch(60%_0_0)]">
                  <span className="text-[oklch(72%_0.18_145)]">▸</span>
                  {item}
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="border border-[oklch(18%_0_0)] bg-[oklch(6%_0_0)]">
              <div className="border-b border-[oklch(18%_0_0)] px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-mono text-xs text-[oklch(35%_0_0)] ml-2">keeper — bash</span>
              </div>
              <pre className="font-mono text-xs text-[oklch(55%_0_0)] p-6 leading-loose overflow-x-auto">
{`$ cd keeper
$ cat > .env << EOF
  SOLANA_RPC_URL=https://api.devnet.solana.com
  KEEPER_KEYPAIR_PATH=~/.config/solana/id.json
  SCHEDULER_PROGRAM_ID=73gdh...n4Y
  POLL_INTERVAL_MS=400
EOF

$ RUST_LOG=keeper=info cargo run --release

[INFO] keeper: starting poll loop
[INFO] keeper: slot=302847112 pending=0
[INFO] keeper: slot=302847113 pending=1
[INFO] keeper: executing task Av3x...7j2
[INFO] keeper: ✓ executed, fee=100 CRONAI`}
              </pre>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── flows ───────────────────────────── */

const FLOWS = [
  {
    title: 'Scheduled Agent Invocation',
    desc: 'A client wants an AI agent to run at a future slot. The SDK creates a Job PDA + Task PDA in one call.',
    steps: ['invoke_agent() → Job PDA + SOL escrow', 'register_task() with CPI at targetSlot', 'Keeper executes at targetSlot', 'release_payment() → agent earns SOL'],
  },
  {
    title: 'Recurring DCA via Agent',
    desc: 'Schedule 30 daily DCA runs in one transaction batch. Creates 30 tasks with 5-per-batch batching.',
    steps: ['scheduleRecurringTask({ intervalSlots: 216_000, totalRuns: 30 })', 'Creates 30 tasks in batches of 5', 'Each run executes the agent autonomously', 'Agent earns SOL per completed run'],
  },
  {
    title: 'Agent Self-Scheduling',
    desc: 'An AI agent schedules its own next execution directly from its keypair after completing a task.',
    steps: ['Agent completes current task', 'Calls register_task() with its own keypair', 'Targets next slot for condition check', 'Fully autonomous, no human required'],
  },
]

function Flows() {
  return (
    <section className="py-24 px-6 border-t border-[oklch(18%_0_0)] bg-[oklch(5%_0_0)]">
      <div className="max-w-7xl mx-auto">
        <FadeIn className="mb-16">
          <div className="font-mono text-xs text-[oklch(40%_0_0)] tracking-widest uppercase mb-4">
            Use Cases
          </div>
          <h2 className="font-mono text-3xl md:text-4xl font-medium text-white">
            Three Unified Flows
          </h2>
        </FadeIn>

        <div className="space-y-0">
          {FLOWS.map((flow, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="border border-[oklch(18%_0_0)] border-b-0 last:border-b p-8 grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <div className="font-mono text-[oklch(30%_0_0)] text-4xl font-medium mb-4">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="font-mono text-lg font-medium text-white mb-3">{flow.title}</h3>
                  <p className="font-mono text-xs text-[oklch(50%_0_0)] leading-relaxed">{flow.desc}</p>
                </div>
                <div className="space-y-2">
                  {flow.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <span className="font-mono text-[10px] text-[oklch(30%_0_0)] pt-0.5 shrink-0">
                        {String(j + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono text-xs text-[oklch(55%_0_0)] leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── CTA ─────────────────────────────── */

function CTA() {
  return (
    <section className="py-32 px-6 border-t border-[oklch(18%_0_0)] circuit-bg">
      <div className="max-w-3xl mx-auto text-center">
        <FadeIn>
          <h2 className="font-mono text-4xl md:text-5xl font-medium text-white mb-6 leading-tight">
            Ready to automate
            <br />
            your agents?
          </h2>
          <p className="font-mono text-sm text-[oklch(50%_0_0)] mb-10 leading-relaxed">
            Schedule your first task on devnet in minutes.
            No keeper node required to get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app/schedule"
              className="font-mono text-sm bg-white text-black px-10 py-4 hover:bg-[oklch(85%_0_0)] transition-colors tracking-widest uppercase font-medium"
            >
              Schedule a Task
            </Link>
            <Link
              to="/app/keeper"
              className="font-mono text-sm border border-[oklch(25%_0_0)] text-[oklch(55%_0_0)] px-10 py-4 hover:border-[oklch(40%_0_0)] hover:text-white transition-colors tracking-widest uppercase"
            >
              Run a Keeper
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

/* ─────────────────────────── footer ──────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-[oklch(18%_0_0)] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border border-[oklch(30%_0_0)] flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[oklch(30%_0_0)]" />
          </div>
          <span className="font-mono text-xs text-[oklch(35%_0_0)] tracking-widest uppercase">
            CronAI — MIT License
          </span>
        </div>
        <div className="flex items-center gap-8">
          <span className="font-mono text-xs text-[oklch(25%_0_0)] tracking-widest">
            Agent Protocol · GEtqx8oS...JYUG
          </span>
          <span className="font-mono text-xs text-[oklch(25%_0_0)] tracking-widest">
            Scheduler · 73gdhs...n4Y
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────── page ────────────────────────────── */

export default function Landing() {
  return (
    <div className="bg-[oklch(4%_0_0)] min-h-screen">
      <Navbar />
      <Hero />
      <Ticker />
      <HowItWorks />
      <Architecture />
      <Token />
      <KeeperSection />
      <Flows />
      <CTA />
      <Footer />
    </div>
  )
}
