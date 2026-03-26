import { motion } from 'framer-motion'
import { Star, Briefcase, CheckCircle } from 'lucide-react'

interface Agent {
  pubkey: string
  owner: string
  name: string
  description: string
  hourlyRate: number
  rating: number
  jobs: number
  active: boolean
}

const MOCK_AGENTS: Agent[] = [
  {
    pubkey: 'GEtq...JYUG',
    owner: 'Bk9m...3f4',
    name: 'DeFi Rebalancer',
    description: 'Autonomous portfolio rebalancing agent. Monitors allocations and executes trades via Jupiter.',
    hourlyRate: 5_000_000,
    rating: 48,
    jobs: 127,
    active: true,
  },
  {
    pubkey: 'Av3x...7j2',
    owner: 'Cx1p...9g5',
    name: 'Price Alert Bot',
    description: 'Watches on-chain prices and triggers actions when thresholds are crossed.',
    hourlyRate: 2_000_000,
    rating: 45,
    jobs: 89,
    active: true,
  },
  {
    pubkey: 'Dy7q...2h6',
    owner: 'Ek8r...5i7',
    name: 'NFT Sniper',
    description: 'Monitors new NFT listings and executes buys based on rarity and price conditions.',
    hourlyRate: 10_000_000,
    rating: 42,
    jobs: 34,
    active: false,
  },
  {
    pubkey: 'Fj2s...6j8',
    owner: 'Gl5t...7k9',
    name: 'Yield Optimizer',
    description: 'Moves liquidity between protocols to maximize yield. Integrates with Marinade, Jito, Kamino.',
    hourlyRate: 8_000_000,
    rating: 50,
    jobs: 203,
    active: true,
  },
  {
    pubkey: 'Hn3u...8l0',
    owner: 'Io6v...9m1',
    name: 'Governance Voter',
    description: 'Participates in DAO governance automatically based on configured voting rules.',
    hourlyRate: 1_000_000,
    rating: 38,
    jobs: 15,
    active: true,
  },
  {
    pubkey: 'Jp4w...0n2',
    owner: 'Kq7x...1o3',
    name: 'Liquidation Guard',
    description: 'Monitors borrow positions and triggers deleveraging before liquidation thresholds.',
    hourlyRate: 15_000_000,
    rating: 47,
    jobs: 56,
    active: false,
  },
]

function StarRating({ value }: { value: number }) {
  const stars = Math.round(value / 10)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={10}
          className={i < stars ? 'text-[oklch(80%_0.18_80)] fill-[oklch(80%_0.18_80)]' : 'text-[oklch(20%_0_0)]'}
        />
      ))}
      <span className="font-mono text-xs text-[oklch(45%_0_0)] ml-1">{(value / 10).toFixed(1)}</span>
    </div>
  )
}

export default function AgentsPage() {
  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono text-xl font-medium text-white mb-1">Agents</h1>
          <p className="font-mono text-xs text-[oklch(40%_0_0)]">{MOCK_AGENTS.length} registered agents</p>
        </div>
      </div>

      {/* Outline grid — outer border + inner dividers only */}
      <div className="border border-[oklch(18%_0_0)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_AGENTS.map((agent, i) => (
            <motion.div
              key={agent.pubkey}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 bg-[oklch(6%_0_0)] hover:bg-[oklch(8%_0_0)] transition-colors cursor-pointer
                border-b border-[oklch(18%_0_0)] last:border-b-0
                md:[&:nth-child(2n+1)]:border-r md:[&:nth-child(2n+1)]:border-[oklch(18%_0_0)]
                lg:[&:nth-child(2n+1)]:border-r-0
                lg:border-r lg:[&:nth-child(3n)]:border-r-0
                lg:[&:nth-child(n+4)]:border-b-0 lg:[&:nth-child(4)]:border-b lg:[&:nth-child(5)]:border-b lg:[&:nth-child(6)]:border-b-0
              "
            >
              {/* Top */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 border border-[oklch(18%_0_0)] flex items-center justify-center font-mono text-sm text-[oklch(40%_0_0)]">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                {agent.active ? (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-[oklch(72%_0.18_145)] tracking-wider">
                    <CheckCircle size={10} />
                    ACTIVE
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-[oklch(30%_0_0)] tracking-wider">IDLE</span>
                )}
              </div>

              <h3 className="font-mono text-sm font-medium text-white mb-2">{agent.name}</h3>
              <p className="font-mono text-xs text-[oklch(45%_0_0)] leading-relaxed mb-4 line-clamp-2">
                {agent.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[oklch(12%_0_0)]">
                <StarRating value={agent.rating} />
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-mono text-[10px] text-[oklch(40%_0_0)]">
                    <Briefcase size={10} />
                    {agent.jobs}
                  </span>
                  <span className="font-mono text-[10px] text-[oklch(55%_0_0)]">
                    {(agent.hourlyRate / 1_000_000).toFixed(2)} SOL/hr
                  </span>
                </div>
              </div>

              <div className="mt-3 font-mono text-[10px] text-[oklch(25%_0_0)]">{agent.pubkey}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
