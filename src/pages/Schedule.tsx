import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '../lib/utils'

const AGENTS = [
  { pubkey: 'GEtq...JYUG', name: 'DeFi Rebalancer' },
  { pubkey: 'Av3x...7j2', name: 'Price Alert Bot' },
  { pubkey: 'Fj2s...6j8', name: 'Yield Optimizer' },
  { pubkey: 'Hn3u...8l0', name: 'Governance Voter' },
]

type Step = 'form' | 'review' | 'done'

export default function SchedulePage() {
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({
    agent: '',
    targetSlot: '',
    budget: '0.1',
    cronFee: '100',
    description: '',
    recurring: false,
    intervalSlots: '216000',
    totalRuns: '30',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const inputClass = "w-full font-mono text-xs bg-[oklch(6%_0_0)] border border-[oklch(18%_0_0)] text-white px-4 py-3 focus:outline-none focus:border-[oklch(45%_0_0)] transition-colors placeholder:text-[oklch(25%_0_0)]"

  if (step === 'done') {
    return (
      <div className="p-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[oklch(18%_0_0)] p-12 text-center bg-[oklch(6%_0_0)]"
        >
          <CheckCircle size={40} className="text-[oklch(72%_0.18_145)] mx-auto mb-6" />
          <h2 className="font-mono text-xl font-medium text-white mb-3">Task Scheduled</h2>
          <p className="font-mono text-xs text-[oklch(50%_0_0)] mb-2">
            Your task has been registered on-chain. A keeper will execute it at the target slot.
          </p>
          <p className="font-mono text-xs text-[oklch(30%_0_0)] mb-8">
            Task PDA: Av3x...7j2
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setStep('form')}
              className="font-mono text-xs border border-[oklch(25%_0_0)] text-[oklch(50%_0_0)] px-6 py-2 hover:border-[oklch(40%_0_0)] hover:text-white transition-colors tracking-widest uppercase"
            >
              Schedule Another
            </button>
            <a
              href="/app/tasks"
              className="font-mono text-xs bg-white text-black px-6 py-2 hover:bg-[oklch(85%_0_0)] transition-colors tracking-widest uppercase"
            >
              View Tasks
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className="p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-mono text-xl font-medium text-white mb-1">Review Transaction</h1>
          <p className="font-mono text-xs text-[oklch(40%_0_0)]">Confirm task details before signing</p>
        </div>

        <div className="border border-[oklch(18%_0_0)] mb-6">
          {[
            { label: 'Agent', value: AGENTS.find(a => a.pubkey === form.agent)?.name ?? form.agent },
            { label: 'Target Slot', value: form.targetSlot },
            { label: 'Budget', value: `${form.budget} SOL` },
            { label: 'Cron Fee', value: `${form.cronFee} CRONAI` },
            { label: 'Description', value: form.description || '—' },
            ...(form.recurring ? [
              { label: 'Interval', value: `${form.intervalSlots} slots (~${(Number(form.intervalSlots) / 9000).toFixed(0)}h)` },
              { label: 'Total Runs', value: form.totalRuns },
            ] : []),
          ].map(({ label, value }, i) => (
            <div key={i} className={`flex items-start justify-between px-6 py-4 ${i > 0 ? 'border-t border-[oklch(12%_0_0)]' : ''}`}>
              <span className="font-mono text-xs text-[oklch(40%_0_0)] tracking-wider uppercase w-28 shrink-0">{label}</span>
              <span className="font-mono text-xs text-white text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 p-4 border border-[oklch(80%_0.18_80/20%)] bg-[oklch(80%_0.18_80/5%)] mb-6">
          <AlertCircle size={12} className="text-[oklch(80%_0.18_80)] shrink-0" />
          <p className="font-mono text-xs text-[oklch(70%_0.18_80)]">
            This will sign 1–2 transactions. Budget SOL will be escrowed until the task completes.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setStep('form')}
            className="font-mono text-xs border border-[oklch(18%_0_0)] text-[oklch(45%_0_0)] px-6 py-3 hover:border-[oklch(30%_0_0)] hover:text-white transition-colors tracking-widest uppercase"
          >
            Back
          </button>
          <button
            onClick={() => setStep('done')}
            className="flex-1 font-mono text-sm bg-white text-black py-3 hover:bg-[oklch(85%_0_0)] transition-colors tracking-widest uppercase font-medium"
          >
            Sign & Submit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-mono text-xl font-medium text-white mb-1">Schedule a Task</h1>
        <p className="font-mono text-xs text-[oklch(40%_0_0)]">Register an agent task to execute at a future slot</p>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); setStep('review') }}
        className="space-y-5"
      >
        {/* Agent */}
        <div>
          <label className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest uppercase block mb-2">Agent</label>
          <select
            value={form.agent}
            onChange={set('agent')}
            required
            className={cn(inputClass, 'appearance-none')}
          >
            <option value="">Select an agent...</option>
            {AGENTS.map(a => (
              <option key={a.pubkey} value={a.pubkey}>{a.name} — {a.pubkey}</option>
            ))}
          </select>
        </div>

        {/* Target slot */}
        <div>
          <label className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest uppercase block mb-2">Target Slot</label>
          <input
            type="number"
            placeholder="e.g. 302857112"
            value={form.targetSlot}
            onChange={set('targetSlot')}
            required
            className={inputClass}
          />
          <p className="font-mono text-[10px] text-[oklch(28%_0_0)] mt-1">Current slot ≈ 302,847,112</p>
        </div>

        {/* Budget + fee */}
        <div className="grid grid-cols-2 gap-0">
          <div>
            <label className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest uppercase block mb-2">Budget (SOL)</label>
            <input type="number" step="0.001" value={form.budget} onChange={set('budget')} required className={cn(inputClass, 'border-r-0')} />
          </div>
          <div>
            <label className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest uppercase block mb-2">Cron Fee ($CRONAI)</label>
            <input type="number" value={form.cronFee} onChange={set('cronFee')} required className={inputClass} />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest uppercase block mb-2">Description (optional)</label>
          <textarea
            placeholder="Rebalance my DeFi portfolio..."
            value={form.description}
            onChange={set('description')}
            rows={3}
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        {/* Recurring toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="recurring"
            checked={form.recurring}
            onChange={set('recurring')}
            className="w-4 h-4 accent-white"
          />
          <label htmlFor="recurring" className="font-mono text-xs text-[oklch(55%_0_0)] cursor-pointer">
            Recurring task
          </label>
        </div>

        {form.recurring && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-2 gap-0 overflow-hidden"
          >
            <div>
              <label className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest uppercase block mb-2">Interval (slots)</label>
              <input type="number" value={form.intervalSlots} onChange={set('intervalSlots')} className={cn(inputClass, 'border-r-0')} />
              <p className="font-mono text-[10px] text-[oklch(28%_0_0)] mt-1">216000 ≈ 24h</p>
            </div>
            <div>
              <label className="font-mono text-[10px] text-[oklch(40%_0_0)] tracking-widest uppercase block mb-2">Total Runs</label>
              <input type="number" value={form.totalRuns} onChange={set('totalRuns')} className={inputClass} />
            </div>
          </motion.div>
        )}

        <button
          type="submit"
          className="w-full font-mono text-sm bg-white text-black py-4 hover:bg-[oklch(85%_0_0)] transition-colors tracking-widest uppercase font-medium mt-2"
        >
          Review Transaction →
        </button>
      </form>
    </div>
  )
}
