import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Zap, CheckCircle, DollarSign, UserPlus } from 'lucide-react'
import { useSlot } from '../hooks/useSlot'

type EventType = 'TaskRegistered' | 'TaskExecuted' | 'JobCreated' | 'PaymentReleased' | 'KeeperRegistered'

interface FeedEvent {
  id: number
  type: EventType
  slot: number
  account: string
  detail: string
  ts: number
}

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  TaskRegistered: <Zap size={12} />,
  TaskExecuted: <CheckCircle size={12} />,
  JobCreated: <Activity size={12} />,
  PaymentReleased: <DollarSign size={12} />,
  KeeperRegistered: <UserPlus size={12} />,
}

const EVENT_COLORS: Record<EventType, string> = {
  TaskRegistered: 'text-white',
  TaskExecuted: 'text-[oklch(72%_0.18_145)]',
  JobCreated: 'text-[oklch(70%_0.15_250)]',
  PaymentReleased: 'text-[oklch(80%_0.18_80)]',
  KeeperRegistered: 'text-[oklch(65%_0.12_300)]',
}

const SAMPLE_EVENTS: Omit<FeedEvent, 'id' | 'ts'>[] = [
  { type: 'TaskRegistered', slot: 302_847_112, account: 'Av3x...7j2', detail: 'targetSlot=302857112 fee=100 CRONAI' },
  { type: 'JobCreated', slot: 302_847_098, account: 'Bk9m...3f4', detail: 'budget=0.1 SOL agent=GEtq...JYUG' },
  { type: 'TaskExecuted', slot: 302_843_001, account: 'Cx1p...9g5', detail: 'keeper=Dy7q...2h6 latency=312ms' },
  { type: 'PaymentReleased', slot: 302_843_002, account: 'Bk9m...3f4', detail: 'amount=0.1 SOL agent=GEtq...JYUG' },
  { type: 'KeeperRegistered', slot: 302_801_445, account: 'Ek8r...5i7', detail: 'stake=1000 CRONAI' },
  { type: 'TaskRegistered', slot: 302_799_002, account: 'Fj2s...6j8', detail: 'targetSlot=302809002 fee=50 CRONAI' },
  { type: 'TaskExecuted', slot: 302_790_118, account: 'Gl5t...7k9', detail: 'keeper=Ek8r...5i7 latency=408ms' },
  { type: 'PaymentReleased', slot: 302_790_119, account: 'Fj2s...6j8', detail: 'amount=0.05 SOL' },
]

let idCounter = SAMPLE_EVENTS.length

function randomEvent(): FeedEvent {
  const types: EventType[] = ['TaskRegistered', 'TaskExecuted', 'JobCreated', 'PaymentReleased']
  const type = types[Math.floor(Math.random() * types.length)]
  return {
    id: ++idCounter,
    type,
    slot: 302_847_112 + idCounter * 3,
    account: `${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 5)}`,
    detail: type === 'TaskExecuted' ? `latency=${Math.floor(300 + Math.random() * 200)}ms` : `fee=${Math.floor(50 + Math.random() * 100)} CRONAI`,
    ts: Date.now(),
  }
}


export default function FeedPage() {
  const slot = useSlot()
  const [events, setEvents] = useState<FeedEvent[]>(
    SAMPLE_EVENTS.map((e, i) => ({ ...e, id: i, ts: Date.now() - i * 8000 }))
  )
  const [live, setLive] = useState(true)

  useEffect(() => {
    if (!live) return
    const t = setInterval(() => {
      setEvents(prev => [randomEvent(), ...prev.slice(0, 49)])
    }, 4000)
    return () => clearInterval(t)
  }, [live])

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono text-xl font-medium text-white mb-1">Live Feed</h1>
          <p className="font-mono text-xs text-[oklch(40%_0_0)]">Real-time on-chain events</p>
        </div>
        <button
          onClick={() => setLive(l => !l)}
          className={`font-mono text-xs px-4 py-2 border tracking-widest uppercase transition-colors ${
            live
              ? 'border-[oklch(72%_0.18_145)] text-[oklch(72%_0.18_145)] hover:bg-[oklch(72%_0.18_145/10%)]'
              : 'border-[oklch(25%_0_0)] text-[oklch(40%_0_0)] hover:border-[oklch(40%_0_0)]'
          }`}
        >
          {live ? '● LIVE' : '○ PAUSED'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mb-8">
        {[
          { label: 'Current Slot', value: slot.toLocaleString() },
          { label: 'Total Tasks', value: '0' },
          { label: 'Active Keepers', value: '3' },
          { label: 'Avg Latency', value: '400ms' },
        ].map((s, i) => (
          <div
            key={i}
            className={`border border-[oklch(18%_0_0)] p-5 bg-[oklch(6%_0_0)] ${i > 0 ? 'border-l-0' : ''}`}
          >
            <div className="font-mono text-xl font-medium text-white mb-1">{s.value}</div>
            <div className="font-mono text-[10px] text-[oklch(35%_0_0)] tracking-widest uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Event list */}
      <div className="border border-[oklch(18%_0_0)]">
        {/* Table header */}
        <div className="grid grid-cols-[80px_1fr_100px_1fr] border-b border-[oklch(18%_0_0)] bg-[oklch(6%_0_0)] px-4 py-2">
          {['Type', 'Account', 'Slot', 'Detail'].map(h => (
            <div key={h} className="font-mono text-[10px] text-[oklch(30%_0_0)] tracking-widest uppercase">{h}</div>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {events.slice(0, 20).map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -8, backgroundColor: 'oklch(12% 0 0)' }}
              animate={{ opacity: 1, y: 0, backgroundColor: 'oklch(4% 0 0)' }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-[80px_1fr_100px_1fr] px-4 py-3 border-b border-[oklch(10%_0_0)] items-center hover:bg-[oklch(7%_0_0)] transition-colors"
            >
              <div className={`flex items-center gap-1.5 font-mono text-[10px] tracking-wider ${EVENT_COLORS[event.type]}`}>
                {EVENT_ICONS[event.type]}
                <span className="hidden sm:block">{event.type.replace(/([A-Z])/g, ' $1').trim().split(' ')[0]}</span>
              </div>
              <div className="font-mono text-xs text-[oklch(60%_0_0)] truncate pr-4">{event.account}</div>
              <div className="font-mono text-xs text-[oklch(35%_0_0)]">{event.slot.toLocaleString()}</div>
              <div className="font-mono text-xs text-[oklch(45%_0_0)] truncate">{event.detail}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
