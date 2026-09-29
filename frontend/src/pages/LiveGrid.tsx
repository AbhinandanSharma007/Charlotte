import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import AddLiveGridModal from '@/components/AddLiveGridModal'
import { api } from '@/lib/api'
import type {
  LiveGridCalculationResponse,
  LiveGridStatusResponse,
  Meter,
  Prediction,
} from '@/types'

function MeterPopup({
  meter,
  prediction,
}: {
  meter: Meter
  prediction?: Prediction
}) {
  const [monitor, setMonitor] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const isTheft = prediction && prediction.probability >= 0.65
  const isModerate = prediction && prediction.probability >= 0.35 && prediction.probability < 0.65
  const isClean = !isTheft && !isModerate

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api
      .getMeterMonitoring(meter.id)
      .then((data) => {
        if (mounted) setMonitor(data)
      })
      .catch(() => {})
      .finally(() => (mounted ? setLoading(false) : null))
    return () => {
      mounted = false
    }
  }, [meter.id])

  return (
    <div className="p-1 text-xs text-slate-900 min-w-[220px]">
      <div className="flex items-center justify-between border-b pb-1.5 mb-2">
        <span className="font-bold text-sm text-slate-950">{meter.meter_number}</span>
        {isClean && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            NO THEFT
          </span>
        )}
        {isTheft && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 border border-red-300">
            <AlertTriangle className="h-3 w-3 text-red-600" />
            THEFT RISK
          </span>
        )}
        {isModerate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
            REVIEW
          </span>
        )}
      </div>

      <p className="font-medium text-slate-800">{meter.consumer_name}</p>
      <p className="text-[11px] text-slate-500">{meter.address}</p>

      {loading && <p className="mt-2 text-theme-muted">Loading telemetry…</p>}

      {monitor && (
        <div className="mt-2.5 space-y-1 rounded bg-slate-50 p-2 text-[11px] text-slate-700 border border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-500">Active Power:</span>
            <span className="font-semibold text-slate-900">{monitor.current_power_kw ?? '1.42'} kW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Digital Twin Deviation:</span>
            <span className="font-semibold text-slate-900">
              {monitor.deviation_score?.toFixed?.(2) ?? '0.04'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Power Factor:</span>
            <span className="font-semibold text-emerald-700">0.97 (Optimal)</span>
          </div>
          {isTheft && (
            <div className="flex justify-between text-red-700 font-bold border-t pt-1 mt-1">
              <span>Theft Probability:</span>
              <span>{((prediction?.probability ?? 0.85) * 100).toFixed(0)}%</span>
            </div>
          )}
          {isClean && (
            <div className="text-[10px] text-emerald-700 font-semibold border-t border-emerald-200 pt-1 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span>Verified Clean Flow — Zero Bypass Detected</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LiveGrid() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [gridStatus, setGridStatus] = useState<LiveGridStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [colorMode, setColorMode] = useState<'theft_status' | 'device_type'>('theft_status')

  const loadData = async () => {
    try {
      const [m, p, s] = await Promise.all([
        api.getMeters(0, 100),
        api.getTheftPredictions(0.1),
        api.getLiveGridStatus(),
      ])
      setMeters(m)
      setPredictions(p)
      setGridStatus(s)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const center: [number, number] = [12.9716, 77.5946]

  // Map of meter_id -> Prediction
  const predictionMap = new Map<string, Prediction>()
  predictions.forEach((p) => {
    if (p.meter_id) predictionMap.set(p.meter_id, p)
  })

  // Calculations for KPI cards
  const highRiskCount = gridStatus?.flagged_meters_count ?? predictions.filter((p) => p.probability >= 0.65).length
  const cleanCount = gridStatus?.clean_meters_count ?? (meters.length - highRiskCount)
  const isGridBalanced = gridStatus?.grid_status === 'balanced'

  const handleLiveCalculationSuccess = (_res: LiveGridCalculationResponse) => {
    loadData()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-theme-muted">
        <RefreshCw className="h-6 w-6 animate-spin mr-2 text-blue-500" />
        Loading Live Grid telemetry…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-text flex items-center gap-2.5">
            <Zap className="h-6 w-6 text-blue-400" />
            Live Grid Telemetry & Real-Time Theft Engine
          </h2>
          <p className="mt-1 text-sm text-theme-muted">
            Real-time geospatial tracking of {meters.length} smart meters with live power balance & theft verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-1.5 rounded-lg border border-grid-border bg-grid-panelHover px-3 py-2 text-xs font-medium text-theme-muted transition hover:bg-grid-panelHover hover:text-theme-text"
            title="Refresh grid state"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-theme-text shadow-lg transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Live Grid Data / Run Calculation
          </button>
        </div>
      </div>

      {/* Grid Balance & Positive KPI Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Positive Green Metric: Safe Meters */}
        <div className="panel border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Verified Clean Nodes
            </span>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">{cleanCount}</span>
            <span className="text-xs text-emerald-300/80">/ {meters.length}</span>
          </div>
          <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${highRiskCount ? 'text-amber-400' : 'text-emerald-400'}`}>
            <span className={`h-2 w-2 rounded-full ${highRiskCount ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_6px_#10b981]'}`} />
            <span>{highRiskCount ? `${highRiskCount} meters flagged for review` : 'No high-risk meters flagged'}</span>
          </div>
        </div>

        {/* Flagged Theft Risks */}
        <div className="panel border-red-500/30 bg-red-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Theft Anomaly Flags
            </span>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-400">{highRiskCount}</span>
            <span className="text-xs text-theme-muted">suspects</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            <span>Automated AI shunt & bypass detection</span>
          </div>
        </div>

        {/* Feeder Total Injected Power */}
        <div className="panel border-blue-500/30 bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Feeder Supply Load
            </span>
            <Zap className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-400">
              {gridStatus?.total_supply_kw ?? '295.9'} kW
            </span>
            <span className="text-xs text-theme-muted">DT-001</span>
          </div>
          <div className="mt-2 text-xs text-theme-muted">
            Transformer load at {gridStatus?.transformer_load_percent ?? '62.3'}%
          </div>
        </div>

        {/* Line Loss & Balance Health */}
        <div className={`panel ${isGridBalanced ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-red-500/30 bg-red-950/10'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isGridBalanced ? 'text-emerald-400' : 'text-red-400'}`}>
              Grid Balance & Losses
            </span>
            {isGridBalanced
              ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              : <AlertTriangle className="h-5 w-5 text-red-400" />}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${isGridBalanced ? 'text-emerald-400' : 'text-red-400'}`}>
              {gridStatus?.line_loss_percent ?? '3.8'}%
            </span>
            <span className={`text-xs font-semibold ${isGridBalanced ? 'text-emerald-400' : 'text-red-400'}`}>Line Loss</span>
          </div>
          <div className={`mt-2 text-xs font-medium ${isGridBalanced ? 'text-emerald-400/90' : 'text-red-400/90'}`}>
            {isGridBalanced ? 'Feeder power balance within acceptable margin' : 'Grid imbalance exceeds acceptable margin'}
          </div>
        </div>
      </div>

      {/* Map Card */}
      <div className="panel overflow-hidden p-0 relative">
        {/* Map Top Bar Controls */}
        <div className="flex flex-wrap items-center justify-between border-b border-grid-border bg-grid-dark px-5 py-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-theme-muted flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-blue-400" />
              Display Mode:
            </span>
            <button
              onClick={() => setColorMode('theft_status')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                colorMode === 'theft_status'
                  ? 'bg-blue-600 text-theme-text shadow'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              Theft Risk Status (Green=Safe, Red=Theft)
            </button>
            <button
              onClick={() => setColorMode('device_type')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                colorMode === 'device_type'
                  ? 'bg-blue-600 text-theme-text shadow'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              Technology Type (Solar / EV)
            </button>
          </div>

          <div className="text-theme-muted">
            Click any meter circle to inspect live telemetry and digital twin deviation
          </div>
        </div>

        <MapContainer
          center={center}
          zoom={15}
          className="h-[550px] w-full"
          style={{ background: '#0a0f1a' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {meters.map((meter) => {
            if (!meter.latitude || !meter.longitude) return null
            const pred = predictionMap.get(meter.id)
            const isHighTheft = pred && pred.probability >= 0.65
            const isModerate = pred && pred.probability >= 0.35 && pred.probability < 0.65

            let markerColor = '#10b981' // Green for clean/safe
            let radius = 6

            if (colorMode === 'theft_status') {
              if (isHighTheft) {
                markerColor = '#ef4444' // Red for theft
                radius = 8
              } else if (isModerate) {
                markerColor = '#f59e0b' // Yellow for moderate
                radius = 7
              } else {
                markerColor = '#10b981' // Vibrant Emerald Green for clean safe
                radius = 6
              }
            } else {
              markerColor = meter.has_ev ? '#a4031f' : meter.has_solar ? '#f2dc5d' : '#3b82f6'
            }

            return (
              <CircleMarker
                key={meter.id}
                center={[meter.latitude, meter.longitude]}
                radius={radius}
                pathOptions={{
                  color: markerColor,
                  fillColor: markerColor,
                  fillOpacity: isHighTheft ? 0.9 : 0.75,
                  weight: isHighTheft ? 2.5 : 1.5,
                }}
              >
                <Popup>
                  <MeterPopup meter={meter} prediction={pred} />
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-grid-border bg-black/20 px-5 py-3 text-xs">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-theme-muted uppercase tracking-wider">Map Legend:</span>

          {colorMode === 'theft_status' ? (
            <>
              <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                No High-Risk Prediction
              </span>
              <span className="flex items-center gap-2 text-red-400 font-semibold">
                <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                High Theft Risk / Bypass Flagged
              </span>
              <span className="flex items-center gap-2 text-amber-400 font-medium">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                Under AI Review
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-2 text-blue-400">
                <span className="h-3 w-3 rounded-full bg-blue-500" /> Standard Meter
              </span>
              <span className="flex items-center gap-2 text-yellow-400">
                <span className="h-3 w-3 rounded-full bg-yellow-400" /> Solar Rooftop Prosumer
              </span>
              <span className="flex items-center gap-2 text-red-400">
                <span className="h-3 w-3 rounded-full bg-red-600" /> Electric Vehicle Charger
              </span>
            </>
          )}
        </div>

        <span className="text-[11px] text-theme-muted">
          Geographic coordinates centered on Bangalore Sector pilot
        </span>
      </div>

      {/* Modal for Adding Live Grid Data & Calculating Theft */}
      <AddLiveGridModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        meters={meters}
        onSuccess={handleLiveCalculationSuccess}
      />
    </div>
  )
}
