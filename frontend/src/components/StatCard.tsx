import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  accent?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  isPositive?: boolean
}

const accentColors = {
  blue: 'text-blue-400',
  green: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]',
  red: 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]',
  yellow: 'text-amber-400',
  purple: 'text-indigo-400',
}

export default function StatCard({
  label,
  value,
  subtext,
  accent = 'blue',
  isPositive = false,
}: StatCardProps) {
  return (
    <div
      className={clsx(
        'stat-card transition-all duration-200',
        isPositive && 'border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500/60',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-theme-muted">
          {label}
        </span>
        {isPositive && (
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
        )}
      </div>
      <span className={clsx('text-3xl font-bold mt-1', accentColors[accent])}>{value}</span>
      {subtext && <span className="text-xs text-theme-muted mt-0.5">{subtext}</span>}
    </div>
  )
}
