import { useState } from 'react'
import { motion } from 'framer-motion'
import { Server, Shield, TrendingUp, AlertTriangle } from 'lucide-react'

interface KeeperRecord {
  pubkey: string
  stake: number
  tasksExecuted: number
  feesEarned: number
  slashCount: number
  active: boolean
  lastSeen: number
}

const MOCK_KEEPERS: KeeperRecord[] = [
  { pubkey: 'Ek8r...5i7', stake: 5000, tasksExecuted: 127, feesEarned: 12700, slashCount: 0, active: true, lastSeen: Date.now() - 400 },
  { pubkey: 'Dy7q...2h6', stake: 1000, tasksExecuted: 34, feesEarned: 1700, slashCount: 1, active: true, lastSeen: Date.now() - 800 },
  { pubkey: 'Fj2s...6j8', stake: 2500, tasksExecuted: 89, feesEarned: 4450, slashCount: 0, active: false, lastSeen: Date.now() - 120000 },
]

function KeeperCard({ keeper, delay }: { keeper: KeeperRecord; delay: number }) {
  const msAgo = Date.now() - keeper.lastSeen
  const lastSeenStr = msAgo < 1000 ? '<1s ago' : msAgo < 60000 ? `${Math.floor(msAgo / 1000)}s ago` : `${Math.floor(msAgo / 60000)}m ago`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-6 bg-[oklch(6%_0_0)] h-full"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-[oklch(18%_0_0)] flex items-center justify-center">
            <Server size={14} className="text-[oklch(50%_0_0)]" />
          </div>
          <div>
            <div className="font-mono text-sm text-white">{keeper.pubkey}</div>
            <div className="font-mono text-[10px] text-[oklch(35%_0_0)]">Last seen {lastSeenStr}</div>
          </div>
        </div>
        <div className={`font-mono text-[10px] px-2 py-1 border tracking-widest ${
          keeper.active
            ? 'border-[oklch(72%_0.18_145/40%)] text-[oklch(72%_0.18_145)]'
            : 'border-[oklch(20%_0_0)] text-[oklch(35%_0_0)]'
        }`}>
          {keeper.active ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0 border border-[oklch(12%_0_0)]">
        {[
          { label: 'Stake', value: `${keeper.stake.toLocaleString()} CRONAI`, icon: <Shield size={11} /> },
          { label: 'Tasks Run', value: keeper.tasksExecuted.toLocaleString(), icon: <TrendingUp size={11} /> },
          { label: 'Fees Earned', value: `${keeper.feesEarned.toLocaleString()} CRONAI`, icon: <TrendingUp size={11} /> },
          { label: 'Slashes', value: keeper.slashCount.toString(), icon: <AlertTriangle size={11} />, warn: keeper.slashCount > 0 },
        ].map((item, i) => (
          <div key={i} className={`p-4 ${i % 2 !== 0 ? 'border-l border-[oklch(12%_0_0)]' : ''} ${i >= 2 ? 'border-t border-[oklch(12%_0_0)]' : ''}`}>
            <div className={`flex items-center gap-1.5 font-mono text-[10px] mb-1 ${item.warn ? 'text-[oklch(65%_0.2_25)]' : 'text-[oklch(35%_0_0)]'}`}>
              {item.icon}
              {item.label}
            </div>
            <div className={`font-mono text-sm font-medium ${item.warn && item.value !== '0' ? 'text-[oklch(65%_0.2_25)]' : 'text-white'}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function SetupGuide() {
  return (
    <div className="border border-[oklch(18%_0_0)] bg-[oklch(6%_0_0)]">
      <div className="border-b border-[oklch(18%_0_0)] px-6 py-4">
        <h3 className="font-mono text-sm font-medium text-white">Run Your Own Keeper</h3>
      </div>
      <div className="p-6 space-y-6">
        {[
          {
            step: '01', title: 'Register & Stake',
            code: `cd cron-protocol\nyarn ts-node scripts/register-keeper.ts --amount 1000`,
          },
          {
            step: '02', title: 'Configure',
            code: `cat > keeper/.env << EOF\nSOLANA_RPC_URL=https://api.devnet.solana.com\nKEEPER_KEYPAIR_PATH=~/.config/solana/id.json\nSCHEDULER_PROGRAM_ID=73gdh...n4Y\nSTAKING_PROGRAM_ID=Dn3RD...68g\nPOLL_INTERVAL_MS=400\nEOF`,
          },
          {
            step: '03', title: 'Run',
            code: `cd keeper\nRUST_LOG=keeper=info cargo run --release`,
          },
        ].map(({ step, title, code }) => (
          <div key={step}>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[oklch(25%_0_0)] text-2xl font-medium">{step}</span>
              <span className="font-mono text-sm text-white">{title}</span>
            </div>
            <pre className="font-mono text-xs text-[oklch(50%_0_0)] bg-[oklch(4%_0_0)] border border-[oklch(12%_0_0)] p-4 overflow-x-auto leading-relaxed">
              {code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function KeeperPage() {
  const [tab, setTab] = useState<'registry' | 'setup'>('registry')

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono text-xl font-medium text-white mb-1">Keeper Network</h1>
          <p className="font-mono text-xs text-[oklch(40%_0_0)]">
            {MOCK_KEEPERS.filter(k => k.active).length} online · {MOCK_KEEPERS.length} registered
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 mb-6 border border-[oklch(18%_0_0)] w-fit">
        {(['registry', 'setup'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-mono text-xs px-6 py-2 tracking-widest uppercase transition-colors border-r border-[oklch(18%_0_0)] last:border-r-0 ${
              tab === t ? 'bg-white text-black' : 'text-[oklch(40%_0_0)] hover:text-white hover:bg-[oklch(10%_0_0)]'
            }`}
          >
            {t === 'registry' ? 'Registry' : 'Setup Guide'}
          </button>
        ))}
      </div>

      {tab === 'registry' ? (
        <div className="border border-[oklch(18%_0_0)] grid md:grid-cols-2">
          {MOCK_KEEPERS.map((k, i) => (
            <div
              key={k.pubkey}
              className={[
                i % 2 !== 0 ? 'border-l border-[oklch(18%_0_0)]' : '',
                i >= 2 ? 'border-t border-[oklch(18%_0_0)]' : '',
              ].join(' ')}
            >
              <KeeperCard keeper={k} delay={i * 0.07} />
            </div>
          ))}
        </div>
      ) : (
        <SetupGuide />
      )}
    </div>
  )
}
