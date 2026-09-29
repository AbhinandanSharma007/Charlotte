import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bot,
  LayoutDashboard,
  Map,
  ShieldAlert,
} from 'lucide-react'
import clsx from 'clsx'
import ThemeSelector from '@/components/ThemeSelector'
import { api } from '@/lib/api'
import type { LiveGridStatusResponse } from '@/types'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/live-grid', label: 'Live Grid', icon: Map },
  { to: '/predictions', label: 'Predictions', icon: ShieldAlert },
  { to: '/transformers', label: 'Transformers', icon: Activity },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [gridStatus, setGridStatus] = useState<LiveGridStatusResponse | null>(null)

  useEffect(() => {
    api.getLiveGridStatus().then(setGridStatus).catch(() => {})
    const interval = setInterval(() => {
      api.getLiveGridStatus().then(setGridStatus).catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-grid-border bg-grid-panel">
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-grid-border px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black">
            <img src="/frontendpublicspider-logo.png.png" alt="Charlotte spider mark" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-theme-text">CHARLOTTE</h1>
            <p className="text-xs text-theme-muted">Smart Grid Intelligence</p>
          </div>
        </div>

        {/* Live Grid Status Pill - Green Positive Indicator */}
        <div className="mx-3 mt-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">
              {gridStatus
                ? `${gridStatus.clean_meters_count} Safe · ${gridStatus.flagged_meters_count} Flagged`
                : 'Live Grid Active'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-theme-muted">
            {gridStatus ? `Transformer ${gridStatus.transformer_name} • ${gridStatus.transformer_health_score}% Health` : 'Feeder line balanced'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx('nav-link', isActive && 'nav-link-active')
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Theme Selector & Footer */}
        <div className="border-t border-grid-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-theme-muted font-medium">Theme Mode</span>
            <ThemeSelector />
          </div>
          <div className="pt-1">
            <p className="text-[11px] text-theme-muted">Predict • Prevent • Explain</p>
            <p className="font-mono text-[10px] text-theme-muted">v0.1.0 — Smart Grid</p>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
