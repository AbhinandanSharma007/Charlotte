import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/api'
import type {
  LiveGridCalculationRequest,
  LiveGridCalculationResponse,
  Meter,
} from '@/types'

interface AddLiveGridModalProps {
  isOpen: boolean
  onClose: () => void
  meters: Meter[]
  onSuccess?: (result: LiveGridCalculationResponse) => void
}

export default function AddLiveGridModal({
  isOpen,
  onClose,
  meters,
  onSuccess,
}: AddLiveGridModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets')
  const [selectedMeterId, setSelectedMeterId] = useState<string>(
    meters[0]?.id ?? '',
  )
  const [scenario, setScenario] = useState<'normal' | 'meter_bypass' | 'direct_hooking'>(
    'normal',
  )

  // Custom inputs
  const [voltage, setVoltage] = useState<number>(230.0)
  const [current, setCurrent] = useState<number>(5.2)
  const [powerKw, setPowerKw] = useState<number>(1.18)
  const [energyKwh, setEnergyKwh] = useState<number>(18.5)

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LiveGridCalculationResponse | null>(null)

  if (!isOpen) return null

  const selectedMeter = meters.find((m) => m.id === selectedMeterId) ?? meters[0]

  const handleRunCalculation = async (overrideScenario?: 'normal' | 'meter_bypass' | 'direct_hooking') => {
    setLoading(true)
    setError(null)
    setResult(null)

    const activeScenario = overrideScenario ?? (activeTab === 'presets' ? scenario : 'normal')

    const payload: LiveGridCalculationRequest = {
      meter_id: selectedMeter?.id,
      meter_number: selectedMeter?.meter_number,
      scenario: activeScenario,
      voltage: Number(voltage),
      current: Number(current),
      power_kw: Number(powerKw),
      energy_kwh: Number(energyKwh),
    }

    // Auto-adjust values if using preset
    if (activeScenario === 'meter_bypass') {
      payload.power_kw = 0.22
      payload.current = 1.1
    } else if (activeScenario === 'direct_hooking') {
      payload.power_kw = 1.05
    } else if (activeScenario === 'normal') {
      payload.power_kw = 1.85
      payload.current = 8.2
    }

    try {
      const res = await api.calculateLiveGridTheft(payload)
      setResult(res)
      if (onSuccess) {
        onSuccess(res)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate real-time grid data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-grid-border bg-grid-panel shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-grid-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-theme-text">Add Live Grid Data & Calculate Theft</h3>
              <p className="text-xs text-theme-muted">
                Inject real-time telemetry into the AI engine & evaluate feeder power balance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-theme-muted transition hover:bg-grid-panelHover hover:text-theme-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Target Meter Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-theme-muted mb-2">
              Select Target Smart Meter
            </label>
            <select
              value={selectedMeterId}
              onChange={(e) => setSelectedMeterId(e.target.value)}
              className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-sm text-theme-text focus:border-blue-500 focus:outline-none"
            >
              {meters.slice(0, 50).map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-theme-text">
                  {m.meter_number} — {m.consumer_name} ({m.address})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-lg border border-grid-border bg-black/30 p-1">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 rounded-md py-2 text-xs font-semibold transition ${
                activeTab === 'presets'
                  ? 'bg-blue-600 text-theme-text shadow'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              ⚡ Quick Simulation Scenarios
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 rounded-md py-2 text-xs font-semibold transition ${
                activeTab === 'custom'
                  ? 'bg-blue-600 text-theme-text shadow'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              🔧 Custom Telemetry Input
            </button>
          </div>

          {activeTab === 'presets' ? (
            <div className="space-y-3">
              {/* Normal Clean Flow */}
              <div
                onClick={() => setScenario('normal')}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  scenario === 'normal'
                    ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                    : 'border-grid-border bg-white/[0.02] hover:bg-grid-panelHover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <div>
                      <p className="font-semibold text-theme-text">Scenario 1: Normal Balanced Flow</p>
                      <p className="text-xs text-theme-muted">
                        Standard verified consumption matching digital twin baseline. Zero theft expected.
                      </p>
                    </div>
                  </div>
                  <span className="badge-positive">Expected: Clean (Green)</span>
                </div>
              </div>

              {/* Meter Bypass */}
              <div
                onClick={() => setScenario('meter_bypass')}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  scenario === 'meter_bypass'
                    ? 'border-red-500 bg-red-950/30 ring-1 ring-red-500'
                    : 'border-grid-border bg-white/[0.02] hover:bg-grid-panelHover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    <div>
                      <p className="font-semibold text-theme-text">Scenario 2: Meter Bypass Theft</p>
                      <p className="text-xs text-theme-muted">
                        Simulates 76% sudden registration collapse via shunt bridge while feeder draw continues.
                      </p>
                    </div>
                  </div>
                  <span className="badge-critical">Expected: Theft (Red)</span>
                </div>
              </div>

              {/* Direct Hooking */}
              <div
                onClick={() => setScenario('direct_hooking')}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  scenario === 'direct_hooking'
                    ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500'
                    : 'border-grid-border bg-white/[0.02] hover:bg-grid-panelHover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                    <div>
                      <p className="font-semibold text-theme-text">Scenario 3: Direct Line Hooking / Tapping</p>
                      <p className="text-xs text-theme-muted">
                        Unmetered tapping on branch circuit triggering transformer power balance deficit.
                      </p>
                    </div>
                  </div>
                  <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Expected: Branch Alert (Red)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-theme-muted mb-1">Voltage (V)</label>
                <input
                  type="number"
                  step="0.1"
                  value={voltage}
                  onChange={(e) => setVoltage(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-sm text-theme-text"
                />
              </div>
              <div>
                <label className="block text-xs text-theme-muted mb-1">Current (A)</label>
                <input
                  type="number"
                  step="0.1"
                  value={current}
                  onChange={(e) => setCurrent(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-sm text-theme-text"
                />
              </div>
              <div>
                <label className="block text-xs text-theme-muted mb-1">Active Power (kW)</label>
                <input
                  type="number"
                  step="0.01"
                  value={powerKw}
                  onChange={(e) => setPowerKw(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-sm text-theme-text"
                />
              </div>
              <div>
                <label className="block text-xs text-theme-muted mb-1">Accumulated Energy (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={energyKwh}
                  onChange={(e) => setEnergyKwh(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-sm text-theme-text"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Real-time Calculation Result Display */}
          {result && (
            <div
              className={`rounded-xl border p-5 transition-all ${
                result.indicator_color === 'green'
                  ? 'border-emerald-500/50 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'border-red-500/50 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {result.indicator_color === 'green' ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h4
                      className={`text-base font-bold ${
                        result.indicator_color === 'green' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {result.theft_detected
                        ? '🚨 Electricity Theft Detected'
                        : '✅ Zero Theft Detected — Verified Clean'}
                    </h4>
                    <p className="text-xs text-theme-muted">
                      Meter {result.meter_number} · {result.consumer_name} · Power {result.power_kw} kW
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xl font-mono font-bold ${
                      result.indicator_color === 'green' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {(result.theft_probability * 100).toFixed(1)}%
                  </span>
                  <p className="text-[10px] text-theme-muted uppercase tracking-wider">
                    {result.theft_detected ? 'Theft Probability' : 'Theft Risk (Negligible)'}
                  </p>
                </div>
              </div>

              {/* Grid Balance Breakdown */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-grid-dark p-3 text-center text-xs">
                <div>
                  <p className="text-theme-muted">Feeder Supply</p>
                  <p className="font-semibold text-theme-text">{result.transformer_supply_kw} kW</p>
                </div>
                <div>
                  <p className="text-theme-muted">Metered Total</p>
                  <p className="font-semibold text-theme-text">{result.total_metered_kw} kW</p>
                </div>
                <div>
                  <p className="text-theme-muted">Line Loss Delta</p>
                  <p
                    className={`font-semibold ${
                      result.line_loss_percent > 10 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {result.line_loss_percent}%
                  </p>
                </div>
              </div>

              {/* Positive Indicators (in green) */}
              {result.positive_indicators && result.positive_indicators.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-emerald-500/20 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Positive Health Indications
                  </p>
                  <ul className="space-y-1 text-xs text-emerald-200/90">
                    {result.positive_indicators.map((indicator, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span>{indicator}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Theft Reasons */}
              {result.theft_reasons && result.theft_reasons.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-red-500/20 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Anomaly & Explainability Reasons
                  </p>
                  <ul className="space-y-1 text-xs text-red-300">
                    {result.theft_reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  {result.alert_created && (
                    <p className="mt-2 text-xs font-medium text-amber-400">
                      ⚡ Automated critical grid alert dispatched to control room!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-grid-border bg-black/20 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-theme-muted hover:text-theme-text"
          >
            Close
          </button>
          <button
            onClick={() => handleRunCalculation()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-theme-text shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Computing Grid Balance & Theft…</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Calculate Real-Time Grid & Theft</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
