from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Alert, Meter, MeterReading, Prediction, Transformer, DigitalTwin
from app.schemas import DashboardSummary

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    total_meters = await db.scalar(select(func.count()).select_from(Meter)) or 0
    active_alerts = await db.scalar(
        select(func.count()).select_from(Alert).where(Alert.status == "open")
    ) or 0
    avg_health = await db.scalar(select(func.avg(Transformer.health_score))) or 0.0
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    total_power = await db.scalar(
        select(func.coalesce(func.sum(MeterReading.power_kw), 0.0))
        .select_from(MeterReading)
        .where(MeterReading.timestamp >= one_hour_ago)
    ) or 0.0
    high_risk = await db.scalar(
        select(func.count())
        .select_from(Prediction)
        .where(Prediction.prediction_type == "theft", Prediction.probability >= 0.7)
    ) or 0
    open_predictions = await db.scalar(
        select(func.count()).select_from(Prediction).where(Prediction.prediction_type == "theft")
    ) or 0
    revenue_at_risk = await db.scalar(
        select(func.coalesce(func.sum(Prediction.revenue_impact), 0.0))
        .where(Prediction.prediction_type == "theft", Prediction.probability >= 0.5)
    ) or 0.0
    avg_revenue_per_meter = (
        float(revenue_at_risk) / high_risk if high_risk > 0 else 0.0
    )
    avg_digital_twin_deviation = await db.scalar(
        select(func.coalesce(func.avg(DigitalTwin.deviation_score), 0.0))
    ) or 0.0
    inspection_priority_score = float(
        ((100 - float(avg_health)) * 0.35)
        + (float(total_power) / 5000.0 * 0.25)
        + (float(open_predictions) / 100.0 * 0.4)
    )

    latest_model = await db.scalar(
        select(Prediction.model_version)
        .where(Prediction.model_version.isnot(None))
        .order_by(Prediction.created_at.desc())
        .limit(1)
    )

    return DashboardSummary(
        total_meters=total_meters,
        active_alerts=active_alerts,
        avg_transformer_health=round(float(avg_health), 1),
        total_power_kw=round(float(total_power), 2),
        high_risk_meters=high_risk,
        open_theft_predictions=open_predictions,
        revenue_at_risk=round(float(revenue_at_risk), 2),
        avg_revenue_at_risk_per_meter=round(avg_revenue_per_meter, 2),
        avg_digital_twin_deviation=round(float(avg_digital_twin_deviation), 3),
        inspection_priority_score=round(inspection_priority_score, 2),
        active_model_version=latest_model or "Unregistered",
    )
