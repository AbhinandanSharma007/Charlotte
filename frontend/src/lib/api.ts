import type {
  Alert,
  DashboardSummary,
  LiveGridCalculationRequest,
  LiveGridCalculationResponse,
  LiveGridStatusResponse,
  Meter,
  MeterReading,
  Prediction,
  Transformer,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export const api = {
  getDashboardSummary: () =>
    fetchApi<DashboardSummary>('/api/v1/dashboard/summary'),

  getMeters: (skip = 0, limit = 100) =>
    fetchApi<Meter[]>(`/api/v1/meters?skip=${skip}&limit=${limit}`),

  getMeter: (id: string) => fetchApi<Meter>(`/api/v1/meters/${id}`),

  getMeterReadings: (id: string, limit = 24) =>
    fetchApi<MeterReading[]>(`/api/v1/meters/${id}/readings?limit=${limit}`),

  getTransformers: () => fetchApi<Transformer[]>('/api/v1/transformers'),

  getTheftPredictions: (minProbability = 0.5) =>
    fetchApi<Prediction[]>(
      `/api/v1/predictions/theft?min_probability=${minProbability}&limit=20`,
    ),

  getAlerts: (status?: string) => {
    const params = status ? `?status=${status}` : ''
    return fetchApi<Alert[]>(`/api/v1/alerts${params}`)
  },

  healthCheck: () => fetchApi<{ status: string; version: string }>('/health'),

  // Live Grid & Theft Calculation APIs
  getLiveGridStatus: () =>
    fetchApi<LiveGridStatusResponse>('/api/v1/monitoring/live-grid/status'),

  calculateLiveGridTheft: async (payload: LiveGridCalculationRequest) => {
    const res = await fetch(`${API_BASE}/api/v1/monitoring/live-grid/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
    return res.json() as Promise<LiveGridCalculationResponse>
  },

  // Monitoring APIs
  getMeterMonitoring: (id: string) => fetchApi<any>(`/api/v1/monitoring/meters/${id}`),
  getInspectionPriority: () => fetchApi<any[]>('/api/v1/monitoring/inspection-priority'),

  // Assistant
  assistantQuery: async (question: string) => {
    const res = await fetch(`${API_BASE}/api/v1/monitoring/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
    return res.json()
  },
}
