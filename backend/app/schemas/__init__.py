from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str
    version: str
    database: str


class DashboardSummary(BaseModel):
    total_meters: int
    active_alerts: int
    avg_transformer_health: float
    total_power_kw: float
    high_risk_meters: int
    open_theft_predictions: int
    revenue_at_risk: float
    avg_revenue_at_risk_per_meter: float
    avg_digital_twin_deviation: float
    inspection_priority_score: float


class MeterBase(BaseModel):
    meter_number: str
    consumer_name: str
    address: str
    latitude: float | None = None
    longitude: float | None = None
    has_solar: bool = False
    has_ev: bool = False


class MeterResponse(MeterBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    transformer_id: UUID | None
    is_active: bool
    created_at: datetime


class MeterReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    meter_id: UUID
    timestamp: datetime
    voltage: float
    current: float
    power_kw: float
    frequency: float
    energy_kwh: float
    power_factor: float
    thd: float
    is_anomaly: bool


class TransformerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    capacity_kva: float
    latitude: float | None
    longitude: float | None
    health_score: float
    load_percent: float
    status: str
    meter_count: int = 0


class DigitalTwinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    meter_id: UUID
    avg_daily_kwh: float
    weekend_factor: float
    deviation_score: float
    peak_hours: list | None
    last_updated: datetime


class PredictionCreate(BaseModel):
    meter_id: UUID | None = None
    transformer_id: UUID | None = None
    prediction_type: str
    probability: float
    confidence: float
    expected_window_start: datetime | None = None
    expected_window_end: datetime | None = None
    revenue_impact: float | None = None
    explanation: dict | None = None
    model_version: str
    status: str | None = None
    top_feature_importance: dict | None = None


class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    meter_id: UUID | None
    transformer_id: UUID | None
    prediction_type: str
    probability: float
    confidence: float
    expected_window_start: datetime | None
    expected_window_end: datetime | None
    revenue_impact: float | None
    explanation: dict | None
    model_version: str
    status: str = "normal"
    top_feature_importance: dict | None = None
    created_at: datetime


class ModelRegistryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    version: str
    is_active: bool
    metrics: dict | None
    features: list | None
    created_at: datetime


class PredictionIngestRequest(BaseModel):
    predictions: list[PredictionCreate]
    source: str | None = None
    batch_id: str | None = None


class MeterMonitorResponse(MeterResponse):
    model_config = ConfigDict(from_attributes=True)

    current_power_kw: float | None = None
    last_reading_at: datetime | None = None
    deviation_score: float | None = None
    risk_level: str = 'normal'
    revenue_at_risk: float = 0.0
    digital_twin: DigitalTwinResponse | None = None


class InspectionPriorityResponse(BaseModel):
    transformer_id: UUID
    name: str
    priority_score: float
    health_score: float
    load_percent: float
    meter_count: int
    recommendation: str


class AssistantRequest(BaseModel):
    question: str


class AssistantResponse(BaseModel):
    answer: str
    source: str | None = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    severity: str
    status: str
    meter_id: UUID | None
    transformer_id: UUID | None
    created_at: datetime


class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str
    role: str = "operator"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool


class LiveGridCalculationRequest(BaseModel):
    meter_id: UUID | None = None
    meter_number: str | None = None
    voltage: float = 230.0
    current: float = 5.2
    power_kw: float = 1.2
    energy_kwh: float = 12.5
    transformer_supply_kw: float | None = None
    scenario: str | None = None


class LiveGridCalculationResponse(BaseModel):
    meter_id: UUID | None
    meter_number: str
    consumer_name: str
    timestamp: datetime
    power_kw: float
    voltage: float
    current: float
    energy_kwh: float
    transformer_name: str
    transformer_supply_kw: float
    total_metered_kw: float
    grid_imbalance_kw: float
    line_loss_percent: float
    theft_detected: bool
    theft_probability: float
    confidence: float
    status: str
    indicator_color: str
    risk_level: str
    positive_indicators: list[str] = []
    theft_reasons: list[str] = []
    alert_created: bool = False
    prediction_id: UUID | None = None


class LiveGridStatusResponse(BaseModel):
    transformer_name: str
    transformer_capacity_kva: float
    transformer_load_percent: float
    transformer_health_score: float
    total_meters: int
    clean_meters_count: int
    flagged_meters_count: int
    moderate_risk_count: int
    total_supply_kw: float
    total_consumption_kw: float
    line_loss_kw: float
    line_loss_percent: float
    grid_status: str
    grid_status_color: str

