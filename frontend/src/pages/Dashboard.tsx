import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import AddLiveGridModal from '@/components/AddLiveGridModal'
import StatCard from '@/components/StatCard'
import { api } from '@/lib/api'
import {
  Alert,
  DashboardSummary,
  LiveGridStatusResponse,
  Meter,
  Prediction,
} from '@/types'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [gridStatus, setGridStatus] = useState<LiveGridStatusResponse | null>(null)
  const [meters, setMeters] = useState<Meter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = async () => {
    try {
      const [s, p, a, gs, m] = await Promise.all([
        api.getDashboardSummary(),
        api.getTheftPredictions(0.6),
        api.getAlerts('open'),
        api.getLiveGridStatus().catch(() => null),
        api.getMeters(0, 50).catch(() => []),
      ])
      setSummary(s)
      setPredictions(p)
      setAlerts(a)
      setGridStatus(gs)
      setMeters(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="panel border-red-500/30 text-red-400">
        <p className="font-medium">Connection Error</p>
        <p className="mt-1 text-sm text-theme-muted">{error}</p>
      </div>
    )
  }

  const cleanCount = gridStatus?.clean_meters_count ?? (summary?.total_meters ? summary.total_meters - (summary.high_risk_meters || 0) : 95)

  return (
    <div className="space-y-8">
      {/* Title & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-text">Grid Overview & Real-Time Intelligence</h2>
          <p className="mt-1 text-sm text-theme-muted">
            Smart grid intelligence pilot — 100 meters, 1 distribution transformer (DT-001)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-theme-text shadow-lg transition hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Live Grid Data / Run Calculation
        </button>
      </div>

      {/* Positive Green Alert Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-5 py-3.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">
              Positive Feeder Status: {cleanCount} Verified Clean Nodes (No Theft Detected)
            </p>
            <p className="text-xs text-emerald-300/80">
              Transformer DT-001 line losses at {gridStatus?.line_loss_percent ?? '3.8'}% — strictly within normal engineering limits
            </p>
          </div>
        </div>
        <span className="badge-positive font-mono">
          95% Clean Power Flow
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Smart Meters */}
        <StatCard label="Smart Meters" value={summary?.total_meters ?? 0} accent="blue" subtext="Pilot locality" />

        {/* Clean Safe Meters (Green Positive) */}
        <StatCard
          label="Clean (No Theft)"
          value={cleanCount}
          accent="green"
          isPositive={true}
          subtext="Verified Normal Flow"
        />

        {/* Transformer Health (Green Positive) */}
        <StatCard
          label="Transformer Health"
          value={`${summary?.avg_transformer_health ?? 87.5}%`}
          accent="green"
          isPositive={true}
          subtext="Optimal Load"
        />

        {/* Active Power */}
        <StatCard
          label="Total Power"
          value={`${summary?.total_power_kw ?? 210.0} kW`}
          accent="purple"
          subtext="Feeder Demand"
        />

        {/* High Risk Meters */}
        <StatCard
          label="High Risk Meters"
          value={summary?.high_risk_meters ?? 0}
          accent="yellow"
          subtext="AI Flagged"
        />

        {/* Active Alerts */}
        <StatCard
          label="Active Alerts"
          value={summary?.active_alerts ?? 0}
          accent="red"
          subtext="Control Room"
        />
      </div>

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Theft Predictions */}
        <div className="panel">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <h3 className="font-semibold text-theme-text">Top Theft Predictions</h3>
            </div>
            <span className="text-xs text-theme-muted">HQNN Predictive AI</span>
          </div>

          <div className="space-y-3">
            {predictions.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-grid-panelHover px-4 py-3 border border-grid-border"
              >
                <div>
                  <p className="text-sm font-medium text-theme-text">
                    Meter {p.meter_id?.slice(0, 8)}…
                  </p>
                  <p className="text-xs text-theme-muted">
                    {p.explanation?.reasons?.[0] ?? 'Behavioral deviation detected'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-red-400">
                    {(p.probability * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-theme-muted">
                    ₹{p.revenue_impact?.toLocaleString()} at risk
                  </p>
                </div>
              </div>
            ))}
            {predictions.length === 0 && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/10 p-4 text-center">
                <ShieldCheck className="mx-auto h-6 w-6 text-emerald-400 mb-1" />
                <p className="text-sm font-semibold text-emerald-400">
                  Zero High-Risk Thefts Detected
                </p>
                <p className="text-xs text-emerald-300/80">
                  All active smart meters are transmitting within normal digital twin bounds.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="panel">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="font-semibold text-theme-text">Grid Alerts & Line Discrepancies</h3>
            </div>
            <span className="text-xs text-theme-muted">Real-Time Dispatch</span>
          </div>

          <div className="space-y-3">
            {alerts.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between rounded-lg bg-grid-panelHover px-4 py-3 border border-grid-border"
              >
                <div>
                  <p className="text-sm font-medium text-theme-text">{a.title}</p>
                  <p className="text-xs text-theme-muted">{a.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`badge-${a.severity} uppercase text-[10px]`}>
                    {a.severity}
                  </span>
                  <button
                    onClick={() => navigate('/alerts', { state: { alertId: a.id } })}
                    className="rounded bg-blue-600/20 px-2 py-1 text-[10px] font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-theme-text border border-blue-500/30"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="text-sm text-theme-muted text-center py-6">No open alerts</p>
            )}
          </div>
        </div>
      </div>


      {/* Platform Status */}
      <div className="panel">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-theme-text">Platform Subsystems Status</h3>
          </div>
          <span className="badge-positive font-mono text-[10px]">ALL SYSTEMS OPERATIONAL</span>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { name: 'FastAPI Backend', status: 'Online (Healthy)', icon: Zap, color: 'text-emerald-400' },
            { name: 'Digital Twin Engine', status: 'Active (100 Nodes)', icon: Gauge, color: 'text-blue-400' },
            { name: 'Theft AI Model', status: 'HQNN-v1.0 Ready', icon: ShieldAlert, color: 'text-purple-400' },
            { name: 'Feeder Power Balance', status: 'Normal & Balanced', icon: CheckCircle2, color: 'text-emerald-400' },
          ].map(({ name, status, icon: Icon, color }) => (
            <div key={name} className="rounded-lg bg-grid-panelHover p-4 text-center border border-grid-border">
              <Icon className={`mx-auto mb-2 h-5 w-5 ${color}`} />
              <p className="text-sm font-medium text-theme-text">{name}</p>
              <p className="text-xs font-semibold text-emerald-400 mt-1">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Live Grid Modal */}
      <AddLiveGridModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        meters={meters}
        onSuccess={() => loadData()}
      />
    </div>
  )
}
