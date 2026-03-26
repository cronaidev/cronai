import { NavLink } from 'react-router-dom'
import { Activity, List, Users, Server, Calendar, ChevronLeft } from 'lucide-react'
import { cn } from '../lib/utils'

const links = [
  { to: '/app', label: 'Live Feed', icon: Activity, end: true },
  { to: '/app/tasks', label: 'Tasks', icon: List },
  { to: '/app/agents', label: 'Agents', icon: Users },
  { to: '/app/keeper', label: 'Keeper', icon: Server },
  { to: '/app/schedule', label: 'Schedule', icon: Calendar },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-[oklch(18%_0_0)] bg-[oklch(4%_0_0)] flex flex-col">
      {/* Logo */}
      <div className="h-14 border-b border-[oklch(18%_0_0)] px-4 flex items-center gap-2">
        <div className="w-5 h-5 border border-white flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white" />
        </div>
        <span className="font-mono text-xs font-medium tracking-widest uppercase text-white">
          CronAI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 font-mono text-xs tracking-wider uppercase transition-colors',
                isActive
                  ? 'bg-white text-black'
                  : 'text-[oklch(55%_0_0)] hover:text-white hover:bg-[oklch(12%_0_0)]'
              )
            }
          >
            <Icon size={13} strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Back to landing */}
      <div className="p-3 border-t border-[oklch(18%_0_0)]">
        <NavLink
          to="/"
          className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-[oklch(40%_0_0)] hover:text-white tracking-wider uppercase transition-colors"
        >
          <ChevronLeft size={12} />
          Home
        </NavLink>
      </div>
    </aside>
  )
}
