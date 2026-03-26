import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

type Status = 'Pending' | 'Executed' | 'Failed' | 'Cancelled'

interface Task {
  id: string
  creator: string
  targetSlot: number
  currentSlot: number
  fee: number
  status: Status
  cpiProgram: string
}

const MOCK_TASKS: Task[] = [
  { id: 'Av3x...7j2', creator: 'Bk9m...3f4', targetSlot: 302_857_112, currentSlot: 302_847_112, fee: 100, status: 'Pending', cpiProgram: 'GEtq...JYUG' },
  { id: 'Cx1p...9g5', creator: 'Dy7q...2h6', targetSlot: 302_845_001, currentSlot: 302_847_112, fee: 50, status: 'Executed', cpiProgram: 'GEtq...JYUG' },
  { id: 'Ek8r...5i7', creator: 'Fj2s...6j8', targetSlot: 302_847_000, currentSlot: 302_847_112, fee: 75, status: 'Executed', cpiProgram: 'GEtq...JYUG' },
  { id: 'Gl5t...7k9', creator: 'Hn3u...8l0', targetSlot: 302_900_000, currentSlot: 302_847_112, fee: 100, status: 'Pending', cpiProgram: 'GEtq...JYUG' },
  { id: 'Io6v...9m1', creator: 'Jp4w...0n2', targetSlot: 302_840_000, currentSlot: 302_847_112, fee: 50, status: 'Failed', cpiProgram: '73gd...n4Y' },
  { id: 'Kq7x...1o3', creator: 'Lr5y...2p4', targetSlot: 302_800_000, currentSlot: 302_847_112, fee: 200, status: 'Executed', cpiProgram: 'GEtq...JYUG' },
  { id: 'Ms8z...3q5', creator: 'Nt6a...4r6', targetSlot: 302_960_000, currentSlot: 302_847_112, fee: 100, status: 'Pending', cpiProgram: 'GEtq...JYUG' },
  { id: 'Ou9b...5s7', creator: 'Pv7c...6t8', targetSlot: 302_830_000, currentSlot: 302_847_112, fee: 50, status: 'Cancelled', cpiProgram: '73gd...n4Y' },
]

const STATUS_ICONS: Record<Status, React.ReactNode> = {
  Pending: <Clock size={12} className="text-[oklch(80%_0.18_80)]" />,
  Executed: <CheckCircle size={12} className="text-[oklch(72%_0.18_145)]" />,
  Failed: <XCircle size={12} className="text-[oklch(65%_0.2_25)]" />,
  Cancelled: <XCircle size={12} className="text-[oklch(40%_0_0)]" />,
}

const STATUS_COLORS: Record<Status, string> = {
  Pending: 'text-[oklch(80%_0.18_80)] border-[oklch(80%_0.18_80/30%)]',
  Executed: 'text-[oklch(72%_0.18_145)] border-[oklch(72%_0.18_145/30%)]',
  Failed: 'text-[oklch(65%_0.2_25)] border-[oklch(65%_0.2_25/30%)]',
  Cancelled: 'text-[oklch(40%_0_0)] border-[oklch(40%_0_0/30%)]',
}

const FILTERS: (Status | 'All')[] = ['All', 'Pending', 'Executed', 'Failed', 'Cancelled']

export default function TasksPage() {
  const [filter, setFilter] = useState<Status | 'All'>('All')

  const filtered = filter === 'All' ? MOCK_TASKS : MOCK_TASKS.filter(t => t.status === filter)

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono text-xl font-medium text-white mb-1">Tasks</h1>
          <p className="font-mono text-xs text-[oklch(40%_0_0)]">{MOCK_TASKS.length} total · {MOCK_TASKS.filter(t => t.status === 'Pending').length} pending</p>
        </div>
        <a
          href="/app/schedule"
          className="font-mono text-xs border border-white text-white px-4 py-2 hover:bg-white hover:text-black transition-colors tracking-widest uppercase"
        >
          + New Task
        </a>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-0 mb-6 border border-[oklch(18%_0_0)] w-fit">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'font-mono text-xs px-4 py-2 tracking-widest uppercase transition-colors border-r border-[oklch(18%_0_0)] last:border-r-0',
              filter === f ? 'bg-white text-black' : 'text-[oklch(40%_0_0)] hover:text-white hover:bg-[oklch(10%_0_0)]'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-[oklch(18%_0_0)]">
        <div className="grid grid-cols-[1fr_1fr_120px_80px_100px_80px] border-b border-[oklch(18%_0_0)] bg-[oklch(6%_0_0)] px-4 py-2">
          {['Task ID', 'Creator', 'Target Slot', 'Fee', 'Status', 'Slots Left'].map(h => (
            <div key={h} className="font-mono text-[10px] text-[oklch(30%_0_0)] tracking-widest uppercase">{h}</div>
          ))}
        </div>

        {filtered.map((task, i) => {
          const slotsLeft = task.targetSlot - task.currentSlot
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[1fr_1fr_120px_80px_100px_80px] px-4 py-3 border-b border-[oklch(10%_0_0)] items-center hover:bg-[oklch(7%_0_0)] transition-colors cursor-pointer"
            >
              <div className="font-mono text-xs text-white">{task.id}</div>
              <div className="font-mono text-xs text-[oklch(50%_0_0)]">{task.creator}</div>
              <div className="font-mono text-xs text-[oklch(60%_0_0)]">{task.targetSlot.toLocaleString()}</div>
              <div className="font-mono text-xs text-[oklch(60%_0_0)]">{task.fee}</div>
              <div className={cn('flex items-center gap-1.5 font-mono text-[10px] border px-2 py-0.5 w-fit tracking-wider', STATUS_COLORS[task.status])}>
                {STATUS_ICONS[task.status]}
                {task.status}
              </div>
              <div className={cn('font-mono text-xs', slotsLeft > 0 ? 'text-[oklch(55%_0_0)]' : 'text-[oklch(35%_0_0)]')}>
                {slotsLeft > 0 ? `+${slotsLeft.toLocaleString()}` : '—'}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
