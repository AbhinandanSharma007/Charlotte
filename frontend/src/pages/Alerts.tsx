import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { Alert } from '@/types'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, Filter, XCircle, X, ExternalLink } from 'lucide-react'

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export default function Alerts() {
  const location = useLocation()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'acknowledged' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [acknowledging, setAcknowledging] = useState(false)

  useEffect(() => {
    api.getAlerts().then((data) => {
      const sorted = [...data].sort(
        (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
      )
      setAlerts(sorted)
      if (location.state?.alertId) {
        const found = sorted.find(a => a.id === location.state.alertId)
        if (found) setSelectedAlert(found)
      }
    }).finally(() => setLoading(false))
  }, [location.state?.alertId])

  const handleAcknowledge = async (alert: Alert) => {
    setAcknowledging(true)
    try {
      await api.acknowledgeAlert(alert.id)
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'acknowledged' } : a))
      setSelectedAlert(prev => prev?.id === alert.id ? { ...prev, status: 'acknowledged' } : prev)
    } catch {
      // Graceful fail – update UI optimistically if no dedicated API yet
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'acknowledged' } : a))
      if (selectedAlert?.id === alert.id) setSelectedAlert({ ...selectedAlert, status: 'acknowledged' })
    } finally {
      setAcknowledging(false)
    }
  }

  const filtered = alerts.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    return true
  })

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    open: alerts.filter(a => a.status === 'open').length,
  }

  const severityIcon = (s: string) => {
    if (s === 'critical') return <XCircle className="h-4 w-4 text-red-400" />
    if (s === 'high') return <AlertTriangle className="h-4 w-4 text-amber-400" />
    if (s === 'medium') return <Clock className="h-4 w-4 text-sky-400" />
    return <CheckCircle2 className="h-4 w-4 text-theme-muted" />
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-theme-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-text flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            Grid Alerts
          </h2>
          <p className="mt-1 text-sm text-theme-muted">
            Real-time alerts from predictive AI and grid monitoring
          </p>
        </div>
        {/* Summary pills */}
        <div className="flex gap-3">
          <div className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-center">
            <p className="text-xs text-theme-muted">Critical</p>
            <p className="font-mono text-lg font-bold text-red-400">{counts.critical}</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-center">
            <p className="text-xs text-theme-muted">High</p>
            <p className="font-mono text-lg font-bold text-amber-400">{counts.high}</p>
          </div>
          <div className="rounded-lg border border-grid-border bg-grid-panelHover px-3 py-2 text-center">
            <p className="text-xs text-theme-muted">Open</p>
            <p className="font-mono text-lg font-bold text-theme-text">{counts.open}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="panel flex flex-wrap items-center gap-4">
        <Filter className="h-4 w-4 text-theme-muted shrink-0" />
        <div className="flex gap-1">
          {(['all', 'open', 'acknowledged', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === f
                  ? 'bg-theme-primary text-white'
                  : 'text-theme-muted hover:bg-grid-panelHover hover:text-theme-text'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-grid-border" />
        <div className="flex gap-1">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                severityFilter === s
                  ? 'bg-grid-panelHover border border-theme-primary text-theme-text'
                  : 'text-theme-muted hover:bg-grid-panelHover hover:text-theme-text'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-theme-muted">{filtered.length} alerts</span>
      </div>

      {/* Alerts List + Detail Panel */}
      <div className={`grid gap-6 ${selectedAlert ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="panel text-center py-12">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="font-semibold text-emerald-400">No alerts match your filter</p>
              <p className="text-sm text-theme-muted mt-1">The grid is operating within normal parameters.</p>
            </div>
          )}
          {filtered.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelectedAlert(a)}
              className={`panel cursor-pointer flex items-start justify-between gap-4 transition hover:border-theme-primary/50 ${
                selectedAlert?.id === a.id ? 'border-theme-primary/60 shadow-[0_0_12px_var(--accent-primary,rgba(59,130,246,0.2))]' : ''
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0">{severityIcon(a.severity)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge-${a.severity}`}>{a.severity}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      a.status === 'open' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                      a.status === 'acknowledged' ? 'text-sky-400 bg-sky-500/10 border border-sky-500/20' :
                      'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    }`}>{a.status}</span>
                  </div>
                  <h3 className="mt-1.5 font-semibold text-theme-text truncate">{a.title}</h3>
                  <p className="mt-0.5 text-xs text-theme-muted line-clamp-2">{a.description}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-theme-muted">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedAlert(a) }}
                className="shrink-0 flex items-center gap-1 rounded-lg bg-theme-primary/10 border border-theme-primary/30 px-3 py-1.5 text-xs font-semibold text-theme-primary transition hover:bg-theme-primary hover:text-white"
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </button>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedAlert && (
          <div className="panel border-theme-primary/30 space-y-4 sticky top-6 self-start">
            {/* Title row */}
            <div className="flex items-start justify-between border-b border-grid-border pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge-${selectedAlert.severity}`}>{selectedAlert.severity}</span>
                  <span className="text-xs text-theme-muted">{selectedAlert.status}</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-theme-text">{selectedAlert.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="shrink-0 rounded-lg p-1.5 text-theme-muted transition hover:bg-grid-panelHover hover:text-theme-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-theme-muted leading-relaxed">{selectedAlert.description}</p>

            {/* Metadata Grid */}
            <div className="rounded-lg bg-grid-dark p-4 border border-grid-border space-y-3">
              <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Alert Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {[
                  ['Alert ID', selectedAlert.id.slice(0, 16) + '…'],
                  ['Meter ID', selectedAlert.meter_id ? selectedAlert.meter_id.toString().slice(0, 16) + '…' : 'N/A'],
                  ['Transformer', selectedAlert.transformer_id ? selectedAlert.transformer_id.toString().slice(0, 16) + '…' : 'N/A'],
                  ['Created', new Date(selectedAlert.created_at).toLocaleString()],
                  ...(selectedAlert.alert_metadata
                    ? Object.entries(selectedAlert.alert_metadata).map(([k, v]) => [
                        k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        String(v),
                      ])
                    : []),
                ].map(([label, value]) => (
                  <>
                    <div className="text-theme-muted font-medium">{label}</div>
                    <div className="font-mono text-theme-text truncate" title={value}>{value}</div>
                  </>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-grid-border">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 rounded-lg border border-grid-border px-4 py-2 text-xs font-medium text-theme-muted transition hover:bg-grid-panelHover hover:text-theme-text"
              >
                Close
              </button>
              {selectedAlert.status === 'open' && (
                <button
                  onClick={() => handleAcknowledge(selectedAlert)}
                  disabled={acknowledging}
                  className="flex-1 rounded-lg bg-theme-primary px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
                >
                  {acknowledging ? 'Acknowledging…' : 'Acknowledge Alert'}
                </button>
              )}
              {selectedAlert.status !== 'open' && (
                <div className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-4 py-2 text-center text-xs font-medium text-emerald-400">
                  ✓ {selectedAlert.status}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
