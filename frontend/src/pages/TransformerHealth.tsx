import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { api } from '@/lib/api'
import type { Transformer } from '@/types'

export default function TransformerHealth() {
  const [transformers, setTransformers] = useState<Transformer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTransformers().then(setTransformers).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-theme-muted">Loading transformers…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Transformer Health</h2>
        <p className="mt-1 text-sm text-theme-muted">
          Monitor distribution transformer load, health score, and connected meters
        </p>
      </div>

      <div className="grid gap-6">
        {transformers.map((t) => (
          <div key={t.id} className="panel">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-charlotte-900/20">
                  <Activity className="h-6 w-6 text-charlotte-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  <p className="text-sm text-theme-muted">
                    {t.capacity_kva} kVA · {t.meter_count} meters connected
                  </p>
                </div>
              </div>
              <span
                className={`badge-${t.status === 'healthy' ? 'low' : t.status === 'warning' ? 'medium' : 'high'}`}
              >
                {t.status}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-theme-muted">Health Score</p>
                <p className="text-2xl font-bold text-charlotte-500">{t.health_score}%</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-grid-panelHover">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${t.health_score}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-theme-muted">Load</p>
                <p className="text-2xl font-bold text-charlotte-400">{t.load_percent}%</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-grid-panelHover">
                  <div
                    className={`h-full rounded-full transition-all ${
                      t.load_percent > 80 ? 'bg-charlotte-700' : t.load_percent > 60 ? 'bg-charlotte-400' : 'bg-charlotte-500'
                    }`}
                    style={{ width: `${t.load_percent}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-theme-muted">Location</p>
                <p className="font-mono text-sm text-theme-muted">
                  {t.latitude?.toFixed(4)}, {t.longitude?.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
