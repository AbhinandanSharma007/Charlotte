export interface DashboardSummary {
  total_meters: number
  active_alerts: number
  avg_transformer_health: number
  total_power_kw: number
  high_risk_meters: number
  open_theft_predictions: number
  revenue_at_risk: number
  avg_revenue_at_risk_per_meter: number
  avg_digital_twin_deviation: number
  inspection_priority_score: number
  active_model_version?: string
}

export interface DigitalTwin {
  id: string
  meter_id: string
  avg_daily_kwh: number
  weekend_factor: number
  deviation_score: number
  peak_hours: number[] | null
  last_updated: string
}

export interface MeterMonitor {
  id: string
  meter_number: string
  consumer_name: string
  address: string
  latitude: number | null
  longitude: number | null
  transformer_id: string | null
  is_active: boolean
  created_at: string
  current_power_kw: number | null
  last_reading_at: string | null
  deviation_score: number | null
  risk_level: string
  revenue_at_risk: number
  digital_twin: DigitalTwin | null
}

export interface InspectionPriority {
  transformer_id: string
  name: string
  priority_score: number
  health_score: number
  load_percent: number
  meter_count: number
  recommendation: string
}

export interface AssistantResponse {
  answer: string
  source?: string
}


export interface Meter {
  id: string
  meter_number: string
  consumer_name: string
  address: string
  latitude: number | null
  longitude: number | null
  transformer_id: string | null
  has_solar: boolean
  has_ev: boolean
  is_active: boolean
  created_at: string
}

export interface MeterReading {
  id: string
  meter_id: string
  timestamp: string
  voltage: number
  current: number
  power_kw: number
  frequency: number
  energy_kwh: number
  power_factor: number
  thd: number
  is_anomaly: boolean
}

export interface Transformer {
  id: string
  name: string
  capacity_kva: number
  latitude: number | null
  longitude: number | null
  health_score: number
  load_percent: number
  status: string
  meter_count: number
}

export interface Prediction {
  id: string
  meter_id: string | null
  transformer_id: string | null
  prediction_type: string
  probability: number
  confidence: number
  expected_window_start: string | null
  expected_window_end: string | null
  revenue_impact: number | null
  explanation: {
    reasons?: string[]
    confidence?: number
  } | null
  model_version?: string
  status?: string
  top_feature_importance?: Record<string, number> | null
  created_at: string
}

export interface Alert {
  id: string
  title: string
  description: string | null
  severity: string
  status: string
  meter_id: string | null
  transformer_id: string | null
  created_at: string
}

export interface LiveGridCalculationRequest {
  meter_id?: string | null
  meter_number?: string | null
  voltage?: number
  current?: number
  power_kw?: number
  energy_kwh?: number
  transformer_supply_kw?: number | null
  scenario?: 'normal' | 'meter_bypass' | 'direct_hooking' | string | null
}

export interface LiveGridCalculationResponse {
  meter_id: string | null
  meter_number: string
  consumer_name: string
  timestamp: string
  power_kw: number
  voltage: number
  current: number
  energy_kwh: number
  transformer_name: string
  transformer_supply_kw: number
  total_metered_kw: number
  grid_imbalance_kw: number
  line_loss_percent: number
  theft_detected: boolean
  theft_probability: number
  confidence: number
  status: 'verified_clean' | 'flagged_theft' | string
  indicator_color: 'green' | 'red' | 'yellow'
  risk_level: 'normal' | 'medium' | 'high' | 'critical'
  positive_indicators: string[]
  theft_reasons: string[]
  alert_created: boolean
  prediction_id: string | null
}

export interface LiveGridStatusResponse {
  transformer_name: string
  transformer_capacity_kva: number
  transformer_load_percent: number
  transformer_health_score: number
  total_meters: number
  clean_meters_count: number
  flagged_meters_count: number
  moderate_risk_count: number
  total_supply_kw: number
  total_consumption_kw: number
  line_loss_kw: number
  line_loss_percent: number
  grid_status: 'balanced' | 'alert'
  grid_status_color: 'green' | 'red'
}

